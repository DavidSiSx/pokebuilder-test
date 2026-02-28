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
  if (config.isMonotype && config.monoTypeSelected) m += ` MODO MONOTYPE: TODOS los Pokémon del equipo DEBEN ser de tipo ${config.monoTypeSelected} (al menos como tipo primario o secundario). Es OBLIGATORIO.`;
  if (config.preferredWeather && config.preferredWeather !== 'none') m += ` PRIORIZA clima ${config.preferredWeather}. Incluye un setter de este clima y Pokémon que se beneficien de él.`;
  if (config.preferredTerrain && config.preferredTerrain !== 'none') m += ` PRIORIZA terreno ${config.preferredTerrain}. Incluye un setter de este terreno y Pokémon que se beneficien de él.`;
  if (config.preferTrickRoom) m += " PRIORIZA Trick Room: incluye un setter de Trick Room y Pokémon lentos con alto ataque.";
  if (config.preferTailwind) m += " PRIORIZA Tailwind: incluye un setter de Tailwind y Pokémon que se beneficien del aumento de velocidad.";
  if (config.teamArchetype === 'offense') m += " ARQUETIPO OFENSIVO: Prioriza Pokémon con alto ataque/ataque especial y velocidad.";
  if (config.teamArchetype === 'balance') m += " ARQUETIPO BALANCE: Mezcla atacantes y defensivos.";
  if (config.teamArchetype === 'stall') m += " ARQUETIPO DEFENSIVO/STALL: Prioriza Pokémon con altas defensas, recuperación y moves de estado.";
  if (config.enableMega) m += " MEGA EVOLUTION: Puedes usar hasta 1 Mega Evolution en el equipo. Incluye el item Mega Stone correspondiente.";
  if (config.enableGmax) m += " GIGANTAMAX: Puedes incluir Pokemon con formas Gigantamax.";
  if (config.enableDynamax && !config.enableGmax) m += " DYNAMAX: Dynamax esta habilitado.";
  if (config.enableZMoves) m += " Z-MOVES: Puedes asignar 1 Z-Crystal a un Pokemon del equipo.";
  if (config.enableTera) {
    m += config.preferredTeraType
      ? ` TERACRISTALIZACION ACTIVA: prioriza tipo ${config.preferredTeraType}. Incluye "teraType" en cada build.`
      : ` TERACRISTALIZACION ACTIVA: Incluye "teraType" en cada build con el Tera Type mas estrategico.`;
  }
  const regionalParts: string[] = [];
  if (config.includeAlola) regionalParts.push("Alola");
  if (config.includeGalar) regionalParts.push("Galar");
  if (config.includeHisui) regionalParts.push("Hisui");
  if (config.includePaldea) regionalParts.push("Paldea");
  if (regionalParts.length > 0 && regionalParts.length < 4) {
    m += ` FORMAS REGIONALES: Considera variantes regionales de ${regionalParts.join(', ')}.`;
  }
  return m;
}

