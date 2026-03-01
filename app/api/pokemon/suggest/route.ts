import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@/lib/supabase/apiAuth';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_MINUTE = 4;

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  const requestTimestamps = (rateLimitMap.get(ip) || []).filter((t: number) => t > windowStart);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) return true;
  requestTimestamps.push(now);
  rateLimitMap.set(ip, requestTimestamps);
  return false;
}

const PARADOX_LIST = ["great tusk", "scream tail", "brute bonnet", "flutter mane", "slither wing", "sandy shocks", "iron treads", "iron bundle", "iron hands", "iron jugulis", "iron moth", "iron thorns", "roaring moon", "iron valiant", "walking wake", "iron leaves", "gouging fire", "raging bolt", "iron boulder", "iron crown"];
const UB_LIST = ["nihilego", "buzzwole", "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord", "poipole", "naganadel", "stakataka", "blacephalon"];
const MYTHICAL_LIST = ["mew", "celebi", "jirachi", "deoxys", "phione", "manaphy", "darkrai", "shaymin", "arceus", "victini", "keldeo", "meloetta", "genesect", "diancie", "hoopa", "volcanion", "magearna", "marshadow", "zeraora", "meltan", "melmetal", "zarude", "pecharunt"];
const LEGENDARY_LIST = [
  "articuno", "zapdos", "moltres", "mewtwo", "raikou", "entei", "suicune", "lugia", "ho-oh",
  "regirock", "regice", "registeel", "latias", "latios", "kyogre", "groudon", "rayquaza",
  "uxie", "mesprit", "azelf", "dialga", "palkia", "heatran", "regigigas", "giratina", "cresselia",
  "cobalion", "terrakion", "virizion", "tornadus", "thundurus", "reshiram", "zekrom", "landorus", "kyurem",
  "xerneas", "yveltal", "zygarde", "type: null", "silvally", "tapu koko", "tapu lele", "tapu bulu", "tapu fini",
  "cosmog", "cosmoem", "solgaleo", "lunala", "necrozma", "zacian", "zamazenta", "eternatus", "kubfu", "urshifu",
  "regieleki", "regidrago", "glastrier", "spectrier", "calyrex", "enamorus", "wo-chien", "chien-pao", "ting-lu",
  "chi-yu", "koraidon", "miraidon", "okidogi", "munkidori", "fezandipiti", "ogerpon", "terapagos"
];

function toNum(id: any): number { return Number(id); }
function idInList(id: any, list: number[]): boolean { return list.includes(toNum(id)); }

const MODEL_PRIORITY = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash"];

async function generateWithFallback(prompt: string) {
  let lastError = null;
  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(prompt);
    } catch (error: any) {
      lastError = error;
      if (error.status === 429 || error.status === 404) continue;
      throw error;
    }
  }
  throw lastError;
}

async function getLegalMovesFromPokeAPI(pokemonName: string) {
  try {
    const cleanName = pokemonName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.moves.map((m: any) => m.move.name).join(', ');
  } catch { return null; }
}

function isExcluded(nombre: string, config: any): boolean {
  const name = nombre.toLowerCase();
  if (!config.allowParadox && PARADOX_LIST.includes(name)) return true;
  if (!config.allowUB && UB_LIST.includes(name)) return true;
  if (!config.allowMythical && MYTHICAL_LIST.includes(name)) return true;
  if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) return true;
  return false;
}

