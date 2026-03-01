import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@/lib/supabase/apiAuth';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// --- SISTEMA DE SEGURIDAD (RATE LIMITING EN MEMORIA) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_MINUTE = 4;

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  const requestTimestamps = (rateLimitMap.get(ip) || []).filter((timestamp: number) => timestamp > windowStart);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) return true;
  requestTimestamps.push(now);
  rateLimitMap.set(ip, requestTimestamps);
  return false;
}

// --- LISTAS DE EXCLUSIÓN ---
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
  } catch (error) {
    return null;
  }
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
  if (config.isMonotype && config.monoTypeSelected) m += ` MODO MONOTYPE: TODOS los Pokémon del equipo DEBEN ser de tipo ${config.monoTypeSelected}.`;
  if (config.preferredWeather && config.preferredWeather !== 'none') m += ` PRIORIZA clima ${config.preferredWeather}. Incluye un setter de este clima.`;
  if (config.preferredTerrain && config.preferredTerrain !== 'none') m += ` PRIORIZA terreno ${config.preferredTerrain}. Incluye un setter.`;
  if (config.preferTrickRoom) m += " PRIORIZA Trick Room: incluye un setter de Trick Room y Pokémon lentos con alto ataque.";
  if (config.preferTailwind) m += " PRIORIZA Tailwind: incluye un setter de Tailwind y abusers rápidos.";
  if (config.teamArchetype === 'offense') m += " ARQUETIPO OFENSIVO: Prioriza Pokémon rápidos que golpeen fuerte (Setup Sweepers, Wallbreakers).";
  if (config.teamArchetype === 'balance') m += " ARQUETIPO BALANCE: Núcleo defensivo robusto + 2 o 3 atacantes.";
  if (config.teamArchetype === 'stall') m += " ARQUETIPO STALL: Prioriza Pokémon con altas defensas, Toxic, Hazards y Recover/Soft-Boiled.";
  if (config.enableMega) m += " MEGA EVOLUTION: Asigna la Mega Stone correspondiente a 1 miembro.";
  if (config.enableZMoves) m += " Z-MOVES: Puedes asignar 1 Z-Crystal.";
  if (config.enableTera) {
    m += config.preferredTeraType
      ? ` TERACRISTALIZACION ACTIVA: prioriza tipo ${config.preferredTeraType}. Incluye "teraType" en cada build.`
      : ` TERACRISTALIZACION ACTIVA: Incluye "teraType" en cada build con el Tera Type mas estrategico.`;
  }
  return m;
}

