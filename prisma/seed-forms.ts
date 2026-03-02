/**
 * prisma/seed-forms.ts
 *
 * Inserta las formas alternativas competitivas que PokeAPI tiene
 * en endpoints separados y que seed-pokeapi.ts no captura porque:
 *   a) Están fuera del limit=1500
 *   b) Fueron filtradas por formasIgnoradas
 *   c) Tienen nombres especiales en Showdown vs PokeAPI
 *
 * Uso:
 *   npx ts-node prisma/seed-forms.ts
 *   npx ts-node prisma/seed-forms.ts --dry-run   ← solo muestra qué insertaría
 *   npx ts-node prisma/seed-forms.ts --check     ← muestra cuáles ya están en DB
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const args   = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const check  = args.includes('--check')

// ─── Delay para no martillar PokeAPI ─────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ═════════════════════════════════════════════════════════════════
// FORMAS COMPETITIVAS — nombre en Showdown → nombre en PokeAPI
//
// Cuando el nombre es igual en ambos, el valor es null.
// Cuando difieren (Showdown usa un nombre distinto a PokeAPI),
// el valor es el nombre exacto del endpoint de PokeAPI.
// ═════════════════════════════════════════════════════════════════
const COMPETITIVE_FORMS: Record<string, string | null> = {

  // ── Urshifu ───────────────────────────────────────────────────
  'urshifu-rapid-strike':          null,
  // urshifu (Single Strike) ya debería estar en la DB

  // ── Ogerpon ───────────────────────────────────────────────────
  'ogerpon-wellspring':            null,
  'ogerpon-hearthflame':           null,
  'ogerpon-cornerstone':           null,

  // ── Calyrex ───────────────────────────────────────────────────
  'calyrex-shadow':                'calyrex-shadow-rider',
  'calyrex-ice':                   'calyrex-ice-rider',

  // ── Zacian / Zamazenta ────────────────────────────────────────
  'zacian-crowned':                'zacian-crowned-sword',
  'zamazenta-crowned':             'zamazenta-crowned-shield',

  // ── Kyurem ────────────────────────────────────────────────────
  'kyurem-black':                  null,
  'kyurem-white':                  null,

  // ── Necrozma ──────────────────────────────────────────────────
  'necrozma-dawn-wings':           null,
  'necrozma-dusk-mane':            null,

  // ── Tauros Paldea ─────────────────────────────────────────────
  'tauros-paldea-combat':          'tauros-paldea-combat-breed',
  'tauros-paldea-blaze':           'tauros-paldea-blaze-breed',
  'tauros-paldea-aqua':            'tauros-paldea-aqua-breed',

  // ── Basculegion ───────────────────────────────────────────────
  'basculegion-f':                 'basculegion-female',

  // ── Indeedee ──────────────────────────────────────────────────
  'indeedee-f':                    'indeedee-female',

  // ── Meowstic ──────────────────────────────────────────────────
  'meowstic-f':                    'meowstic-female',

  // ── Lycanroc ──────────────────────────────────────────────────
  'lycanroc-midnight':             null,
  'lycanroc-dusk':                 null,

  // ── Toxtricity ────────────────────────────────────────────────
  'toxtricity-low-key':            null,

  // ── Wishiwashi ────────────────────────────────────────────────
  'wishiwashi-school':             null,

  // ── Mimikyu ───────────────────────────────────────────────────
  // busted es la forma post-ataque, mismos stats — usamos base para sprites
  'mimikyu-busted':                'mimikyu-busted',

  // ── Morpeko ───────────────────────────────────────────────────
  'morpeko-hangry':                null,

  // ── Eiscue ────────────────────────────────────────────────────
  'eiscue-noice':                  null,

  // ── Palafin ───────────────────────────────────────────────────
  'palafin-hero':                  null,

  // ── Maushold ──────────────────────────────────────────────────
  'maushold-four':                 'maushold-family-of-four',

  // ── Dudunsparce ───────────────────────────────────────────────
  'dudunsparce-three-segment':     'dudunsparce-three-segment',

  // ── Squawkabilly ──────────────────────────────────────────────
  'squawkabilly-blue-plumage':     'squawkabilly-blue-plumage',
  'squawkabilly-yellow-plumage':   'squawkabilly-yellow-plumage',
  'squawkabilly-white-plumage':    'squawkabilly-white-plumage',

  // ── Rotom formas ─────────────────────────────────────────────
  'rotom-heat':                    null,
  'rotom-wash':                    null,
  'rotom-frost':                   null,
  'rotom-fan':                     null,
  'rotom-mow':                     null,

  // ── Wormadam ──────────────────────────────────────────────────
  'wormadam-sandy':                null,
  'wormadam-trash':                null,

  // ── Giratina ──────────────────────────────────────────────────
  'giratina-origin':               null,

  // ── Shaymin ───────────────────────────────────────────────────
  'shaymin-sky':                   null,

  // ── Tornadus / Thundurus / Landorus / Enamorus ───────────────
  'tornadus-therian':              null,
  'thundurus-therian':             null,
  'landorus-therian':              null,
  'enamorus-therian':              null,

  // ── Meloetta ──────────────────────────────────────────────────
  'meloetta-pirouette':            null,

  // ── Deoxys ────────────────────────────────────────────────────
  'deoxys-attack':                 null,
  'deoxys-defense':                null,
  'deoxys-speed':                  null,

  // ── Hoopa ─────────────────────────────────────────────────────
  'hoopa-unbound':                 null,

  // ── Aegislash ─────────────────────────────────────────────────
  'aegislash-blade':               null,

  // ── Pumpkaboo / Gourgeist ─────────────────────────────────────
  'pumpkaboo-large':               null,
  'pumpkaboo-super':               null,
  'gourgeist-large':               null,
  'gourgeist-super':               null,

  // ── Zygarde ───────────────────────────────────────────────────
  'zygarde-10':                    'zygarde-10-power-construct',

  // ── Minior ────────────────────────────────────────────────────
  'minior-meteor':                 'minior-red-meteor',

  // ── Greninja ──────────────────────────────────────────────────
  'greninja-ash':                  null,
  'greninja-battle-bond':          null,

  // ── Silvally ──────────────────────────────────────────────────
  // silvally-* tipos: generamos los 18 tipos
  ...Object.fromEntries(
    ['fighting','flying','poison','ground','rock','bug','ghost','steel',
     'fire','water','grass','electric','psychic','ice','dragon','dark','fairy','normal']
    .map(t => [`silvally-${t}`, null])
  ),

  // ── Alcremie formas (las más usadas competitivamente son la base,
  //    pero Showdown las diferencia) ─────────────────────────────
  // Solo la base: 'alcremie' ya debería estar

  // ── Magearna ──────────────────────────────────────────────────
  'magearna-original':             null,

  // ── Florges ───────────────────────────────────────────────────
  // Solo la base es relevante

  // ── Urshifu G-Max (ignorar, Gmax está en formasIgnoradas) ─────

  // ── Forme Paradox que pueden faltar ───────────────────────────
  // Estas deberían estar si limit=1500 las alcanzó,
  // pero las listamos por seguridad
  'iron-leaves':                   null,
  'iron-boulder':                  null,
  'iron-crown':                    null,
  'gouging-fire':                  null,
  'raging-bolt':                   null,
  'walking-wake':                  null,

  // ── Koraidon / Miraidon formas ────────────────────────────────
  'koraidon-limited-build':        null,
  'koraidon-sprinting-build':      null,
  'miraidon-low-power-mode':       null,
  'miraidon-drive-mode':           null,
}

// ═════════════════════════════════════════════════════════════════
// FETCH con fallback nativo (Node < 18)
// ═════════════════════════════════════════════════════════════════
import * as https from 'https'
import * as http  from 'http'

function httpGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib.get(url, { headers: { 'User-Agent': 'Pokelab-Seed/1.0' } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return resolve(httpGet(res.headers.location))
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks: Buffer[] = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function fetchPokeAPI(name: string): Promise<any> {
  return httpGet(`https://pokeapi.co/api/v2/pokemon/${name}`)
}

// ═════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🔴 Pokelab — Seed Formas Competitivas\n' + '─'.repeat(50))
  if (dryRun) console.log('⚠  DRY RUN — no se escribirá en la DB\n')

  // Pre-cargar nombres existentes en DB
  const existing = await prisma.pokemon.findMany({ select: { nombre: true } })
  const inDB      = new Set(existing.map(p => p.nombre.toLowerCase()))
  console.log(`📦 ${inDB.size} Pokémon ya en DB\n`)

  if (check) {
    console.log('🔍 Estado de formas competitivas:\n')
    let found = 0, missing = 0
    for (const showdownName of Object.keys(COMPETITIVE_FORMS)) {
      const inDb = inDB.has(showdownName)
      console.log(`  ${inDb ? '✅' : '❌'} ${showdownName}`)
      inDb ? found++ : missing++
    }
    console.log(`\n  ✅ En DB: ${found}  |  ❌ Faltan: ${missing}`)
    await prisma.$disconnect()
    return
  }

  let insertados = 0
  let yaExistian = 0
  let errores    = 0
  const errList: string[] = []

  const total = Object.keys(COMPETITIVE_FORMS).length
  let i = 0

  for (const [showdownName, pokeApiName] of Object.entries(COMPETITIVE_FORMS)) {
    i++
    const apiName = pokeApiName ?? showdownName

    // Si ya está en DB con el nombre de Showdown, saltar
    if (inDB.has(showdownName)) {
      yaExistian++
      process.stdout.write(`\r   ${i}/${total} — ⏭  ${showdownName} (ya existe)      `)
      continue
    }

    try {
      process.stdout.write(`\r   ${i}/${total} — ⬇  ${showdownName}...                 `)

      const data = await fetchPokeAPI(apiName)

      const tipo1   = data.types[0].type.name
      const tipo2   = data.types.length > 1 ? data.types[1].type.name : null
      const hp_base = data.stats.find((s: any) => s.stat.name === 'hp').base_stat
      const atk_base= data.stats.find((s: any) => s.stat.name === 'attack').base_stat
      const def_base= data.stats.find((s: any) => s.stat.name === 'defense').base_stat
      const spa_base= data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat
      const spd_base= data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat
      const spe_base= data.stats.find((s: any) => s.stat.name === 'speed').base_stat
      const sprite  = data.sprites?.other?.['official-artwork']?.front_default
                   ?? data.sprites?.front_default
                   ?? null

      if (!dryRun) {
        await prisma.pokemon.upsert({
          where:  { nombre: showdownName },
          create: {
            nombre:     showdownName,
            tipo1, tipo2,
            hp_base, atk_base, def_base, spa_base, spd_base, spe_base,
            sprite_url: sprite,
          },
          update: {
            tipo1, tipo2,
            hp_base, atk_base, def_base, spa_base, spd_base, spe_base,
            sprite_url: sprite,
          },
        })
      }

      insertados++
      await delay(120) // Rate limit PokeAPI gentil

    } catch (e: any) {
      errores++
      errList.push(`${showdownName} (api: ${apiName}) → ${e.message}`)
      await delay(300)
    }
  }

  // ── Resumen ─────────────────────────────────────────────────
  console.log('\n\n' + '─'.repeat(50))
  console.log('✅ Completado')
  console.log(`   Insertados/actualizados: ${insertados}`)
  console.log(`   Ya existían en DB:       ${yaExistian}`)
  console.log(`   Errores (no en PokeAPI): ${errores}`)

  if (errList.length) {
    console.log('\n⚠  No encontrados en PokeAPI (nombres alternativos o removidos):')
    errList.forEach(e => console.log(`   - ${e}`))
    console.log('\n   Estos Pokémon no existen en PokeAPI con ese nombre.')
    console.log('   Puedes agregarlos manualmente en COMPETITIVE_FORMS con el nombre correcto.')
  }

  console.log('\n💡 Próximo paso: vuelve a correr seed-showdown.ts para generar')
  console.log('   los embeddings de las formas recién insertadas:')
  console.log('   npx ts-node prisma/seed-showdown.ts --only-missing\n')

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('\n❌ Error fatal:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})