function buildModeModifiers(config: any): string {
  let m = "";
  if (config.isLittleCup) m += " FORMATO LITTLE CUP (Solo pre-evoluciones nivel 5).";
  if (config.isRandomizer) m += " ESTRATEGIAS CAÓTICAS Y RANDOM.";
  if (config.isMonotype && config.monoTypeSelected) m += ` MODO MONOTYPE: TODOS los Pokémon DEBEN ser de tipo ${config.monoTypeSelected}.`;
  if (config.preferredWeather && config.preferredWeather !== 'none') m += ` PRIORIZA clima ${config.preferredWeather}. Incluye un setter.`;
  if (config.preferredTerrain && config.preferredTerrain !== 'none') m += ` PRIORIZA terreno ${config.preferredTerrain}. Incluye un setter.`;
  if (config.preferTrickRoom) m += " PRIORIZA Trick Room: setter + Pokémon lentos con alto ataque.";
  if (config.preferTailwind) m += " PRIORIZA Tailwind: setter + abusers rápidos.";
  if (config.teamArchetype === 'offense') m += " ARQUETIPO OFENSIVO.";
  if (config.teamArchetype === 'balance') m += " ARQUETIPO BALANCE.";
  if (config.teamArchetype === 'stall') m += " ARQUETIPO STALL.";
  if (config.enableMega) m += " MEGA EVOLUTION: Asigna la Mega Stone a 1 miembro.";
  if (config.enableZMoves) m += " Z-MOVES: Puedes asignar 1 Z-Crystal.";
  if (config.enableTera) {
    m += config.preferredTeraType
      ? ` TERACRISTALIZACION: prioriza tipo ${config.preferredTeraType}.`
      : ` TERACRISTALIZACION: incluye "teraType" con el Tera Type mas estrategico.`;
  }
  if (config.allowLegendaries) m += " LEGENDARIOS PERMITIDOS: incluye 1-2 Legendarios top-tier si hay sinergia.";
  if (config.allowParadox) m += " PARADOJAS PERMITIDAS: considera Pokémon Paradoja por su dominancia en el meta.";
  return m;
}

// ─── Instrucción de nivel de análisis ────────────────────────────
// Se construye aquí para reutilizarla en ambos prompts (scratch y normal).
function buildExperiencePrompt(level: string): string {
  if (level === 'novato') {
    return `MODO NOVATO: Redacta el análisis con lenguaje accesible, usa analogías para explicar las sinergias y aclara brevemente por qué cada decisión es buena. Mantén la jerga técnica en inglés (Trick Room, Pivot, etc.) pero explica su significado la primera vez que aparezca.`;
  }
  return `MODO EXPERTO: Redacta el análisis asumiendo conocimiento avanzado de Smogon y VGC. Usa terminología técnica sin explicaciones básicas. Profundiza en matchups, speed tiers, damage calcs aproximados y win conditions específicas.`;
}

