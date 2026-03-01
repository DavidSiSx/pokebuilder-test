/**
 * scripts/seed-regen.ts
 *
 * Regenera embeddings competitivos COMPLETOS.
 * VERSIÓN COMERCIAL ÉLITE (Weight Mechanics, Signature Items, Algorithmic Counters).
 * Modelo: Nomic (8192 tokens nativos).
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { getCombosForPokemon, formatCombosForEmbedding } from './data/synergy-combos';

dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient();

// ─── CONFIGURACIÓN DEL MODELO ─────────────────────────────────────
const OLLAMA_URL  = 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text'; // Excelente para base de datos de 768 dimensiones
const BATCH_SIZE  = 10;
const DELAY_MON   = 100;

// ─── FORMATOS EXPANDIDOS DE SMOGON ────────────────────────────────
const SMOGON_FORMATS = [
  { id: 'gen9nationaldex',   label: 'NatDex OU' },
  { id: 'gen9nationaldexuu', label: 'NatDex UU' },
  { id: 'gen9vgc',           label: 'VGC' },
  { id: 'gen9doublesou',     label: 'Doubles OU' },
  { id: 'gen9ubers',         label: 'Ubers' },
  { id: 'gen9ou',            label: 'OU' },
  { id: 'gen9uu',            label: 'UU' },
  { id: 'gen9ru',            label: 'RU' },
  { id: 'gen9nu',            label: 'NU' },
  { id: 'gen9pu',            label: 'PU' },
  { id: 'gen9lc',            label: 'LC' },
];

// ─── BASE DE DATOS DE OBJETOS EXCLUSIVOS Y EVIOLITE ────────────────
const SIGNATURE_TRAITS: Record<string, string> = {
  'pikachu': 'Puede equipar Light Ball (Bolaluz) para duplicar permanentemente su Ataque y Ataque Especial.',
  'marowak': 'Debe equipar Thick Club (Hueso Grueso) para duplicar su Ataque físico.',
  'marowak-alola': 'Debe equipar Thick Club (Hueso Grueso) para duplicar su Ataque físico.',
  'ditto': 'Suele llevar Choice Scarf para ser más rápido que el Pokémon del que copia sus stats con Imposter.',
  'clamperl': 'Deep Sea Tooth duplica su SpA, Deep Sea Scale duplica su SpD. Temible en formato LC.',
  'latias': 'Puede usar Soul Dew (Rocío Bondad) para potenciar un 20% sus ataques Dragón y Psíquico.',
  'latios': 'Puede usar Soul Dew (Rocío Bondad) para potenciar un 20% sus ataques Dragón y Psíquico.',
  'ogerpon': 'Cambia su tipo, habilidad y potencia todos sus ataques un 20% dependiendo de la Máscara que equipe.',
  'zacian': 'Equipa Rusted Sword para convertirse en tipo Hada/Acero y ganar acceso a Behemoth Blade.',
  'zamazenta': 'Equipa Rusted Shield para convertirse en tipo Lucha/Acero y ganar acceso a Behemoth Bash.',
  // Usuarios Top de Eviolite (Mineral Evolutivo)
  'chansey': 'Usuario TOP de Eviolite. Al no estar completamente evolucionada, multiplica su inmensa Defensa y Defensa Especial por 1.5x.',
  'porygon2': 'Usuario TOP de Eviolite. Actúa como uno de los tanques mixtos e invocadores de Trick Room más consistentes del meta.',
  'dusclops': 'Al equipar Eviolite, sus defensas alcanzan niveles astronómicos. Excelente setter de Trick Room.',
  'clefairy': 'En VGC, usa Eviolite junto con Friend Guard y Follow Me para ser el mejor soporte defensivo posible.',
  'bisharp': 'Tras Gen 9, ahora puede usar Eviolite. Mantiene una presión ofensiva altísima con Sucker Punch mientras tiene bulk de tanque.',
  'duraludon': 'Tras la adición de Archaludon, Duraludon puede usar Eviolite para alcanzar una Defensa Física casi inquebrantable.',
  'magneton': 'Con Eviolite y Magnet Pull, es un trapper de tipo Acero mucho más bulky de lo normal.',
  'dipplin': 'Usuario de Eviolite por excelencia en Gen 9 gracias a su evolución Hydrapple, convirtiéndolo en un tanque físico supremo con Syrup Bomb.'
};

// ─── TABLA DE TIPOS ────────────────────────────────────────────────
const TYPE_CHART: Record<string, { weak: string[]; resist: string[]; immune: string[] }> = {
  normal:   { weak: ['fighting'], resist: [], immune: ['ghost'] },
  fire:     { weak: ['water','ground','rock'], resist: ['fire','grass','ice','bug','steel','fairy'], immune: [] },
  water:    { weak: ['electric','grass'], resist: ['fire','water','ice','steel'], immune: [] },
  electric: { weak: ['ground'], resist: ['electric','flying','steel'], immune: [] },
  grass:    { weak: ['fire','ice','poison','flying','bug'], resist: ['water','electric','grass','ground'], immune: [] },
  ice:      { weak: ['fire','fighting','rock','steel'], resist: ['ice'], immune: [] },
  fighting: { weak: ['flying','psychic','fairy'], resist: ['bug','rock','dark'], immune: [] },
  poison:   { weak: ['ground','psychic'], resist: ['grass','fighting','poison','bug','fairy'], immune: [] },
  ground:   { weak: ['water','grass','ice'], resist: ['poison','rock'], immune: ['electric'] },
  flying:   { weak: ['electric','ice','rock'], resist: ['grass','fighting','bug'], immune: ['ground'] },
  psychic:  { weak: ['bug','ghost','dark'], resist: ['fighting','psychic'], immune: [] },
  bug:      { weak: ['fire','flying','rock'], resist: ['grass','fighting','ground'], immune: [] },
  rock:     { weak: ['water','grass','fighting','ground','steel'], resist: ['normal','fire','poison','flying'], immune: [] },
  ghost:    { weak: ['ghost','dark'], resist: ['poison','bug'], immune: ['normal','fighting'] },
  dragon:   { weak: ['ice','dragon','fairy'], resist: ['fire','water','electric','grass'], immune: [] },
  dark:     { weak: ['fighting','bug','fairy'], resist: ['ghost','dark'], immune: ['psychic'] },
  steel:    { weak: ['fire','fighting','ground'], resist: ['normal','grass','ice','flying','psychic','bug','rock','dragon','steel','fairy'], immune: ['poison'] },
  fairy:    { weak: ['poison','steel'], resist: ['fighting','bug','dark'], immune: ['dragon'] },
};

function getTypeMatchups(type1: string, type2: string | null) {
  const types = [type1, type2].filter(Boolean).map(t => t!.toLowerCase());
  const allWeaknesses = new Map<string, number>();
  const allImmunities = new Set<string>();
  const allAttackTypes = Object.keys(TYPE_CHART);
  for (const atkType of allAttackTypes) {
    let m = 1;
    for (const defType of types) {
      const c = TYPE_CHART[defType]; if (!c) continue;
      if (c.immune.includes(atkType)) { m = 0; break; }
      if (c.weak.includes(atkType)) m *= 2;
      if (c.resist.includes(atkType)) m *= 0.5;
    }
    if (m === 0) allImmunities.add(atkType);
    else if (m >= 2) allWeaknesses.set(atkType, m);
  }
  const weaknesses = [...allWeaknesses.entries()].sort((a,b) => b[1]-a[1]).map(([t,m]) => m >= 4 ? `${t}(4x)` : t);
  const resistances: string[] = [];
  for (const atkType of allAttackTypes) {
    let m = 1;
    for (const defType of types) {
      const c = TYPE_CHART[defType]; if (!c) continue;
      if (c.weak.includes(atkType)) m *= 2;
      if (c.resist.includes(atkType)) m *= 0.5;
    }
    if (m <= 0.5 && m > 0) resistances.push(atkType);
  }
  return { weaknesses, resistances, immunities: [...allImmunities] };
}

// ─── MECÁNICAS DE PESO (GRASS KNOT / HEAVY SLAM) ───────────────────
function getWeightMechanics(weightKg: number): string {
  let gkPower = 20;
  if (weightKg >= 100) gkPower = 120;
  else if (weightKg >= 50) gkPower = 100;
  else if (weightKg >= 25) gkPower = 80;
  else if (weightKg >= 10) gkPower = 60;
  else if (weightKg >= 0.1) gkPower = 40;

  const notes = [];
  if (gkPower >= 100) notes.push(`Al pesar ${weightKg}kg, recibe DAÑO CRÍTICO MASIVO (${gkPower} BP) de movimientos basados en peso como Grass Knot (Hierba Lazo) o Low Kick (Patada Baja).`);
  if (weightKg >= 200) notes.push(`Debido a su peso extremo, es un usuario formidable de Heavy Slam (Cuerpo Pesado) y Heat Crash (Golpe Calor), haciendo daño máximo a Pokémon ligeros.`);
  if (weightKg <= 10) notes.push(`Por su bajo peso (${weightKg}kg), es virtualmente inmune al daño de Grass Knot y Low Kick (solo ${gkPower} BP), pero recibe daño máximo de Heavy Slam rivales.`);
  
  return notes.length > 0 ? notes.join(' ') : `Peso estándar (${weightKg}kg). Daño neutral a mecánicas de peso.`;
}

// ─── GENERADOR DE COUNTERS ALGORÍTMICO ─────────────────────────────
function getAlgorithmicCounters(matchups: any, stats: any): string[] {
  const counters = [];
  
  // Vulnerabilidades X4 (Instakill garantizado)
  if (matchups.weaknesses.includes('ice(4x)')) counters.push('Ice Shard priority users (ej. Chien-Pao, Mamoswine, Baxcalibur) e Ice Beams rápidos.');
  if (matchups.weaknesses.includes('ground(4x)')) counters.push('Earthquake spam (ej. Garchomp, Landorus-T, Great Tusk) y Earth Power.');
  if (matchups.weaknesses.includes('fire(4x)')) counters.push('Cualquier tipo Fuego rápido o movimientos de cobertura como Mystical Fire (ej. Heatran, Chi-Yu).');
  if (matchups.weaknesses.includes('fighting(4x)')) counters.push('Usuarios de Mach Punch y Close Combat (ej. Urshifu, Iron Valiant).');
  
  // Bulks y Roles
  if (stats.atk > 110 && stats.spa < 80) counters.push('Walled por muros físicos puros (Corviknight, Skarmory, Dondozo) y severamente frenado por usuarios de Intimidate (Incineroar) y Foul Play (Juego Sucio).');
  if (stats.spa > 110 && stats.atk < 80) counters.push('Frenado en seco por muros especiales (Blissey, Chansey, Ting-Lu) y Pokémon con Assault Vest (Chaleco Asalto).');
  if (stats.spe > 100 && stats.hp <= 75 && stats.def <= 75) counters.push('Extremadamente frágil. Sucumbe rápido ante movimientos de prioridad fuertes (Extreme Speed de Dragonite, Sucker Punch de Kingambit).');
  if (stats.spe <= 50) counters.push('Sin Trick Room, suele verse obligado a recibir un golpe antes de poder atacar, haciéndolo vulnerable a Sweepers que hagan OHKO.');

  return counters;
}

// ─── GENERADOR DE SINERGIAS DINÁMICAS EXTREMO ──────────────────────
function generateDynamicSynergy(abilities: string[], movepool: string[], stats: any): string[] {
  const synergy: string[] = [];
  const movesLower = movepool.map(m => m.toLowerCase());
  const abilitiesLower = abilities.map(a => a.toLowerCase());

  // Climas y Terrenos
  if (abilitiesLower.includes('drizzle')) synergy.push('Setter de Lluvia (Drizzle). Sinergia masiva con Swift Swim y Thunder/Hurricane (100% precisión).');
  if (abilitiesLower.includes('drought')) synergy.push('Setter de Sol (Drought). Sinergia masiva con Chlorophyll y Protosynthesis. Potencia tipos Fuego.');
  if (abilitiesLower.includes('sand stream')) synergy.push('Setter de Arena. Potencia la SpDef de tipos Roca un 50%. Sinergia con Sand Rush/Sand Force.');
  if (abilitiesLower.includes('snow warning')) synergy.push('Setter de Nieve. Aumenta Defensa de tipos Hielo. Permite Aurora Veil y Blizzard seguro.');
  if (movesLower.includes('aurora veil')) synergy.push('Usuario de Aurora Veil. Requiere Nieve. Reduce daño físico y especial del rival a la mitad.');

  // Hazards y Control de Campo
  if (movesLower.includes('stealth rock')) synergy.push('Hazard Setter (Stealth Rock). Castiga el Momentum del rival y rompe Focus Sash.');
  if (movesLower.includes('spikes') || movesLower.includes('toxic spikes')) synergy.push('Hazard Setter (Spikes/Toxic Spikes). Presión residual excelente para equipos Stall/Balance.');
  if (movesLower.includes('defog') || movesLower.includes('rapid spin') || movesLower.includes('mortal spin')) {
    synergy.push('Hazard Remover (Defog/Spin). Rol indispensable para proteger a compañeros débiles a Trampa Rocas.');
  }

  // Setup y Ofensiva
  if (movesLower.includes('swords dance') || movesLower.includes('dragon dance') || movesLower.includes('bulk up')) {
    synergy.push('Physical Setup Sweeper. Puede ganar la partida si el jugador elimina a los tanques físicos del rival.');
  }
  if (movesLower.includes('nasty plot') || movesLower.includes('quiver dance') || movesLower.includes('calm mind')) {
    synergy.push('Special Setup Sweeper. Condición de victoria si elimina a las Special Walls del rival.');
  }
  
  // Recuperación y Momentum
  if (movesLower.includes('roost') || movesLower.includes('recover') || movesLower.includes('soft-boiled') || movesLower.includes('slack off')) {
    synergy.push('Reliable Recovery. Posee curación instantánea, lo que aumenta drásticamente su longevidad como Wall o pivot defensivo.');
  }
  if (movesLower.includes('u-turn') || movesLower.includes('volt switch') || movesLower.includes('flip turn') || movesLower.includes('parting shot')) {
    synergy.push('Pivot de Momentum. Mantiene la ventaja de los cambios. Excelente compañero para atacantes frágiles.');
  }

  return synergy;
}

interface FullMovepool { levelUp:string[]; tm:string[]; egg:string[]; tutor:string[]; other:string[]; all:string[]; }
interface SmogonSet { format:string; name:string; item:string|string[]; nature:string|string[]; evs:Record<string,number>; moves:(string|string[])[]; ability?:string|string[]; teraType?:string|string[]; }
interface PokeFullData { types:string[]; stats:{hp:number;atk:number;def:number;spa:number;spd:number;spe:number}; movepool:FullMovepool; abilities:string[]; weightKg:number; }

const smogonCache = new Map<string, SmogonSet[]>();

function normalizeMonName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function loadSmogonData(): Promise<void> {
  console.log('\n📥 Cargando sets de Smogon (Incluyendo National Dex y Tiers Bajas)...');
  for (const fmt of SMOGON_FORMATS) {
    try {
      const res = await fetch(`https://pkmn.github.io/smogon/data/sets/${fmt.id}.json`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const data: Record<string, Record<string, any>> = await res.json();
      for (const [speciesName, sets] of Object.entries(data)) {
        const key = normalizeMonName(speciesName);
        const existing = smogonCache.get(key) ?? [];
        for (const [setName, setData] of Object.entries(sets)) {
          existing.push({ format:fmt.label, name:setName, item:setData.item??'', nature:setData.nature??'', evs:setData.evs??{}, moves:setData.moves??[], ability:setData.ability, teraType:setData.teraType });
        }
        smogonCache.set(key, existing);
      }
    } catch {}
  }
  console.log(`   📦 Cache Smogon: ${smogonCache.size} Pokémon únicos listos\n`);
}

async function fetchPokeFullData(nombre: string): Promise<PokeFullData | null> {
  try {
    const cleanName = nombre.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/--+/g,'-');
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    
    const types: string[] = data.types.map((t: any) => t.type.name);
    const statsMap: Record<string,number> = {};
    for (const s of data.stats) statsMap[s.stat.name] = s.base_stat;
    const abilities: string[] = data.abilities.map((a: any) => a.ability.name.replace(/-/g,' '));
    
    const levelUp:string[]=[], tm:string[]=[], egg:string[]=[], tutor:string[]=[], other:string[]=[];
    for (const moveEntry of data.moves) {
      const moveName = moveEntry.move.name.replace(/-/g,' ');
      const methods: string[] = moveEntry.version_group_details.map((d: any) => d.move_learn_method.name);
      if (methods.includes('level-up'))     levelUp.push(moveName);
      else if (methods.includes('machine')) tm.push(moveName);
      else if (methods.includes('egg'))     egg.push(moveName);
      else if (methods.includes('tutor'))   tutor.push(moveName);
      else                                  other.push(moveName);
    }
    const dedup = (arr: string[]) => [...new Set(arr)];
    
    return {
      types,
      stats: { hp:statsMap['hp']||0, atk:statsMap['attack']||0, def:statsMap['defense']||0, spa:statsMap['special-attack']||0, spd:statsMap['special-defense']||0, spe:statsMap['speed']||0 },
      movepool: { levelUp:dedup(levelUp), tm:dedup(tm), egg:dedup(egg), tutor:dedup(tutor), other:dedup(other), all:dedup([...levelUp,...tm,...egg,...tutor,...other]) },
      abilities,
      weightKg: data.weight / 10 // PokeAPI entrega hectogramos. /10 lo hace Kilogramos.
    };
  } catch { return null; }
}

function formatSet(set: SmogonSet): string {
  const item    = Array.isArray(set.item)    ? set.item.join(' / ')    : set.item;
  const moves   = set.moves.map(m => Array.isArray(m) ? m.join(' / ') : m).join(' | ');
  return `[${set.format}] ${set.name} | Item: ${item} | Moves: ${moves}`;
}

function buildCompetitiveText(
  nombre: string, pokeData: PokeFullData, smogonSets: SmogonSet[],
  perfilEstrategico: string|null, tier: string|null, usageScore: number|null
): string {
  const { types, stats, movepool, abilities, weightKg } = pokeData;
  const matchups = getTypeMatchups(types[0], types[1]||null);
  
  const hardcodedCombos = getCombosForPokemon(nombre);
  const combosText = formatCombosForEmbedding(hardcodedCombos);
  const dynamicSynergies = generateDynamicSynergy(abilities, movepool.all, stats);
  const weightNotes = getWeightMechanics(weightKg);
  const counters = getAlgorithmicCounters(matchups, stats);
  const signatureTrait = SIGNATURE_TRAITS[normalizeMonName(nombre)];

  const lines: string[] = [
    `POKEMON: ${nombre.toUpperCase()}`,
    `TIER: ${tier||'Unranked'} | USAGE: ${usageScore ? usageScore.toFixed(1)+'%' : '0%'}`,
    `TYPE: ${types.join('/')}`,
    `WEAKNESSES: ${matchups.weaknesses.join(', ')||'none'}`,
    `RESISTANCES: ${matchups.resistances.join(', ')||'none'}`,
    `IMMUNITIES: ${matchups.immunities.join(', ')||'none'}`,
    `STATS: HP:${stats.hp} ATK:${stats.atk} DEF:${stats.def} SPA:${stats.spa} SPD:${stats.spd} SPE:${stats.spe}`,
    `ABILITIES: ${abilities.join(', ')||'unknown'}`,
    ``,
  ];

  // 1. INYECCIÓN DE OBJETOS EXCLUSIVOS / EVIOLITE
  if (signatureTrait) {
    lines.push(`SIGNATURE_TRAITS (Mecánica Exclusiva):`);
    lines.push(`  - ${signatureTrait}`);
    lines.push(``);
  }

  // 2. INYECCIÓN DE MECÁNICAS DE PESO
  lines.push(`WEIGHT_DYNAMICS:`);
  lines.push(`  - ${weightNotes}`);
  lines.push(``);

  // 3. INYECCIÓN DE COUNTERS ALGORÍTMICOS
  lines.push(`THREAT_ASSESSMENT (Counters y Debilidades Específicas):`);
  if (counters.length > 0) {
    counters.forEach(c => lines.push(`  - COUNTERED BY: ${c}`));
  } else {
    lines.push(`  - Pokémon balanceado o con debilidades dependientes del meta actual.`);
  }
  lines.push(``);

  if (smogonSets.length > 0) {
    const formats = [...new Set(smogonSets.map(s => s.format))].join(', ');
    lines.push(`SMOGON_SETS (${smogonSets.length} sets en ${formats}):`);
    for (const set of smogonSets.slice(0, 15)) lines.push(`  ${formatSet(set)}`); 
  } else {
    lines.push('SMOGON_SETS: none in database');
  }
  lines.push('');

  lines.push('FULL_MOVEPOOL (TODOS LOS MOVIMIENTOS LEGALES):');
  lines.push(`  ${movepool.all.join(', ')}`);
  lines.push('');

  lines.push('TACTICAL_SYNERGY_ANALYSIS (Auto-Generated):');
  if (dynamicSynergies.length > 0) {
    dynamicSynergies.forEach(syn => lines.push(`  - ${syn}`));
  } else {
    lines.push('  - Atacante estándar o Pokémon sin mecánicas de campo/clima evidentes.');
  }
  lines.push('');

  if (combosText) { 
      lines.push('KNOWN_COMPETITIVE_COMBOS (Base de datos experta):');
      lines.push(combosText); 
      lines.push(''); 
  }

  lines.push(`STRATEGIC_PROFILE: ${perfilEstrategico||'Generado automáticamente.'}`);
  return lines.join('\n');
}

// ─── OLLAMA ───────────────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]|null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ 
        model: EMBED_MODEL, 
        prompt: text,
        options: { num_ctx: 8192 } // Límite masivo de 8k para atrapar toda la IA generada
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) { 
        const errorText = await res.text();
        console.error(`\n  ❌ Ollama ${res.status}: ${errorText.substring(0, 100)}`); 
        return null; 
    }
    return (await res.json()).embedding ?? null;
  } catch { return null; }
}

async function main() {
  console.log(`🧬 Regeneración de Embeddings VERSIÓN COMERCIAL EXTREMA`);
  console.log(`🧠 Inyectando: Smogon NatDex, Eviolite, Weight Mechanics, Autocounters y Movepools.`);
  
  await loadSmogonData();

  const records = await prisma.pokemon.findMany({
    select: { 
        id: true, nombre: true, tipo1: true, tipo2: true,
        AnalisisMeta: { select: { id: true, perfil_estrategico: true, tier: true, usage_score: true } } 
    }
  });

  console.log(`\n📊 Total registros (Pokémon) : ${records.length}`);

  let success=0, failed=0, skipped=0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i+BATCH_SIZE);
    
    for (const record of batch) {
      if (!record.nombre) { skipped++; continue; }
      const nombre = record.nombre;
      console.log(`Procesando: ${nombre}...`);
      
      const pokeData = await fetchPokeFullData(nombre);
      const meta = record.AnalisisMeta[0]; 

      if (!pokeData) { skipped++; continue; }

      const text = buildCompetitiveText(
        nombre, pokeData, smogonCache.get(normalizeMonName(nombre))??[], 
        meta?.perfil_estrategico || null, meta?.tier || null, meta?.usage_score || null
      );

      // Bloqueo de seguridad: Evita un pantallazo azul en la DB o Ollama si un Pokémon hackeado tiene un millón de moves
      const safeText = text.length > 40000 ? text.substring(0, 40000) : text;

      const embedding = await generateEmbedding(safeText);
      if (!embedding) { 
        console.log(`❌ Falló Ollama para ${nombre}.`);
        failed++; 
        continue; 
      }

      try {
        if (meta) {
            await prisma.$executeRaw`UPDATE "AnalisisMeta" SET embedding = ${`[${embedding.join(',')}]`}::vector WHERE id = ${meta.id}::uuid`;
        } else {
            const newMeta = await prisma.analisisMeta.create({
                data: {
                    pokemon_id: record.id,
                    perfil_estrategico: 'Análisis IA nivel Maestro insertado correctamente.',
                    tier: 'Untiered',
                    usage_score: 0.0
                }
            });
            await prisma.$executeRaw`UPDATE "AnalisisMeta" SET embedding = ${`[${embedding.join(',')}]`}::vector WHERE id = ${newMeta.id}::uuid`;
        }
        success++;
      } catch (err: any) { 
        console.error(`❌ DB Error [${nombre}]: ${err.message}`); 
        failed++; 
      }
      
      await new Promise(r => setTimeout(r, DELAY_MON));
    }
  }

  console.log(`\n✅ Éxito: ${success} | ❌ Fallos: ${failed} | ⏭️ Saltados: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());