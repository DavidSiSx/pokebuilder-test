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

const PARADOX_LIST   = ["great tusk","scream tail","brute bonnet","flutter mane","slither wing","sandy shocks","iron treads","iron bundle","iron hands","iron jugulis","iron moth","iron thorns","roaring moon","iron valiant","walking wake","iron leaves","gouging fire","raging bolt","iron boulder","iron crown"];
const UB_LIST        = ["nihilego","buzzwole","pheromosa","xurkitree","celesteela","kartana","guzzlord","poipole","naganadel","stakataka","blacephalon"];
const MYTHICAL_LIST  = ["mew","celebi","jirachi","deoxys","phione","manaphy","darkrai","shaymin","arceus","victini","keldeo","meloetta","genesect","diancie","hoopa","volcanion","magearna","marshadow","zeraora","meltan","melmetal","zarude","pecharunt"];
const LEGENDARY_LIST = ["articuno","zapdos","moltres","mewtwo","raikou","entei","suicune","lugia","ho-oh","regirock","regice","registeel","latias","latios","kyogre","groudon","rayquaza","uxie","mesprit","azelf","dialga","palkia","heatran","regigigas","giratina","cresselia","cobalion","terrakion","virizion","tornadus","thundurus","reshiram","zekrom","landorus","kyurem","xerneas","yveltal","zygarde","type: null","silvally","tapu koko","tapu lele","tapu bulu","tapu fini","cosmog","cosmoem","solgaleo","lunala","necrozma","zacian","zamazenta","eternatus","kubfu","urshifu","regieleki","regidrago","glastrier","spectrier","calyrex","enamorus","wo-chien","chien-pao","ting-lu","chi-yu","koraidon","miraidon","okidogi","munkidori","fezandipiti","ogerpon","terapagos"];
const LITTLE_CUP_LIST = ["bulbasaur","charmander","squirtle","caterpie","weedle","pidgey","rattata","spearow","ekans","pichu","sandshrew","nidoran-f","nidoran-m","cleffa","vulpix","igglybuff","zubat","oddish","paras","venonat","diglett","meowth","psyduck","mankey","growlithe","poliwag","abra","machop","bellsprout","tentacool","geodude","ponyta","slowpoke","magnemite","farfetchd","doduo","seel","grimer","shellder","gastly","onix","drowzee","krabby","voltorb","exeggcute","cubone","koffing","rhyhorn","horsea","goldeen","staryu","mime-jr","smoochum","elekid","magby","dratini","togepi","chikorita","cyndaquil","totodile","sentret","hoothoot","ledyba","spinarak","chinchou","natu","mareep","marill","hoppip","sunkern","wooper","murkrow","misdreavus","unown","wynaut","girafarig","pineco","dunsparce","gligar","snubbull","slugma","swinub","corsola","remoraid","delibird","skarmory","houndour","phanpy","stantler","teddiursa","wingull","ralts","surskit","shroomish","slakoth","nincada","whismur","makuhita","azurill","nosepass","skitty","sableye","mawile","aron","meditite","electrike","plusle","minun","volbeat","illumise","budew","roselia","gulpin","carvanha","wailmer","trapinch","cacnea","swablu","zangoose","seviper","lunatone","solrock","barboach","corphish","baltoy","lileep","anorith","feebas","castform","kecleon","shuppet","duskull","tropius","snorunt","spheal","clamperl","relicanth","luvdisc","bagon","beldum","turtwig","chimchar","piplup","starly","bidoof","kricketot","shinx","cranidos","shieldon","burmy","cherubi","shellos","drifloon","buneary","glameow","chingling","stunky","bronzor","bonsly","happiny","chatot","spiritomb","gible","munchlax","riolu","hippopotas","skorupi","toxicroak","carnivine","finneon","mantyke","snover","rotom","snivy","tepig","oshawott","patrat","lillipup","purrloin","blitzle","roggenrola","woobat","drilbur","audino","timburr","tympole","throh","sawk","sewaddle","venipede","cottonee","petilil","sandile","darumaka","maractus","dwebble","scraggy","sigilyph","tirtouga","archen","trubbish","zorua","minccino","gothita","solosis","ducklett","vanillite","deerling","emolga","karrablast","foongus","frillish","alomomola","joltik","ferroseed","klink","tynamo","elgyem","litwick","axew","cubchoo","cryogonal","shelmet","stunfisk","mienfoo","druddigon","golett","pawniard","bouffalant","rufflet","vullaby","deino","larvesta","chespin","fennekin","froakie","bunnelby","fletchling","scatterbug","litleo","flabebe","skiddo","pancham","espurr","honedge","spritzee","swirlix","inkay","binacle","skrelp","clauncher","helioptile","tyrunt","amaura","hawlucha","dedenne","carbink","goomy","klefki","phantump","pumpkaboo","bergmite","noibat","rowlet","litten","popplio","pikipek","yungoos","grubbin","crabrawler","oricorio","cutiefly","rockruff","wishiwashi","mareanie","mudbray","dewpider","fomantis","morelull","salandit","stufful","bounsweet","comfey","oranguru","passimian","wimpod","sandygast","pyukumuku","type-null","jangmo-o","grookey","scorbunny","sobble","skwovet","wooloo","gossifleur","blipbug","nickit","chewtle","yamper","rolycoly","applin","silicobra","cramorant","arrokuda","toxel","sizzlipede","clobbopus","pincurchin","snom","stonjourner","eiscue","indeedee","morpeko","cufant","dreepy","sprigatito","fuecoco","quaxly","lechonk","tarountula","nymble","pawmi","tandemaus","fidough","shroodle","grafaiai","bramblin","toedscool","capsakid","rellor","flittle","tinkatink","charcadet","tadbulb","wattrel","maschiff","greavard","flamigo","klawf","nacli","glimmet","varoom","cyclizar","orthworm","revavroom","veluza","finizen","wiglett","tatsugiri","cetoddle","frigibax","gimmighoul","houndstone"];

