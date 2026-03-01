/**
 * scripts/seed-usage.ts
 * 
 * Pobla usage_score y tier en AnalisisMeta con datos reales de Smogon.
 * 
 * USO:
 *   npx ts-node --project tsconfig.json scripts/seed-usage.ts
 *   -- o con tsx:
 *   npx tsx scripts/seed-usage.ts
 * 
 * REQUIERE: DATABASE_URL en .env
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Config ───────────────────────────────────────────────────────
// Mes de stats a usar (formato YYYY-MM). Smogon publica con ~1 mes de retraso.
const STATS_MONTH = '2025-01';

// Tiers a importar + su peso (cuánto "vale" el usage de ese tier)
// OU usage 30% vale más que NU usage 30%
const TIERS_CONFIG = [
  { smogonSlug: 'gen9ou',          tier: 'OU',     weight: 1.00 },
  { smogonSlug: 'gen9uu',          tier: 'UU',     weight: 0.75 },
  { smogonSlug: 'gen9ru',          tier: 'RU',     weight: 0.50 },
  { smogonSlug: 'gen9nu',          tier: 'NU',     weight: 0.30 },
  { smogonSlug: 'gen9vgc2025regg', tier: 'VGC',    weight: 0.90 }, // VGC 2025 Reg G (correcto)
  { smogonSlug: 'gen9nationaldex', tier: 'NatDex', weight: 0.85 }, // National Dex OU
  { smogonSlug: 'gen9doublesou',   tier: 'DOU',    weight: 0.80 }, // Doubles OU
] as const;

// ─── Tipos ────────────────────────────────────────────────────────
interface SmogonEntry {
  name: string;       // nombre en Smogon (ej: "Landorus-Therian")
  usagePct: number;   // 0–100
}

// ─── Parser del formato de texto de Smogon ────────────────────────
/**
 * Smogon stats format:
 *   | Rank | Pokemon     | Usage %  | Raw   | Raw %   | Real  | Real % |
 *   |    1 | Landorus-T  |  45.234% | 12345 |  45.21% | 11000 | 44.98% |
 */
function parseSmogonStats(text: string): SmogonEntry[] {
  const entries: SmogonEntry[] = [];
  const lines = text.split('\n');

  // DEBUG: ver primeras líneas para entender el formato
  console.log(`  📄 Primeras 8 líneas del archivo:`);
  lines.slice(0, 8).forEach((l, i) => console.log(`    [${i}] ${JSON.stringify(l)}`));

  for (const line of lines) {
    // Smogon añade un espacio al inicio → usar trim() antes de startsWith
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---') || trimmed.includes('Rank')) continue;

    const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean);
    // cols: [rank, name, usage%, raw, raw%, real, real%]
    if (cols.length < 3) continue;

    const name = cols[1];
    const usageStr = cols[2].replace('%', '').trim();
    const usagePct = parseFloat(usageStr);

    if (!name || isNaN(usagePct) || name === 'Pokemon') continue;
    entries.push({ name, usagePct });
  }

  return entries;
}

// ─── Normalización de nombres ─────────────────────────────────────
/**
 * Smogon usa nombres en inglés con mayúsculas y guiones.
 * Tu DB usa nombres en minúsculas (o con formato pokeapi).
 * Esta función intenta hacer el match.
 */