export async function POST(request: Request) {
  try {
    // Auth protection
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    // PROTECCION DE ORIGEN
    const origin = request.headers.get('origin');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.NODE_ENV === 'production' && siteUrl && origin !== siteUrl) {
      return NextResponse.json({ error: "ACCESO_DENEGADO", message: "Petición no autorizada." }, { status: 403 });
    }

    // RATE LIMITING
    if (isRateLimited(user!.id)) {
      return NextResponse.json({
        error: "DEMASIADAS_PETICIONES",
        message: "Has superado el límite de escaneos tácticos. Por favor, espera 1 minuto."
      }, { status: 429 });
    }

    // ── PARSE BODY ────────────────────────────────────────────────
    // scratchMode = true → generar equipo completo sin líder
    const { leaderId, config, lockedIds = [], ignoredIds = [], scratchMode = false } = await request.json();
    if (!API_KEY) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const modeModifiers = buildModeModifiers(config);
    const hasItemClause = config.clauses?.some((c: string) => c.toLowerCase().includes('item clause'));
    const itemClauseRule = hasItemClause
      ? "3. ITEM CLAUSE ACTIVA (¡MUY IMPORTANTE!): ESTÁ TOTALMENTE PROHIBIDO REPETIR OBJETOS. Los 6 Pokémon DEBEN tener un objeto diferente."
      : "3. OBJETOS: Intenta dar variedad de objetos al equipo.";
    const experiencePrompt = config.experienceLevel === 'novato'
      ? `MODO NOVATO: Explica la estrategia de forma simple y didáctica.`
      : `MODO EXPERTO: Utiliza jerga competitiva avanzada de Smogon y VGC.`;

    // ═══════════════════════════════════════════════════════════════
    // MODO SCRATCH — Sin líder, equipo completo generado por la IA
    // La validación del líder NO corre aquí — leaderId puede ser null
    // ═══════════════════════════════════════════════════════════════
    if (scratchMode) {
      const rawPool: any[] = await prisma.$queryRaw`
        SELECT p.*, am.perfil_estrategico
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        ORDER BY RANDOM()
        LIMIT 120
      `;

      const candidatePool = rawPool
        .filter(p => !isExcluded(p.nombre, config))
        .slice(0, 40);

      const candidatesString = candidatePool
        .map(c => `[ID: ${c.id}] ${c.nombre} (Rol: ${c.perfil_estrategico})`)
        .join('\n');

      const scratchPrompt = `
        Eres una IA de Análisis Táctico Pokémon de Nivel Mundial.
        FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses?.join(', ')}.
        MODIFICADORES: ${modeModifiers}
        DIRECTIVA TÁCTICA: "${config.customStrategy || 'Crea el equipo más sinérgico y competitivo posible'}"
        ${experiencePrompt}

        MODO: GENERACIÓN DESDE CERO — Elige los mejores 6 Pokémon del pool para la directiva táctica indicada.
        CANDIDATOS DISPONIBLES:\n${candidatesString}

        REGLAS CRÍTICAS:
        1. LEGALIDAD DE MOVIMIENTOS: NUNCA inventes ataques.
        2. LEGALIDAD DE OBJETOS: Usa solo objetos reales competitivos.
        ${itemClauseRule}
        4. REGLA CHOICE / ASSAULT VEST: Si llevan estos items, todos sus moves deben ser de daño directo.
        5. REGLA AIR BALLOON: NUNCA a Voladores o Levitación.
        6. Usa ÚNICAMENTE los [ID] numéricos en "selected_ids" y "builds".
        7. NUNCA menciones los IDs en el texto del reporte.

        SELECCIONA EXACTAMENTE 6 IDs y genera builds para todos.

        DEVUELVE SOLO JSON:
        {
          "report": {
            "estrategia": "Explica la estrategia usando \\n\\n para separar párrafos.",
            "ventajas": ["Ventaja 1"],
            "debilidades": ["Debilidad 1"],
            "leads": [{ "pokemon": "Nombre", "condicion_uso": "Usar contra...", "condicion_cambio": "Cambiar si..." }]
          },
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

      let finalTeam = candidatePool.filter(p => aiData.selected_ids.includes(p.id));
      if (finalTeam.length < 6) {
        const unused = candidatePool.filter(p => !aiData.selected_ids.includes(p.id));
        finalTeam = [...finalTeam, ...unused.slice(0, 6 - finalTeam.length)];
      }

      return NextResponse.json({
        team: finalTeam,
        validLockedIds: [],
        aiReport: aiData.report,
        builds: aiData.builds,
        isDynamicMode: false,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO NORMAL — Con líder (código original sin cambios)
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
      ? `\n\nATENCIÓN: EL LÍDER (${leaderName}) TIENE UN MOVEPOOL RESTRINGIDO. SUS MOVIMIENTOS LEGALES SON: [${leaderLegalMoves}]. NUNCA ASIGNES OTRO MOVIMIENTO A ESTE POKÉMON.`
      : "";

    const leaderData: any[] = await prisma.$queryRaw`SELECT embedding::text as embedding FROM "AnalisisMeta" WHERE pokemon_id = ${parseInt(leaderId)} LIMIT 1`;

    let rawSuggestions: any[] = [];
    let isDynamicMode = false;

    if (leaderData && leaderData.length > 0 && leaderData[0].embedding) {
      const vectorStr = leaderData[0].embedding;
      rawSuggestions = await prisma.$queryRaw`SELECT p.*, am.perfil_estrategico FROM "Pokemon" p JOIN "AnalisisMeta" am ON p.id = am.pokemon_id WHERE p.id != ${parseInt(leaderId)} ORDER BY am.embedding <=> ${vectorStr}::vector LIMIT 80`;
    } else {
      isDynamicMode = true;
      rawSuggestions = await prisma.$queryRaw`SELECT p.*, am.perfil_estrategico FROM "Pokemon" p JOIN "AnalisisMeta" am ON p.id = am.pokemon_id WHERE p.id != ${parseInt(leaderId)} ORDER BY RANDOM() LIMIT 80`;
    }

    const candidatePool = rawSuggestions.filter(p => {
      const name = p.nombre.toLowerCase();
      if (!config.allowParadox && PARADOX_LIST.includes(name)) return false;
      if (!config.allowUB && UB_LIST.includes(name)) return false;
      if (!config.allowMythical && MYTHICAL_LIST.includes(name)) return false;
      if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) return false;
      if (validLockedIds.includes(p.id)) return false;
      if (ignoredIds.includes(p.id)) return false;
      return true;
    }).slice(0, 30);

    const slotsToFill = 6 - validLockedIds.length;
    const candidatesString = candidatePool.map(c => `[ID: ${c.id}] ${c.nombre} (Rol: ${c.perfil_estrategico})`).join('\n');
    const lockedString = lockedDbPokemon.filter(p => validLockedIds.includes(p.id)).map(p => `[ID: ${p.id}] ${p.nombre}`).join('\n');

    const prompt = `
      Eres una IA de Análisis Táctico Pokémon de Nivel Mundial.
      FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses.join(', ')}.
      MODIFICADORES: ${modeModifiers}
      DIRECTIVA: "${config.customStrategy || 'Sinergia meta'}"
      ${experiencePrompt}
      
      LÍDER DEL EQUIPO: ${leaderName}. ${leaderConstraints}

      FIJADOS OBLIGATORIOS: \n${lockedString}
      CANDIDATOS DISPONIBLES: \n${candidatesString}
      
      REGLAS CRÍTICAS DE TORNEO:
      1. LEGALIDAD DE MOVIMIENTOS: NUNCA inventes ataques.
      2. LEGALIDAD DE OBJETOS: Usa solo objetos reales competitivos.
      ${itemClauseRule}
      4. LÓGICA COMPETITIVA AVANZADA:
         - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band", "Choice Specs", "Choice Scarf" o "Assault Vest", SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO (Cero movimientos de estado).
         - REGLA AIR BALLOON: NUNCA le des "Air Balloon" a un Pokémon de tipo Volador o con Levitación.
      5. PRE-EVOLUCIONES: Si no es Little Cup, evítalas salvo que tengan Eviolite.
      6. FORMATO: En "selected_ids" y "builds", responde usando ÚNICAMENTE los [ID] numéricos.
      7. REDACCIÓN: Usa doble salto de línea (\\n\\n) para separar párrafos en tu reporte. NUNCA menciones los IDs numéricos en el texto.
      
      SELECCIONA EXACTAMENTE ${slotsToFill} IDs y GENERA BUILDS PARA LOS 6 POKÉMON.

      DEVUELVE SOLO JSON:
      {
        "report": {
          "estrategia": "Explica la estrategia, usando \\n\\n para separar párrafos.",
          "ventajas": ["Ventaja 1"],
          "debilidades": ["Debilidad 1"],
          "leads": [{ "pokemon": "Nombre", "condicion_uso": "Usar contra...", "condicion_cambio": "Cambiar si..." }]
        },
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