// ─────────────────────────────────────────────────────────────────
// FIX BUG #1: Mapa de Mega Stones válidas por Pokémon.
// La IA solo puede asignar una Mega Stone si el Pokémon aparece aquí.
// Esto evita que invente items como "Infernapeite" o "Absolite".
// ─────────────────────────────────────────────────────────────────
const VALID_MEGA_STONES: Record<string, string> = {
  "venusaur": "Venusaurite", "charizard": "Charizardite X", "blastoise": "Blastoisinite",
  "alakazam": "Alakazite", "gengar": "Gengarite", "kangaskhan": "Kangaskhanite",
  "pinsir": "Pinsirite", "gyarados": "Gyaradosite", "aerodactyl": "Aerodactylite",
  "mewtwo": "Mewtwonite X", "ampharos": "Ampharosite", "scizor": "Scizorite",
  "heracross": "Heracronite", "houndoom": "Houndoominite", "tyranitar": "Tyranitarite",
  "blaziken": "Blazikenite", "gardevoir": "Gardevoirite", "mawile": "Mawilite",
  "aggron": "Aggronite", "medicham": "Medichamite", "manectric": "Manectite",
  "banette": "Banettite", "absol": "Absolite", "latias": "Latiasite",
  "latios": "Latiosite", "garchomp": "Garchompite", "lucario": "Lucarionite",
  "abomasnow": "Abomasite", "beedrill": "Beedrillite", "pidgeot": "Pidgeotite",
  "slowbro": "Slowbronite", "steelix": "Steelixite", "sceptile": "Sceptilite",
  "swampert": "Swampertite", "sableye": "Sablenite", "sharpedo": "Sharpedonite",
  "camerupt": "Cameruptite", "altaria": "Altarianite", "glalie": "Glalitite",
  "salamence": "Salamencite", "metagross": "Metagrossite", "rayquaza": "None (no stone needed)",
  "lopunny": "Lopunnite", "gallade": "Galladite", "audino": "Audinite",
  "diancie": "Diancite", "charizard-x": "Charizardite X", "charizard-y": "Charizardite Y",
  "mewtwo-x": "Mewtwonite X", "mewtwo-y": "Mewtwonite Y",
  "infernape": "", // NO tiene Mega — PROHIBIDO asignar Mega Stone
};

function getMegaStone(pokemonName: string): string | null {
  const name = pokemonName.toLowerCase();
  if (name in VALID_MEGA_STONES) {
    const stone = VALID_MEGA_STONES[name];
    return stone || null; // retorna null si está vacío (no tiene mega)
  }
  return null; // no está en la lista = no tiene mega
}

function toNum(id: any): number { return Number(id); }
function idInList(id: any, list: number[]): boolean { return list.includes(toNum(id)); }

// FIX: "gemini-3-flash" no existe
const MODEL_PRIORITY = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];

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

function normalizeConfig(raw: any): any {
  const allowMythicals = raw.allowMythicals ?? raw.allowMythical ?? true;
  return { ...raw, allowMythicals, allowMythical: allowMythicals };
}

function isExcluded(nombre: string, config: any): boolean {
  const name = nombre.toLowerCase();
  if (!config.allowParadox     && PARADOX_LIST.includes(name))   return true;
  if (!config.allowUB          && UB_LIST.includes(name))        return true;
  if (!config.allowMythicals   && MYTHICAL_LIST.includes(name))  return true;
  if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) return true;
  if (config.isLittleCup && !LITTLE_CUP_LIST.includes(name))    return true;
  return false;
}