const ELITE_COMPETITIVE_RULES = `
  4. LÓGICA COMPETITIVA AVANZADA (NIVEL VGC/SMOGON ÉLITE):
     - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band/Specs/Scarf" o "Assault Vest", SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO (Cero movimientos de estado).
     - EVIOLITE (MINERAL EVOLUTIVO): Si seleccionas una pre-evolución viable (ej. Porygon2, Chansey, Bisharp, Clefairy, Dusclops, Dipplin), debes equiparle 'Eviolite' casi obligatoriamente para multiplicar su bulk.
     - OBJETOS EXCLUSIVOS: Usa 'Light Ball' para Pikachu, 'Thick Club' para Marowak, y 'Soul Dew' para Latios/Latias si corresponde.
     - DINÁMICAS DE PESO: Considera el peso del Pokémon. Si es súper pesado (ej. Snorlax, Celesteela), ponle 'Heavy Slam'. Advierte en debilidades si el equipo teme a 'Grass Knot'.
     - SINERGIAS DINÁMICAS: Evalúa habilidades. Si asignas un Setter de Clima (Drizzle/Drought), asegúrate de incluir abusers (Swift Swim/Chlorophyll). Utiliza redirectores (Follow Me/Rage Powder) si el equipo necesita proteger Setups o Trick Room.
     - REGLA AIR BALLOON: NUNCA le des "Air Balloon" a un Pokémon de tipo Volador o con la habilidad Levitación.
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
      return NextResponse.json({
        error: "DEMASIADAS_PETICIONES",
        message: "Has superado el límite. Por favor, espera 1 minuto."
      }, { status: 429 });
    }

    const { leaderId, config, lockedIds = [], ignoredIds = [], scratchMode = false } = await request.json();
    if (!API_KEY) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const modeModifiers = buildModeModifiers(config);
    const hasItemClause = config.clauses?.some((c: string) => c.toLowerCase().includes('item clause'));
    const itemClauseRule = hasItemClause
      ? "3. ITEM CLAUSE ACTIVA (¡MUY IMPORTANTE!): ESTÁ TOTALMENTE PROHIBIDO REPETIR OBJETOS. Los 6 Pokémon DEBEN tener un objeto diferente."
      : "3. OBJETOS: Intenta dar variedad de objetos al equipo, pero usa Eviolite y Objetos Exclusivos donde sea matemáticamente óptimo.";
    
    const experiencePrompt = config.experienceLevel === 'novato'
      ? `MODO NOVATO: Explica la estrategia de forma simple y didáctica.`
      : `MODO EXPERTO: Utiliza jerga competitiva avanzada de Smogon y VGC (Entry Hazards, Sweepers, Pivots, Speed Tiers, Checks/Counters).`;

    // ═══════════════════════════════════════════════════════════════
    // MODO SCRATCH
    // ═══════════════════════════════════════════════════════════════
    if (scratchMode) {
      const rawPool: any[] = await prisma.$queryRaw`
        SELECT p.id, p.nombre, p.tipo1, p.tipo2, am.perfil_estrategico, am.usage_score, am.tier
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
        LIMIT 120
      `;

      const filteredPool = rawPool.filter(p => !isExcluded(p.nombre, config));
      const highMeta = filteredPool.filter(p => (p.usage_score ?? 0) > 20).slice(0, 20);
      const viable   = filteredPool.filter(p => (p.usage_score ?? 0) > 3 && (p.usage_score ?? 0) <= 20).slice(0, 14);
      const niche    = filteredPool.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 6);
      const candidatePool = [...highMeta, ...viable, ...niche];

      const candidatesString = candidatePool.map(c => {
        const tier = c.tier || 'Unranked';
        const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
        const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
        return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}`;
      }).join('\n');

      const scratchPrompt = `
        Eres el "Head Coach" y Analista Táctico Principal de un equipo campeón mundial de Pokémon. 
        Tu objetivo es diseñar un equipo competitivo de grado comercial, matemáticamente perfecto y digno de un torneo regional.
        
        FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses?.join(', ')}.
        MODIFICADORES DE MODO: ${modeModifiers}
        DIRECTIVA TÁCTICA DEL USUARIO: "${config.customStrategy || 'Crea el equipo más sinérgico, balanceado y competitivo posible'}"
        NIVEL DE EXPLICACIÓN: ${experiencePrompt}

        CANDIDATOS DISPONIBLES (Filtrados por viabilidad):
        ${candidatesString}

        --- ROLES Y MACRO-ESTRATEGIA (¡CRÍTICO!) ---
        Debes ensamblar exactamente 6 Pokémon que funcionen como un ecosistema perfecto.
        - NÚCLEOS DEFENSIVOS (Cores): Intenta formar un núcleo Fuego/Agua/Planta (FWG) o un núcleo Hada/Dragón/Acero (FDS).
        - CONTROL DE VELOCIDAD (Speed Control): Incluye herramientas de control de velocidad pertinentes al formato.
        - CONTROL DE HAZARDS (Singles): Obligatorio incluir Trampa Rocas (Stealth Rock) y un eliminador (Defog, Rapid Spin).
        - MOMENTUM: Prioriza Pivots (U-turn, Volt Switch, Parting Shot).

        --- OPTIMIZACIÓN DE STATS (EVs e IVs) ---
        - EVS COMPETITIVOS: Usa EVs especializados (no solo 252/252/4 a ciegas) para tanques.
        - IVS PERFECTOS: Atacantes especiales puros DEBEN tener "0 Atk" en sus IVs (para Foul Play/Confusión). Pokémon de Trick Room DEBEN tener "0 Spe".

        --- REGLAS ESTRICTAS DE TORNEO ---
        1. LEGALIDAD: NUNCA inventes ataques ni habilidades. Usa solo el movepool legal.
        ${itemClauseRule}
        ${ELITE_COMPETITIVE_RULES}
        5. FORMATO DE SALIDA: En los arrays de "selected_ids", usa ÚNICAMENTE los números enteros.
        6. REDACCIÓN DEL REPORTE: Sé exhaustivo. Describe las "Win Conditions". NUNCA menciones los IDs numéricos en tu texto.

        DEVUELVE SOLO JSON:
        {
          "report": {
            "estrategia": "Escribe un análisis magistral. Usa \\n\\n para párrafos. Incluye: 1) Visión general. 2) Sinergia de los núcleos (Cores). 3) Condiciones de Victoria (Win Conditions). 4) Mecánicas avanzadas aplicadas.",
            "ventajas": ["Ventaja táctica 1", "Ventaja 2"],
            "debilidades": ["Debilidad 1", "Debilidad 2"],
            "leads": [{ "pokemon": "Nombre", "condicion_uso": "Ideal contra...", "condicion_cambio": "Cambiar si..." }]
          },
          "selected_ids": [123, 456, 789, 321, 654, 987],
          "builds": {
            "123": { "item": "...", "ability": "...", "nature": "...", "evs": "252 HP / 252 Def / 4 SpD", "ivs": "31 HP / 0 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe", "moves": ["...", "...", "...", "..."], "teraType": "..." }
          }
        }
      `;

      const result = await generateWithFallback(scratchPrompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON inválido");
      const aiData = JSON.parse(jsonMatch[0]);

      let finalTeam = candidatePool.filter(p => aiData.selected_ids.includes(p.id));
      if (finalTeam.length < 6) {
        const unused = candidatePool.filter(p => !aiData.selected_ids.includes(p.id));
        finalTeam = [...finalTeam, ...unused.slice(0, 6 - finalTeam.length)];
      }

      return NextResponse.json({ team: finalTeam, validLockedIds: [], aiReport: aiData.report, builds: aiData.builds, isDynamicMode: false });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO NORMAL (CON MOTOR VECTORIAL)
    // ═══════════════════════════════════════════════════════════════
    const lockedDbPokemon = await prisma.pokemon.findMany({ where: { id: { in: lockedIds.map(Number) } } });
    const validLockedIds: number[] = [];

    for (const p of lockedDbPokemon) {
      const name = p.nombre.toLowerCase();
      let isValid = true;
      if (!config.allowParadox && PARADOX_LIST.includes(name)) isValid = false;
      if (!config.allowUB && UB_LIST.includes(name)) isValid = false;
      if (!config.allowMythical && MYTHICAL_LIST.includes(name)) isValid = false;
      if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) isValid = false;
      if (isValid) validLockedIds.push(p.id);
    }

    if (!validLockedIds.includes(parseInt(leaderId))) {
      return NextResponse.json({ error: "REGLA_VIOLADA", message: "Tu líder viola las exclusiones actuales." }, { status: 400 });
    }

    const leaderBasic: any[] = await prisma.$queryRaw`SELECT nombre FROM "Pokemon" WHERE id = ${parseInt(leaderId)} LIMIT 1`;
    const leaderName = leaderBasic.length > 0 ? leaderBasic[0].nombre : "Líder Desconocido";

    const leaderLegalMoves = await getLegalMovesFromPokeAPI(leaderName);
    const leaderConstraints = leaderLegalMoves
      ? `\n\nATENCIÓN: EL LÍDER (${leaderName}) TIENE UN MOVEPOOL RESTRINGIDO: [${leaderLegalMoves}]. NUNCA ASIGNES OTRO MOVIMIENTO A ESTE POKÉMON.`
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
      if (validLockedIds.includes(p.id)) return false;
      if (ignoredIds.includes(p.id)) return false;
      return true;
    });

    const highMeta = filtered.filter(p => (p.usage_score ?? 0) > 20).slice(0, 14);
    const viable   = filtered.filter(p => (p.usage_score ?? 0) > 3 && (p.usage_score ?? 0) <= 20).slice(0, 12);
    const niche    = filtered.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 4);
    const candidatePool = [...highMeta, ...viable, ...niche];

    const slotsToFill = 6 - validLockedIds.length;

    const candidatesString = candidatePool.map(c => {
      const tier = c.tier || 'Unranked';
      const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
      const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
      return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}`;
    }).join('\n');
    
    const lockedString = lockedDbPokemon.filter(p => validLockedIds.includes(p.id)).map(p => `[ID: ${p.id}] ${p.nombre}`).join('\n');

    const prompt = `
      Eres el "Head Coach" y Analista Táctico Principal de un equipo campeón mundial de Pokémon.
      Tu trabajo es tomar a un LÍDER elegido por el usuario y rodearlo de 5 escoltas matemáticamente perfectos.

      FORMATO COMPETITIVO: ${config.format} | CLÁUSULAS: ${config.clauses.join(', ')}.
      MODIFICADORES: ${modeModifiers}
      DIRECTIVA TÁCTICA DEL USUARIO: "${config.customStrategy || 'Sinergia absoluta con el líder'}"
      NIVEL DE EXPLICACIÓN: ${experiencePrompt}
      
      LÍDER DEL EQUIPO: ${leaderName}. ${leaderConstraints}
      MIEMBROS FIJADOS OBLIGATORIOS: \n${lockedString}

      CANDIDATOS RECOMENDADOS POR IA VECTORIAL:
      ${candidatesString}

      --- MACRO-ESTRATEGIA Y CONSTRUCCIÓN ALREDEDOR DEL LÍDER ---
      - COBERTURA CRUZADA: Selecciona compañeros que cubran perfectamente las debilidades del Líder.
      - CORES ELEMENTALES: Cierra el núcleo (FWG o FDS).
      - SOPORTE: Si el líder es un Setup Sweeper, acompáñalo de redirectores o Memento/Parting Shot.
      - OPTIMIZACIÓN DE IVS/EVS: Pon "0 Atk" a atacantes especiales puros y "0 Spe" a Trick Roomers.

      --- REGLAS ESTRICTAS DE TORNEO ---
      1. LEGALIDAD: Usa solo objetos y movimientos competitivos reales. NUNCA inventes.
      ${itemClauseRule}
      ${ELITE_COMPETITIVE_RULES}
      5. FORMATO DE SALIDA: En los arrays de "selected_ids", responde usando ÚNICAMENTE los números enteros.
      6. REDACCIÓN DEL REPORTE: Usa doble salto de línea (\\n\\n) para separar párrafos. NUNCA menciones los IDs numéricos en tu texto.

      SELECCIONA EXACTAMENTE ${slotsToFill} IDs ADICIONALES Y GENERA BUILDS NIVEL MUNDIAL PARA TODOS LOS 6 POKÉMON (Incluyendo al líder).

      DEVUELVE SOLO JSON:
      {
        "report": {
          "estrategia": "Redacta un análisis táctico separando con \\n\\n. Incluye: 1) Cómo opera el equipo alrededor de ${leaderName}. 2) Núcleos defensivos. 3) Win Conditions.",
          "ventajas": ["Ventaja táctica 1", "Ventaja 2"],
          "debilidades": ["Debilidad 1", "Debilidad 2"],
          "leads": [{ "pokemon": "Nombre", "condicion_uso": "Usar contra...", "condicion_cambio": "Hacer pivot si..." }]
        },
        "selected_ids": [123, 456],
        "builds": {
          "123": { "item": "...", "ability": "...", "nature": "...", "evs": "252 HP / 252 Def / 4 SpD", "ivs": "31 HP / 0 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe", "moves": ["...", "...", "...", "..."], "teraType": "..." }
        }
      }
    `;

    const result = await generateWithFallback(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido");
    const aiData = JSON.parse(jsonMatch[0]);

    let finalTeamObjects = candidatePool.filter(p => aiData.selected_ids.includes(p.id));
    if (finalTeamObjects.length < slotsToFill) {
      const missingCount = slotsToFill - finalTeamObjects.length;
      const unused = candidatePool.filter(p => !aiData.selected_ids.includes(p.id));
      finalTeamObjects = [...finalTeamObjects, ...unused.slice(0, missingCount)];
    }

    return NextResponse.json({ team: finalTeamObjects, validLockedIds, aiReport: aiData.report, builds: aiData.builds, isDynamicMode });

  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json({ error: "CUOTA_AGOTADA", message: "Cuota excedida o Rate Limit activado. Espera un minuto." }, { status: 429 });
    }
    return NextResponse.json({ error: "Fallo en la inferencia táctica." }, { status: 500 });
  }
}