function normalizeName(smogonName: string): string[] {
  const base = smogonName.toLowerCase().trim();
  const variants = new Set<string>();

  // Base y variantes de separadores
  variants.add(base);
  variants.add(base.replace(/-/g, ' '));   // guiones → espacios
  variants.add(base.replace(/ /g, '-'));   // espacios → guiones

  // Formas alternativas: Smogon usa "Pokemon-Form", PokeAPI usa "pokemon-form"
  // Mapeamos las formas más comunes
  const FORM_MAP: Record<string, string[]> = {
    // Formas de Therian/Incarnate
    'landorus-therian':      ['landorus-therian'],
    'landorus-incarnate':    ['landorus'],
    'tornadus-therian':      ['tornadus-therian'],
    'tornadus-incarnate':    ['tornadus'],
    'thundurus-therian':     ['thundurus-therian'],
    'thundurus-incarnate':   ['thundurus'],
    'enamorus-therian':      ['enamorus-therian'],
    'enamorus-incarnate':    ['enamorus'],
    // Urshifu
    'urshifu-rapid-strike':  ['urshifu-rapid-strike', 'urshifu'],
    'urshifu-single-strike': ['urshifu', 'urshifu-single-strike'],
    // Calyrex
    'calyrex-shadow':        ['calyrex-shadow', 'calyrex-shadow-rider'],
    'calyrex-ice':           ['calyrex-ice', 'calyrex-ice-rider'],
    // Formas regionales
    'slowbro-galar':         ['slowbro-galar'],
    'slowking-galar':        ['slowking-galar'],
    'zapdos-galar':          ['zapdos-galar'],
    'articuno-galar':        ['articuno-galar'],
    'moltres-galar':         ['moltres-galar'],
    'corsola-galar':         ['corsola-galar'],
    'zigzagoon-galar':       ['zigzagoon-galar'],
    'linoone-galar':         ['linoone-galar'],
    'weezing-galar':         ['weezing-galar'],
    'ponyta-galar':          ['ponyta-galar'],
    'rapidash-galar':        ['rapidash-galar'],
    'darumaka-galar':        ['darumaka-galar'],
    'darmanitan-galar':      ['darmanitan-galar', 'darmanitan-galar-standard'],
    'yamask-galar':          ['yamask-galar'],
    'stunfisk-galar':        ['stunfisk-galar'],
    'farfetchd-galar':       ['farfetchd-galar'],
    'meowth-galar':          ['meowth-galar'],
    // Formas Hisui
    'typhlosion-hisui':      ['typhlosion-hisui'],
    'samurott-hisui':        ['samurott-hisui'],
    'decidueye-hisui':       ['decidueye-hisui'],
    'arcanine-hisui':        ['arcanine-hisui'],
    'electrode-hisui':       ['electrode-hisui'],
    'zoroark-hisui':         ['zoroark-hisui'],
    'avalugg-hisui':         ['avalugg-hisui'],
    'goodra-hisui':          ['goodra-hisui'],
    'lilligant-hisui':       ['lilligant-hisui'],
    'voltorb-hisui':         ['voltorb-hisui'],
    'qwilfish-hisui':        ['qwilfish-hisui'],
    'sneasel-hisui':         ['sneasel-hisui'],
    // Formas Alola
    'raichu-alola':          ['raichu-alola'],
    'sandshrew-alola':       ['sandshrew-alola'],
    'sandslash-alola':       ['sandslash-alola'],
    'vulpix-alola':          ['vulpix-alola'],
    'ninetales-alola':       ['ninetales-alola'],
    'diglett-alola':         ['diglett-alola'],
    'dugtrio-alola':         ['dugtrio-alola'],
    'meowth-alola':          ['meowth-alola'],
    'persian-alola':         ['persian-alola'],
    'geodude-alola':         ['geodude-alola'],
    'graveler-alola':        ['graveler-alola'],
    'golem-alola':           ['golem-alola'],
    'grimer-alola':          ['grimer-alola'],
    'muk-alola':             ['muk-alola'],
    'exeggutor-alola':       ['exeggutor-alola'],
    'marowak-alola':         ['marowak-alola'],
    // Formas Paldea
    'wooper-paldea':         ['wooper-paldea'],
    'tauros-paldea':         ['tauros-paldea-combat', 'tauros-paldea'],
    'tauros-paldea-fire':    ['tauros-paldea-blaze', 'tauros-paldea-fire'],
    'tauros-paldea-water':   ['tauros-paldea-aqua', 'tauros-paldea-water'],
    // Formas especiales
    'rotom-wash':            ['rotom-wash'],
    'rotom-heat':            ['rotom-heat'],
    'rotom-frost':           ['rotom-frost'],
    'rotom-fan':             ['rotom-fan'],
    'rotom-mow':             ['rotom-mow'],
    'oricorio-baile':        ['oricorio', 'oricorio-baile'],
    'oricorio-pom-pom':      ['oricorio-pom-pom'],
    'oricorio-pau':          ['oricorio-pau'],
    'oricorio-sensu':        ['oricorio-sensu'],
    'lycanroc-midday':       ['lycanroc', 'lycanroc-midday'],
    'lycanroc-midnight':     ['lycanroc-midnight'],
    'lycanroc-dusk':         ['lycanroc-dusk'],
    'wishiwashi-school':     ['wishiwashi', 'wishiwashi-school'],
    'minior-meteor':         ['minior', 'minior-meteor'],
    'kommo-o':               ['kommo-o'],
    'jangmo-o':              ['jangmo-o'],
    'hakamo-o':              ['hakamo-o'],
    // Necrozma
    'necrozma-dusk-mane':    ['necrozma-dusk-mane'],
    'necrozma-dawn-wings':   ['necrozma-dawn-wings'],
    'necrozma-ultra':        ['necrozma-ultra'],
    // Kyurem
    'kyurem-black':          ['kyurem-black'],
    'kyurem-white':          ['kyurem-white'],
    // Zygarde
    'zygarde-50':            ['zygarde', 'zygarde-50'],
    'zygarde-10':            ['zygarde-10'],
    // Shaymin
    'shaymin-sky':           ['shaymin-sky'],
    'shaymin-land':          ['shaymin', 'shaymin-land'],
    // Giratina
    'giratina-origin':       ['giratina-origin'],
    'giratina-altered':      ['giratina', 'giratina-altered'],
    // Deoxys
    'deoxys-attack':         ['deoxys-attack'],
    'deoxys-defense':        ['deoxys-defense'],
    'deoxys-speed':          ['deoxys-speed'],
    'deoxys-normal':         ['deoxys', 'deoxys-normal'],
    // Hoopa
    'hoopa-unbound':         ['hoopa-unbound'],
    'hoopa-confined':        ['hoopa', 'hoopa-confined'],
    // Ogerpon
    'ogerpon-wellspring':    ['ogerpon-wellspring'],
    'ogerpon-hearthflame':   ['ogerpon-hearthflame'],
    'ogerpon-cornerstone':   ['ogerpon-cornerstone'],
    'ogerpon-teal':          ['ogerpon', 'ogerpon-teal'],
    // Terapagos
    'terapagos-terastal':    ['terapagos', 'terapagos-terastal'],
    'terapagos-stellar':     ['terapagos-stellar'],
    // Indeedee
    'indeedee-f':            ['indeedee-f', 'indeedee-female'],
    'indeedee-m':            ['indeedee', 'indeedee-male'],
    // Basculegion
    'basculegion-f':         ['basculegion-f', 'basculegion-female'],
    'basculegion-m':         ['basculegion', 'basculegion-male'],
    // Oinkologne
    'oinkologne-f':          ['oinkologne-f', 'oinkologne-female'],
    'oinkologne-m':          ['oinkologne', 'oinkologne-male'],
    // Meowstic
    'meowstic-f':            ['meowstic-f', 'meowstic-female'],
    'meowstic-m':            ['meowstic', 'meowstic-male'],
  };

  // Aplicar mapa de formas si existe
  if (FORM_MAP[base]) {
    for (const v of FORM_MAP[base]) variants.add(v);
  }

  // También intentar base sin sufijo de forma (útil para formas no mapeadas)
  // Ej: "pokemon-form" → "pokemon"
  const baseParts = base.split('-');
  if (baseParts.length > 1) {
    // Intentar sin el último segmento
    variants.add(baseParts.slice(0, -1).join('-'));
    // Intentar solo el nombre base (sin ningún sufijo de forma)
    variants.add(baseParts[0]);
  }

  // Caracteres especiales comunes
  // Farfetch'd → farfetchd
  variants.add(base.replace(/'/g, '').replace(/:/g, '').replace(/\./g, ''));
  // mr-mime → mr. mime, mr mime
  variants.add(base.replace(/-/g, '. ', ));
  // Type: Null
  variants.add(base.replace(/-/g, ': '));

  return [...variants].filter(Boolean);
}

// ─── Fetch con retry ──────────────────────────────────────────────
async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) {
        console.log(`  [404] No existe: ${url}`);
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i < retries - 1) {
        console.log(`  Reintento ${i + 1}/${retries}...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      } else {
        console.error(`  Error al fetch ${url}:`, err);
        return null;
      }
    }
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('🏆 Seed de Usage Stats de Smogon\n');
  console.log(`📅 Mes: ${STATS_MONTH}`);
  console.log(`📊 Tiers: ${TIERS_CONFIG.map(t => t.tier).join(', ')}\n`);

  // Mapa acumulativo: nombre_normalizado → { maxScore, tier }
  // Si un Pokémon aparece en varios tiers, guardamos el mayor score ponderado
  const scoreMap = new Map<string, { score: number; tier: string }>();

  // 1. Obtener todos los nombres de Pokémon en tu DB para hacer lookup eficiente
  const allPokemon = await prisma.pokemon.findMany({
    select: { id: true, nombre: true },
  });
  const nameToId = new Map<string, number>();
  for (const p of allPokemon) {
    nameToId.set(p.nombre.toLowerCase(), p.id);
  }
  console.log(`🗄️  Pokémon en DB: ${allPokemon.length}\n`);

  // 2. Procesar cada tier
  for (const { smogonSlug, tier, weight } of TIERS_CONFIG) {
    const url = `https://www.smogon.com/stats/${STATS_MONTH}/${smogonSlug}-0.txt`;
    console.log(`⬇️  Fetching ${tier} (${url})...`);

    const text = await fetchWithRetry(url);
    if (!text) {
      console.log(`  ⚠️  Saltando ${tier}\n`);
      continue;
    }

    const entries = parseSmogonStats(text);
    console.log(`  ✅ ${entries.length} Pokémon encontrados en ${tier}`);

    let matched = 0;
    for (const entry of entries) {
      const weightedScore = entry.usagePct * weight;
      const nameVariants = normalizeName(entry.name);

      // Buscar match en DB
      let dbId: number | undefined;
      let matchedName: string | undefined;

      for (const variant of nameVariants) {
        if (nameToId.has(variant)) {
          dbId = nameToId.get(variant);
          matchedName = variant;
          break;
        }
      }

      if (!dbId) continue;
      matched++;

      // Guardar el score más alto entre todos los tiers
      const existing = scoreMap.get(matchedName!);
      if (!existing || weightedScore > existing.score) {
        scoreMap.set(matchedName!, { score: weightedScore, tier });
      }
    }

    console.log(`  🎯 ${matched} Pokémon matcheados en DB\n`);
  }

  // 3. Aplicar a la DB en lotes
  console.log(`\n💾 Actualizando ${scoreMap.size} Pokémon en DB...`);

  let updated = 0;
  let notFound = 0;
  const BATCH_SIZE = 20;
  const entries = [...scoreMap.entries()];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async ([nombre, { score, tier }]) => {
      const pokemon = allPokemon.find(p => p.nombre.toLowerCase() === nombre);
      if (!pokemon) { notFound++; return; }

      const result = await prisma.analisisMeta.updateMany({
        where: { pokemon_id: pokemon.id },
        data: {
          usage_score: parseFloat(score.toFixed(4)),
          tier,
        },
      });

      if (result.count > 0) updated++;
      else notFound++;
    }));

    // Progress
    if (i % 100 === 0) {
      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length}...\r`);
    }
  }

  console.log(`\n✅ Actualizados: ${updated} registros`);
  console.log(`⚠️  Sin match en AnalisisMeta: ${notFound}`);

  // 4. Pokémon sin usage (no aparecen en ningún tier) → dejar en 0 / Unranked
  //    Ya tienen el default por la migración SQL, no hace falta nada.

  // 5. Resumen por tier
  console.log('\n📊 Resumen por tier:');
  const tierCounts = new Map<string, number>();
  for (const { tier } of scoreMap.values()) {
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
  }
  for (const [tier, count] of [...tierCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tier}: ${count} Pokémon`);
  }

  // 6. Top 10 por score
  console.log('\n🏆 Top 10 por usage_score ponderado:');
  const top10 = [...scoreMap.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10);
  for (const [name, { score, tier }] of top10) {
    console.log(`  ${name.padEnd(20)} ${tier.padEnd(8)} ${score.toFixed(2)}`);
  }
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());