function applyMonotypeFilter(pool: any[], config: any): any[] {
  if (!config.isMonotype || !config.monoTypeSelected) return pool;
  const mono = config.monoTypeSelected.toLowerCase();
  return pool.filter(p =>
    p.tipo1?.toLowerCase() === mono ||
    p.tipo2?.toLowerCase() === mono
  );
}

async function expandMonotypePool(mono: string, config: any, excludeIds: number[], limit: number): Promise<any[]> {
  try {
    const extra: any[] = await prisma.$queryRaw`
      SELECT p.id, p.nombre, p.tipo1, p.tipo2,
             COALESCE(am.perfil_estrategico, '') as perfil_estrategico,
             COALESCE(am.usage_score, 0)         as usage_score,
             COALESCE(am.tier, 'Unranked')       as tier
      FROM "Pokemon" p
      LEFT JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
      WHERE (LOWER(p.tipo1) = ${mono} OR LOWER(p.tipo2) = ${mono})
      ORDER BY COALESCE(am.usage_score, 0) DESC
      LIMIT ${limit}
    `;
    return extra
      .filter(p => !excludeIds.includes(toNum(p.id)))
      .filter(p => !isExcluded(p.nombre, config))
      .map(p => ({ ...p, id: toNum(p.id) }));
  } catch { return []; }
}