// ─── REGLAS COMPETITIVAS ÉLITE ────────────────────────────────────
const ELITE_COMPETITIVE_RULES = `
  4. LÓGICA COMPETITIVA AVANZADA (NIVEL VGC/SMOGON ÉLITE):
     - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band/Specs/Scarf" o "Assault Vest",
       SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO (cero movimientos de estado).
     - EVIOLITE: Pre-evoluciones viables (Porygon2, Dusclops, Clefairy) deben llevar Eviolite.
     - OBJETOS EXCLUSIVOS: 'Light Ball' para Pikachu, 'Thick Club' para Marowak.
     - SINERGIAS DINÁMICAS: Setter de Clima → incluye abusers (Swift Swim / Chlorophyll).

  4b. BALANCE OFENSIVO FÍSICO / ESPECIAL:
     - El equipo DEBE tener al menos 2 atacantes físicos (Atk) y 2 especiales (SpA).
       Esto evita ser bloqueado por un único wall como Toxapex o Clefable.
     - Atacantes físicos de referencia: Incineroar, Rillaboom, Urshifu, Landorus-T, Garchomp,
       Dragonite, Zacian, Talonflame, Scizor, Mimikyu.
     - Atacantes especiales de referencia: Flutter Mane, Miraidon, Heatran, Iron Bundle,
       Calyrex-Shadow, Tapu Lele, Dragapult (SpA set), Hydreigon, Primarina, Volcarona.
     - EXCEPCIÓN TRICK ROOM: Esta regla NO aplica bajo TR. Bajo TR prioriza los mejores
       lentos disponibles sin restricción de balance, porque el Speed Control ya compensa
       la falta de versatilidad ofensiva.
     - EXCEPCIÓN MONOTYPE: Si el pool del tipo sólo tiene un lado, acepta el desequilibrio
       pero incluye al menos 1 Pokémon mixto o de cobertura cruzada.

  5. TERMINOLOGÍA ESTRICTA (PROHIBIDO TRADUCIR JERGA):
     - Reporte en Español, pero movimientos/objetos/habilidades/mecánicas EN INGLÉS ORIGINAL.
     - SIEMPRE "Trick Room" (nunca "Habitación de Truco").
     - SIEMPRE "Tailwind" (nunca "Viento Afín").
     - Sin traducir: "Entry Hazards", "Setup Sweeper", "Speed Control", "Pivot", "Wallbreaker".
`;

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const origin = request.headers.get('origin');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.NODE_ENV === 'production' && siteUrl && origin !== siteUrl) {
      return NextResponse.json({ error: "ACCESO_DENEGADO", message: "Petición no autorizada." }, { status: 403 });
    }

    if (isRateLimited(user!.id)) {
      return NextResponse.json({ error: "DEMASIADAS_PETICIONES", message: "Espera 1 minuto." }, { status: 429 });
    }

    const { leaderId, config, lockedIds = [], ignoredIds = [], scratchMode = false } = await request.json();
    if (!API_KEY) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    // Normalizar IDs (BigInt vs number)
    const normalizedLockedIds: number[] = lockedIds.map(Number);
    const normalizedIgnoredIds: number[] = ignoredIds.map(Number);

    const modeModifiers = buildModeModifiers(config);

    // ─── Nivel de análisis — se inyecta en AMBOS prompts ─────────
    const experiencePrompt = buildExperiencePrompt(config.experienceLevel);

    const hasItemClause = config.clauses?.some((c: string) => c.toLowerCase().includes('item clause'));
    const itemClauseRule = hasItemClause
      ? "3. ITEM CLAUSE ACTIVA: PROHIBIDO REPETIR OBJETOS."
      : "3. OBJETOS: Variedad, pero usa Eviolite y Objetos Exclusivos donde sea óptimo.";

    // ═══════════════════════════════════════════════════════════════
    // MODO SCRATCH
    // ═══════════════════════════════════════════════════════════════
    if (scratchMode) {
      const rawPool: any[] = await prisma.$queryRaw`
        SELECT p.id, p.nombre, p.tipo1, p.tipo2, am.perfil_estrategico, am.usage_score, am.tier
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
        LIMIT 150
      `;

      const filteredPool = rawPool
        .filter(p => !idInList(p.id, normalizedIgnoredIds))
        .filter(p => !isExcluded(p.nombre, config))
        .map(p => ({ ...p, id: toNum(p.id) }));

      const highMeta = filteredPool.filter(p => (p.usage_score ?? 0) > 15).slice(0, 20);
      const viable   = filteredPool.filter(p => (p.usage_score ?? 0) > 3 && (p.usage_score ?? 0) <= 15).slice(0, 14);
      const niche    = filteredPool.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 6);
      const candidatePool = [...highMeta, ...viable, ...niche];

      const candidatesString = candidatePool.map(c => {
        const tier = c.tier || 'Unranked';
        const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
        const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
        return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}`;
      }).join('\n');

      const scratchPrompt = `
        Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
        FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses?.join(', ')}.
        MODIFICADORES: ${modeModifiers}
        DIRECTIVA: "${config.customStrategy || 'Crea el equipo más sinérgico posible'}"
        NIVEL DE ANÁLISIS: ${experiencePrompt}

        CANDIDATOS DISPONIBLES:
        ${candidatesString}

        --- MACRO-ESTRATEGIA ---
        - 6 Pokémon que funcionen como ecosistema. Núcleos FWG o Hada/Dragón/Acero.
        - Speed Control y/o Hazard Control según el formato.
        - IVs correctos (0 Atk para Special Attackers, 0 Spe para Trick Room).

        --- REGLAS ESTRICTAS ---
        1. LEGALIDAD: NUNCA inventes ataques ni habilidades.
        ${itemClauseRule}
        ${ELITE_COMPETITIVE_RULES}
        6. SOLO usa IDs de CANDIDATOS DISPONIBLES. NUNCA inventes IDs.

        DEVUELVE SOLO JSON:
        {
          "report": { "estrategia": "...", "ventajas": ["..."], "debilidades": ["..."],
            "leads": [{ "pokemon": "...", "condicion_uso": "...", "condicion_cambio": "..." }] },
          "selected_ids": [123, 456, 789, 321, 654, 987],
          "builds": {
            "123": { "item": "...", "ability": "...", "nature": "...", "evs": "...", "ivs": "...", "moves": ["...", "...", "...", "..."], "teraType": "..." }
          }
        }
      `;

      const result = await generateWithFallback(scratchPrompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON inválido");
      const aiData = JSON.parse(jsonMatch[0]);

      const selectedNums: number[] = (aiData.selected_ids || []).map(Number);
      let finalTeam = candidatePool.filter(p => selectedNums.includes(p.id));
      if (finalTeam.length < 6) {
        finalTeam = [...finalTeam, ...candidatePool.filter(p => !selectedNums.includes(p.id)).slice(0, 6 - finalTeam.length)];
      }

      return NextResponse.json({ team: finalTeam, validLockedIds: [], aiReport: aiData.report, builds: aiData.builds, isDynamicMode: false });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO NORMAL (CON LÍDER Y VECTORIAL)
    // ═══════════════════════════════════════════════════════════════
    const lockedDbPokemon = await prisma.pokemon.findMany({ where: { id: { in: normalizedLockedIds } } });
    const validLockedIds: number[] = [];

    for (const p of lockedDbPokemon) {
      const name = p.nombre.toLowerCase();
      let isValid = true;
      if (!config.allowParadox && PARADOX_LIST.includes(name)) isValid = false;
      if (!config.allowUB && UB_LIST.includes(name)) isValid = false;
      if (!config.allowMythical && MYTHICAL_LIST.includes(name)) isValid = false;
      if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) isValid = false;
      if (isValid) validLockedIds.push(toNum(p.id));
    }

    if (!validLockedIds.includes(Number(leaderId))) {
      return NextResponse.json({ error: "REGLA_VIOLADA", message: "Tu líder viola las exclusiones actuales." }, { status: 400 });
    }

    const leaderBasic: any[] = await prisma.$queryRaw`SELECT nombre FROM "Pokemon" WHERE id = ${parseInt(leaderId)} LIMIT 1`;
    const leaderName = leaderBasic.length > 0 ? leaderBasic[0].nombre : "Líder Desconocido";

    const leaderLegalMoves = await getLegalMovesFromPokeAPI(leaderName);
    const leaderConstraints = leaderLegalMoves
      ? `\n\nATENCIÓN: EL LÍDER (${leaderName}) TIENE MOVEPOOL RESTRINGIDO: [${leaderLegalMoves}]. NUNCA ASIGNES OTRO MOVIMIENTO.`
      : "";

    const leaderData: any[] = await prisma.$queryRaw`SELECT embedding::text as embedding FROM "AnalisisMeta" WHERE pokemon_id = ${parseInt(leaderId)} LIMIT 1`;

    let rawSuggestions: any[] = [];
    let isDynamicMode = false;

    if (leaderData && leaderData.length > 0 && leaderData[0].embedding) {
      const vectorStr = leaderData[0].embedding;
      rawSuggestions = await prisma.$queryRaw`
        SELECT p.id, p.nombre, p.tipo1, p.tipo2, am.perfil_estrategico, am.usage_score, am.tier
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        WHERE p.id != ${parseInt(leaderId)}
        ORDER BY (am.embedding <=> ${vectorStr}::vector)
               * (1.0 - LEAST(COALESCE(am.usage_score, 0) / 50.0, 0.4))
        LIMIT 80
      `;
    } else {
      isDynamicMode = true;
      rawSuggestions = await prisma.$queryRaw`
        SELECT p.id, p.nombre, p.tipo1, p.tipo2, am.perfil_estrategico, am.usage_score, am.tier
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        WHERE p.id != ${parseInt(leaderId)}
        ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
        LIMIT 80
      `;
    }

    const filtered = rawSuggestions.filter(p => {
      const name = p.nombre.toLowerCase();
      if (!config.allowParadox && PARADOX_LIST.includes(name)) return false;
      if (!config.allowUB && UB_LIST.includes(name)) return false;
      if (!config.allowMythical && MYTHICAL_LIST.includes(name)) return false;
      if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) return false;
      if (idInList(p.id, validLockedIds)) return false;
      if (idInList(p.id, normalizedIgnoredIds)) return false;
      return true;
    });

    const highMeta = filtered.filter(p => (p.usage_score ?? 0) > 20).slice(0, 14);
    const viable   = filtered.filter(p => (p.usage_score ?? 0) > 3 && (p.usage_score ?? 0) <= 20).slice(0, 12);
    const niche    = filtered.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 4);
    const candidatePool = [...highMeta, ...viable, ...niche].map(p => ({ ...p, id: toNum(p.id) }));

    const slotsToFill = 6 - validLockedIds.length;

    const candidatesString = candidatePool.map(c => {
      const tier = c.tier || 'Unranked';
      const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
      const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
      return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}`;
    }).join('\n');

    const lockedString = lockedDbPokemon
      .filter(p => validLockedIds.includes(toNum(p.id)))
      .map(p => `[ID: ${toNum(p.id)}] ${p.nombre}`)
      .join('\n');

    const prompt = `
      Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
      FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses.join(', ')}.
      MODIFICADORES: ${modeModifiers}
      NIVEL DE ANÁLISIS: ${experiencePrompt}
      LÍDER: ${leaderName}. ${leaderConstraints}
      FIJADOS:\n${lockedString}

      CANDIDATOS (Vectorizados por Sinergia Matemática):
      ${candidatesString}

      --- MACRO-ESTRATEGIA ---
      - Cierra núcleos FWG o FDS basados en el Líder.
      - Speed Control o Soporte si el Líder lo requiere.

      --- REGLAS ESTRICTAS ---
      1. LEGALIDAD: NUNCA inventes ataques.
      ${itemClauseRule}
      ${ELITE_COMPETITIVE_RULES}
      6. SOLO usa IDs de CANDIDATOS. NUNCA uses IDs externos a esa lista.

      SELECCIONA EXACTAMENTE ${slotsToFill} IDs Y GENERA BUILDS PARA LOS 6 POKÉMON.

      DEVUELVE SOLO JSON:
      {
        "report": { "estrategia": "...", "ventajas": ["..."], "debilidades": ["..."],
          "leads": [{ "pokemon": "...", "condicion_uso": "...", "condicion_cambio": "..." }] },
        "selected_ids": [123, 456],
        "builds": {
          "123": { "item": "...", "ability": "...", "nature": "...", "evs": "...", "ivs": "...", "moves": ["...", "...", "...", "..."], "teraType": "..." }
        }
      }
    `;

    const result = await generateWithFallback(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido");
    const aiData = JSON.parse(jsonMatch[0]);

    const selectedNums: number[] = (aiData.selected_ids || []).map(Number);
    let finalTeamObjects = candidatePool.filter(p => selectedNums.includes(p.id));
    if (finalTeamObjects.length < slotsToFill) {
      finalTeamObjects = [...finalTeamObjects, ...candidatePool.filter(p => !selectedNums.includes(p.id)).slice(0, slotsToFill - finalTeamObjects.length)];
    }

    return NextResponse.json({ team: finalTeamObjects, validLockedIds, aiReport: aiData.report, builds: aiData.builds, isDynamicMode });

  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json({ error: "CUOTA_AGOTADA", message: "Cuota excedida. Espera un minuto." }, { status: 429 });
    }
    return NextResponse.json({ error: "Fallo en la inferencia táctica." }, { status: 500 });
  }
}