function deduplicateById(arr: any[]): any[] {
  const seen = new Set<number>();
  return arr.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// FIX BUG #2: buildModeModifiers ahora incluye reglas NEGATIVAS
// explícitas para mecánicas desactivadas, para que la IA no las
// use aunque no estén en el prompt positivo.
// FIX BUG #3: Regla de daño mixto para monotype explicitada aquí.
// ─────────────────────────────────────────────────────────────────
function buildModeModifiers(config: any): string {
  let m = "";

  // ── Mecánicas ACTIVAS ──────────────────────────────────────────
  if (config.isLittleCup)  m += " FORMATO LITTLE CUP (Solo pre-evoluciones nivel 5, sin stone evolutiva).";
  if (config.isRandomizer) m += " ESTRATEGIAS CAÓTICAS Y RANDOM.";

  if (config.isMonotype && config.monoTypeSelected) {
    m += ` MODO MONOTYPE ${config.monoTypeSelected.toUpperCase()}: TODOS los Pokémon DEBEN ser de tipo ${config.monoTypeSelected}. El pool YA está pre-filtrado.`;
    // FIX BUG #3: instrucción explícita de daño mixto en monotype
    m += ` ADVERTENCIA MONOTYPE: Este tipo puede tener pocos atacantes especiales. DEBES incluir al menos 1 atacante especial (SpA) si existe en el pool. Si el tipo carece de atacantes especiales, incluye al menos 1 Pokémon mixto o con movimientos de estado que compensen. Reporta esta limitación en las debilidades.`;
  }

  if (config.preferredWeather && config.preferredWeather !== 'none') m += ` PRIORIZA clima ${config.preferredWeather}. Incluye un setter.`;
  if (config.preferredTerrain && config.preferredTerrain !== 'none') m += ` PRIORIZA terreno ${config.preferredTerrain}. Incluye un setter.`;
  if (config.preferTrickRoom) m += " PRIORIZA Trick Room: setter + Pokémon lentos con alto ataque.";
  if (config.preferTailwind)  m += " PRIORIZA Tailwind: setter + abusers rápidos.";
  if (config.teamArchetype === 'offense') m += " ARQUETIPO OFENSIVO.";
  if (config.teamArchetype === 'balance') m += " ARQUETIPO BALANCE.";
  if (config.teamArchetype === 'stall')   m += " ARQUETIPO STALL/DEFENSIVO.";

  if (config.enableMega) {
    m += ` MEGA EVOLUTION ACTIVADA: Asigna la Mega Stone correcta a MÁXIMO 1 miembro.`;
    m += ` REGLA CRÍTICA MEGA: Antes de asignar una Mega Stone, VERIFICA que el Pokémon realmente tiene Mega Evolución en el juego oficial. Si no tiene Mega Evolución confirmada, asígnale un item competitivo normal en su lugar.`;
    m += ` Mega Stones válidas CONFIRMADAS: Venusaurite (Venusaur), Charizardite X/Y (Charizard), Blastoisinite (Blastoise), Alakazite (Alakazam), Gengarite (Gengar), Kangaskhanite (Kangaskhan), Pinsirite (Pinsir), Gyaradosite (Gyarados), Aerodactylite (Aerodactyl), Ampharosite (Ampharos), Scizorite (Scizor), Heracronite (Heracross), Houndoominite (Houndoom), Tyranitarite (Tyranitar), Blazikenite (Blaziken), Gardevoirite (Gardevoir), Mawilite (Mawile), Aggronite (Aggron), Medichamite (Medicham), Manectite (Manectric), Banettite (Banette), Absolite (Absol), Latiasite (Latias), Latiosite (Latios), Garchompite (Garchomp), Lucarionite (Lucario), Abomasite (Abomasnow), Beedrillite (Beedrill), Pidgeotite (Pidgeot), Slowbronite (Slowbro), Steelixite (Steelix), Sceptilite (Sceptile), Swampertite (Swampert), Sablenite (Sableye), Sharpedonite (Sharpedo), Cameruptite (Camerupt), Altarianite (Altaria), Glalitite (Glalie), Salamencite (Salamence), Metagrossite (Metagross), Lopunnite (Lopunny), Galladite (Gallade), Audinite (Audino), Diancite (Diancie). SOLO estas.`;
  }

  if (config.enableZMoves) m += " Z-MOVES ACTIVADOS: Asigna 1 Z-Crystal al miembro más beneficiado.";

  if (config.enableTera) {
    m += config.preferredTeraType
      ? ` TERACRISTALIZACION ACTIVADA: prioriza tipo ${config.preferredTeraType}.`
      : ` TERACRISTALIZACION ACTIVADA: incluye "teraType" con el Tera Type más estratégico por Pokémon.`;
  }

  if (config.allowLegendaries) m += " LEGENDARIOS PERMITIDOS: incluye 1-2 Legendarios top-tier si hay sinergia.";
  if (config.allowParadox)     m += " PARADOJAS PERMITIDAS: considera Pokémon Paradoja por su dominancia en el meta.";

  // ── FIX BUG #2: Mecánicas DESACTIVADAS — reglas negativas explícitas ──
  const prohibitions: string[] = [];

  if (!config.enableMega) {
    prohibitions.push("PROHIBIDO asignar Mega Stones (enableMega=false). Ningún item puede terminar en 'ite' o ser una Mega Stone.");
  }
  if (!config.enableZMoves) {
    prohibitions.push("PROHIBIDO asignar Z-Crystals (enableZMoves=false). Ningún item puede ser un Z-Crystal.");
  }
  if (!config.enableTera) {
    prohibitions.push("PROHIBIDO incluir teraType en ningún build (enableTera=false).");
  }
  if (!config.enableDynamax && !config.enableGmax) {
    prohibitions.push("PROHIBIDO mencionar Dynamax o Gigantamax.");
  }
  if (!config.allowLegendaries) {
    prohibitions.push(`PROHIBIDO incluir Legendarios en el equipo ni en las builds. Los siguientes Pokémon están EXCLUIDOS: ${LEGENDARY_LIST.slice(0, 20).join(', ')} y otros legendarios conocidos.`);
  }
  if (!config.allowMythicals) {
    prohibitions.push(`PROHIBIDO incluir Pokémon Singulares/Mythicals: ${MYTHICAL_LIST.join(', ')}.`);
  }
  if (!config.allowParadox) {
    prohibitions.push(`PROHIBIDO incluir Pokémon Paradoja: ${PARADOX_LIST.join(', ')}.`);
  }
  if (!config.allowUB) {
    prohibitions.push(`PROHIBIDO incluir Ultra Bestias: ${UB_LIST.join(', ')}.`);
  }

  if (prohibitions.length > 0) {
    m += `\n\n⛔ PROHIBICIONES ABSOLUTAS (NUNCA IGNORAR):\n${prohibitions.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  }

  return m;
}

function buildExperiencePrompt(level: string): string {
  if (level === 'novato') {
    return `MODO NOVATO: Lenguaje accesible, usa analogías para explicar sinergias. Jerga técnica en inglés pero explícala la primera vez.`;
  }
  return `MODO EXPERTO: Conocimiento avanzado de Smogon/VGC asumido. Profundiza en matchups, speed tiers, damage calcs aproximados y win conditions. Sin explicaciones básicas.`;
}

const ELITE_COMPETITIVE_RULES = `
  4. LÓGICA COMPETITIVA AVANZADA (NIVEL VGC/SMOGON ÉLITE):
     - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band/Specs/Scarf" o "Assault Vest",
       SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO (cero movimientos de estado).
     - EVIOLITE: Pre-evoluciones viables (Porygon2, Dusclops, Clefairy) deben llevar Eviolite.
     - OBJETOS EXCLUSIVOS: 'Light Ball' SOLO para Pikachu, 'Thick Club' SOLO para Marowak.
     - SINERGIAS DINÁMICAS: Setter de Clima → incluye abusers (Swift Swim / Chlorophyll).

  4b. BALANCE OFENSIVO FÍSICO / ESPECIAL:
     - El equipo DEBE tener al menos 2 atacantes físicos (Atk) y 2 especiales (SpA) SIEMPRE QUE EL POOL LO PERMITA.
     - Si el modo Monotype restringe la diversidad ofensiva, incluye al menos 1 atacante mixto
       o 1 Pokémon de soporte/estado que compense la falta de variedad ofensiva.
     - EXCEPCIÓN TRICK ROOM: No aplica bajo TR.

  5. TERMINOLOGÍA ESTRICTA (PROHIBIDO TRADUCIR JERGA):
     - Reporte en Español, pero movimientos/objetos/habilidades/mecánicas EN INGLÉS ORIGINAL.
     - SIEMPRE "Trick Room", "Tailwind", "Entry Hazards", "Setup Sweeper", "Speed Control", "Pivot", "Wallbreaker".
`;

// ─────────────────────────────────────────────────────────────────
// PASO 2: Genera el reporte con el equipo REAL confirmado.
// Esto evita que la IA mencione Pokémon que no están en el equipo.
// ─────────────────────────────────────────────────────────────────
async function generateReport(
  confirmedTeam: any[],
  config: any,
  experiencePrompt: string,
  modeModifiers: string,
  buildsJson: string
): Promise<any> {
  const teamString = confirmedTeam
    .map(p => {
      const types = p.tipo2 ? `${p.tipo1}/${p.tipo2}` : (p.tipo1 || 'Normal');
      return `- ${p.nombre} (${types})`;
    })
    .join('\n');

  const reportPrompt = `
    Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
    FORMATO: ${config.format} | MODIFICADORES: ${modeModifiers}
    NIVEL DE ANÁLISIS: ${experiencePrompt}

    EQUIPO FINAL CONFIRMADO (EXACTAMENTE ESTOS ${confirmedTeam.length} POKÉMON):
    ${teamString}

    BUILDS ASIGNADAS:
    ${buildsJson}

    REGLA ABSOLUTA: Tu análisis SOLO puede mencionar los Pokémon listados arriba.
    PROHIBIDO mencionar cualquier Pokémon que no esté en este equipo.
    Si el equipo es Monotype, menciona explícitamente en debilidades si depende de un solo tipo de daño.

    DEVUELVE SOLO JSON:
    {
      "estrategia": "descripción táctica del equipo",
      "ventajas": ["ventaja 1", "ventaja 2", "ventaja 3"],
      "debilidades": ["debilidad 1", "debilidad 2"],
      "leads": [
        { "pokemon": "nombre exacto", "condicion_uso": "cuándo usar como lead", "condicion_cambio": "cuándo cambiar" }
      ]
    }
  `;

  try {
    const result = await generateWithFallback(reportPrompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) return buildFallbackReport(confirmedTeam);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return buildFallbackReport(confirmedTeam);
  }
}

function buildFallbackReport(confirmedTeam: any[]): any {
  const names = confirmedTeam.map(p => p.nombre);
  return {
    estrategia: `Equipo conformado por ${names.join(', ')}.`,
    ventajas: ["Equipo generado con sinergia vectorial", "Builds competitivas asignadas"],
    debilidades: ["Revisar cobertura de tipos manualmente"],
    leads: confirmedTeam.slice(0, 2).map(p => ({
      pokemon: p.nombre,
      condicion_uso: "Lead según matchup del rival",
      condicion_cambio: "Cambiar si hay desventaja de tipo clara"
    }))
  };
}

// ─────────────────────────────────────────────────────────────────
// FIX BUG #1 POST-PROCESS: Después de recibir los builds de la IA,
// validar y corregir items de Mega y mecánicas desactivadas.
// ─────────────────────────────────────────────────────────────────
function sanitizeBuilds(builds: Record<string, any>, config: any, candidatePool: any[]): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;
    const pokemon = candidatePool.find(p => p.id.toString() === id.toString());
    const pokemonName = pokemon?.nombre?.toLowerCase() || '';
    let item = build.item || '';

    // FIX BUG #1: Si Mega está desactivado, eliminar cualquier Mega Stone
    if (!config.enableMega) {
      const isMegaStone = item.toLowerCase().endsWith('ite') &&
        Object.values(VALID_MEGA_STONES).some(s => s.toLowerCase() === item.toLowerCase());
      if (isMegaStone) {
        item = 'Leftovers'; // item neutro de reemplazo
      }
    }

    // FIX BUG #1: Si Mega está activo, validar que el Pokémon realmente tiene Mega
    if (config.enableMega) {
      const validStone = getMegaStone(pokemonName);
      const isMegaStone = item.toLowerCase().endsWith('ite') &&
        Object.values(VALID_MEGA_STONES).some(s => s.toLowerCase() === item.toLowerCase());
      if (isMegaStone && validStone === null) {
        // El Pokémon no tiene Mega — reemplazar con item normal
        item = 'Life Orb';
      }
      if (isMegaStone && validStone && validStone.toLowerCase() !== item.toLowerCase()) {
        // La Mega Stone es incorrecta para este Pokémon — corregir
        item = validStone;
      }
    }

    // FIX BUG #2: Si Z-Moves está desactivado, eliminar Z-Crystals
    if (!config.enableZMoves) {
      if (item.toLowerCase().endsWith('-z') || item.toLowerCase().includes('z-crystal') || item.toLowerCase().endsWith('ium z')) {
        item = 'Leftovers';
      }
    }

    // FIX BUG #2: Si Tera está desactivado, eliminar teraType
    const sanitizedBuild = { ...build, item };
    if (!config.enableTera) {
      delete sanitizedBuild.teraType;
    }

    sanitized[id] = sanitizedBuild;
  }

  return sanitized;
}

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const origin  = request.headers.get('origin');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.NODE_ENV === 'production' && siteUrl && origin !== siteUrl) {
      return NextResponse.json({ error: "ACCESO_DENEGADO", message: "Petición no autorizada." }, { status: 403 });
    }

    if (isRateLimited(user!.id)) {
      return NextResponse.json({ error: "DEMASIADAS_PETICIONES", message: "Espera 1 minuto." }, { status: 429 });
    }

    const { leaderId, config: rawConfig, lockedIds = [], ignoredIds = [], scratchMode = false } = await request.json();
    const config = normalizeConfig(rawConfig);

    if (!API_KEY) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const normalizedLockedIds:  number[] = lockedIds.map(Number);
    const normalizedIgnoredIds: number[] = ignoredIds.map(Number);

    const modeModifiers    = buildModeModifiers(config);
    const experiencePrompt = buildExperiencePrompt(config.experienceLevel);

    const hasItemClause = config.clauses?.some((c: string) => c.toLowerCase().includes('item clause'));
    const itemClauseRule = hasItemClause
      ? "3. ITEM CLAUSE ACTIVA: PROHIBIDO REPETIR OBJETOS EN EL MISMO EQUIPO."
      : "3. OBJETOS: Variedad estratégica. Prioriza Eviolite y Objetos Exclusivos donde corresponda.";

    // ═══════════════════════════════════════════════════════════════
    // MODO SCRATCH
    // ═══════════════════════════════════════════════════════════════
    if (scratchMode) {
      let rawPool: any[] = await prisma.$queryRaw`
        SELECT p.id, p.nombre, p.tipo1, p.tipo2, am.perfil_estrategico, am.usage_score, am.tier
        FROM "Pokemon" p
        JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
        ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
        LIMIT 150
      `;

      const validScratchLockedIds: number[] = [];
      if (normalizedLockedIds.length > 0) {
        const lockedPokemon = await prisma.pokemon.findMany({ where: { id: { in: normalizedLockedIds } } });
        for (const p of lockedPokemon) {
          if (!isExcluded(p.nombre, config)) validScratchLockedIds.push(toNum(p.id));
        }
      }

      let filteredPool = rawPool
        .filter(p => !idInList(p.id, normalizedIgnoredIds))
        .filter(p => !idInList(p.id, validScratchLockedIds))
        .filter(p => !isExcluded(p.nombre, config))
        .map(p => ({ ...p, id: toNum(p.id) }));

      if (config.isMonotype && config.monoTypeSelected) {
        const mono = config.monoTypeSelected.toLowerCase();
        filteredPool = applyMonotypeFilter(filteredPool, config);
        if (filteredPool.length < 6) {
          const existingIds = [...filteredPool.map(p => p.id), ...validScratchLockedIds, ...normalizedIgnoredIds];
          const extra = await expandMonotypePool(mono, config, existingIds, 40);
          const seen  = new Set(filteredPool.map(p => p.id));
          for (const p of extra) { if (!seen.has(p.id)) { filteredPool.push(p); seen.add(p.id); } }
        }
      }

      const highMeta = filteredPool.filter(p => (p.usage_score ?? 0) > 15).slice(0, 20);
      const viable   = filteredPool.filter(p => (p.usage_score ?? 0) > 3  && (p.usage_score ?? 0) <= 15).slice(0, 14);
      const niche    = filteredPool.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 6);
      const candidatePool = deduplicateById([...highMeta, ...viable, ...niche]);

      const slotsNeeded = Math.max(0, 6 - validScratchLockedIds.length);
      if (slotsNeeded === 0) {
        const lockedFull = await prisma.pokemon.findMany({ where: { id: { in: validScratchLockedIds } } });
        return NextResponse.json({ team: lockedFull, validLockedIds: validScratchLockedIds, aiReport: null, builds: {}, isDynamicMode: false });
      }

      const candidatesString = candidatePool.map(c => {
        const tier  = c.tier || 'Unranked';
        const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
        const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
        // FIX BUG #1: indicar si el Pokémon tiene Mega disponible
        const megaNote = config.enableMega ? (getMegaStone(c.nombre) ? ` [MEGA: ${getMegaStone(c.nombre)}]` : ' [SIN MEGA]') : '';
        return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}${megaNote}`;
      }).join('\n');

      // PASO 1: Selección de IDs y builds
      const selectionPrompt = `
        Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
        FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses?.join(', ')}.
        MODIFICADORES Y PROHIBICIONES:
        ${modeModifiers}

        DIRECTIVA: "${config.customStrategy || 'Crea el equipo más sinérgico posible'}"
        NIVEL DE ANÁLISIS: ${experiencePrompt}

        CANDIDATOS DISPONIBLES (${candidatePool.length} Pokémon):
        NOTA: Los Pokémon marcados [SIN MEGA] NO tienen Mega Evolución — NUNCA asignarles Mega Stone.
        ${candidatesString}

        --- REGLAS ESTRICTAS ---
        1. LEGALIDAD: NUNCA inventes ataques ni habilidades.
        ${itemClauseRule}
        ${ELITE_COMPETITIVE_RULES}
        6. SOLO usa IDs de CANDIDATOS DISPONIBLES listados arriba. NUNCA inventes IDs.
           SELECCIONA EXACTAMENTE ${slotsNeeded} IDs DISTINTOS. PROHIBIDO REPETIR IDs.
        7. RESPETA TODAS LAS PROHIBICIONES LISTADAS EN MODIFICADORES. Son absolutas.

        DEVUELVE SOLO JSON (sin reporte):
        {
          "selected_ids": [123, 456, 789, 321, 654, 987],
          "builds": {
            "123": { "item": "...", "ability": "...", "nature": "...", "evs": "...", "ivs": "...", "moves": ["...", "...", "...", "..."], "teraType": "..." }
          }
        }
      `;

      const selectionResult = await generateWithFallback(selectionPrompt);
      const selectionMatch = selectionResult.response.text().match(/\{[\s\S]*\}/);
      if (!selectionMatch) throw new Error("JSON inválido en selección");
      const selectionData = JSON.parse(selectionMatch[0]);

      const selectedNums: number[] = [...new Set<number>((selectionData.selected_ids || []).map(Number))];
      let finalTeam = deduplicateById(candidatePool.filter(p => selectedNums.includes(p.id)));
      if (finalTeam.length < slotsNeeded) {
        const usedIds = new Set(finalTeam.map(p => p.id));
        const extras = candidatePool.filter(p => !usedIds.has(p.id)).slice(0, slotsNeeded - finalTeam.length);
        finalTeam = [...finalTeam, ...extras];
      }

      // FIX BUG #1 y #2: Sanitizar builds antes de devolverlas
      const sanitizedBuilds = sanitizeBuilds(selectionData.builds || {}, config, candidatePool);

      const lockedTeamData = validScratchLockedIds.length > 0
        ? await prisma.pokemon.findMany({ where: { id: { in: validScratchLockedIds } } })
        : [];
      const fullTeam = [...lockedTeamData, ...finalTeam];

      // PASO 2: Reporte con equipo real confirmado
      const aiReport = await generateReport(
        fullTeam, config, experiencePrompt, modeModifiers,
        JSON.stringify(sanitizedBuilds, null, 2)
      );

      return NextResponse.json({
        team: finalTeam,
        validLockedIds: validScratchLockedIds,
        aiReport,
        builds: sanitizedBuilds,
        isDynamicMode: false
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO NORMAL (CON LÍDER Y VECTORIAL)
    // ═══════════════════════════════════════════════════════════════
    const lockedDbPokemon = await prisma.pokemon.findMany({ where: { id: { in: normalizedLockedIds } } });
    const validLockedIds: number[] = [];

    for (const p of lockedDbPokemon) {
      if (!isExcluded(p.nombre, config)) {
        validLockedIds.push(toNum(p.id));
      }
    }

    if (!validLockedIds.includes(Number(leaderId))) {
      return NextResponse.json({ error: "REGLA_VIOLADA", message: "Tu líder viola las exclusiones actuales." }, { status: 400 });
    }

    const slotsToFill = 6 - validLockedIds.length;
    if (slotsToFill === 0) {
      return NextResponse.json({
        team: lockedDbPokemon,
        validLockedIds,
        aiReport: { estrategia: "Equipo completo con los Pokémon fijados.", ventajas: [], debilidades: [] },
        builds: {},
        isDynamicMode: false
      });
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

    let filtered = rawSuggestions.filter(p => {
      if (isExcluded(p.nombre, config))        return false;
      if (idInList(p.id, validLockedIds))       return false;
      if (idInList(p.id, normalizedIgnoredIds)) return false;
      return true;
    });

    if (config.isMonotype && config.monoTypeSelected) {
      const mono = config.monoTypeSelected.toLowerCase();
      filtered = applyMonotypeFilter(filtered, config);
      if (filtered.length < slotsToFill) {
        const existingIds = [...filtered.map((p: any) => p.id), ...validLockedIds, ...normalizedIgnoredIds, Number(leaderId)];
        const extra = await expandMonotypePool(mono, config, existingIds, 40);
        const seen  = new Set(filtered.map((p: any) => p.id));
        for (const p of extra) { if (!seen.has(p.id)) { filtered.push(p); seen.add(p.id); } }
      }
    }

    const highMeta = filtered.filter(p => (p.usage_score ?? 0) > 20).slice(0, 14);
    const viable   = filtered.filter(p => (p.usage_score ?? 0) > 3  && (p.usage_score ?? 0) <= 20).slice(0, 12);
    const niche    = filtered.filter(p => (p.usage_score ?? 0) <= 3).slice(0, 4);
    const candidatePool = deduplicateById([...highMeta, ...viable, ...niche].map(p => ({ ...p, id: toNum(p.id) })));

    const candidatesString = candidatePool.map(c => {
      const tier  = c.tier || 'Unranked';
      const types = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
      const usage = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : '—';
      // FIX BUG #1: indicar si el Pokémon tiene Mega disponible
      const megaNote = config.enableMega ? (getMegaStone(c.nombre) ? ` [MEGA: ${getMegaStone(c.nombre)}]` : ' [SIN MEGA]') : '';
      return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}${megaNote}`;
    }).join('\n');

    const lockedString = lockedDbPokemon
      .filter(p => validLockedIds.includes(toNum(p.id)))
      .map(p => `[ID: ${toNum(p.id)}] ${p.nombre}`)
      .join('\n');

    // PASO 1: Selección de IDs y builds
    const selectionPrompt = `
      Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
      FORMATO: ${config.format} | CLÁUSULAS: ${config.clauses.join(', ')}.
      MODIFICADORES Y PROHIBICIONES:
      ${modeModifiers}

      NIVEL DE ANÁLISIS: ${experiencePrompt}
      LÍDER: ${leaderName}. ${leaderConstraints}
      FIJADOS:\n${lockedString}

      CANDIDATOS (${candidatePool.length} Pokémon, vectorizados por sinergia con el líder):
      NOTA: Los Pokémon marcados [SIN MEGA] NO tienen Mega Evolución — NUNCA asignarles Mega Stone.
      ${candidatesString}

      --- REGLAS ESTRICTAS ---
      1. LEGALIDAD: NUNCA inventes ataques.
      ${itemClauseRule}
      ${ELITE_COMPETITIVE_RULES}
      6. SOLO usa IDs de CANDIDATOS listados arriba. NUNCA uses IDs externos.
         SELECCIONA EXACTAMENTE ${slotsToFill} IDs DISTINTOS. PROHIBIDO REPETIR IDs.
      7. RESPETA TODAS LAS PROHIBICIONES LISTADAS EN MODIFICADORES. Son absolutas.

      DEVUELVE SOLO JSON (sin reporte):
      {
        "selected_ids": [123, 456],
        "builds": {
          "123": { "item": "...", "ability": "...", "nature": "...", "evs": "...", "ivs": "...", "moves": ["...", "...", "...", "..."], "teraType": "..." }
        }
      }
    `;

    const selectionResult = await generateWithFallback(selectionPrompt);
    const selectionMatch = selectionResult.response.text().match(/\{[\s\S]*\}/);
    if (!selectionMatch) throw new Error("JSON inválido en selección");
    const selectionData = JSON.parse(selectionMatch[0]);

    const selectedNums: number[] = [...new Set<number>((selectionData.selected_ids || []).map(Number))];
    let finalTeamObjects = deduplicateById(candidatePool.filter(p => selectedNums.includes(p.id)));
    if (finalTeamObjects.length < slotsToFill) {
      const usedIds = new Set(finalTeamObjects.map(p => p.id));
      const extras = candidatePool.filter(p => !usedIds.has(p.id)).slice(0, slotsToFill - finalTeamObjects.length);
      finalTeamObjects = [...finalTeamObjects, ...extras];
    }

    // FIX BUG #1 y #2: Sanitizar builds antes de devolverlas
    const sanitizedBuilds = sanitizeBuilds(selectionData.builds || {}, config, [...candidatePool, ...lockedDbPokemon]);

    const fullTeam = [
      ...lockedDbPokemon.filter(p => validLockedIds.includes(toNum(p.id))),
      ...finalTeamObjects
    ];

    // PASO 2: Reporte con equipo real confirmado
    const aiReport = await generateReport(
      fullTeam, config, experiencePrompt, modeModifiers,
      JSON.stringify(sanitizedBuilds, null, 2)
    );

    return NextResponse.json({
      team: finalTeamObjects,
      validLockedIds,
      aiReport,
      builds: sanitizedBuilds,
      isDynamicMode
    });

  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json({ error: "CUOTA_AGOTADA", message: "Cuota excedida. Espera un minuto." }, { status: 429 });
    }
    return NextResponse.json({ error: "Fallo en la inferencia táctica." }, { status: 500 });
  }
}