/**
 * prisma/seed-megas.ts
 *
 * Inserta todas las Mega Evoluciones y Primals competitivos
 * relevantes para National Dex, National Dex AG y formatos legacy.
 *
 * Uso:
 *   npx ts-node prisma/seed-megas.ts
 *   npx ts-node prisma/seed-megas.ts --dry-run
 *   npx ts-node prisma/seed-megas.ts --check
 */

import { PrismaClient } from '@prisma/client'
import * as https from 'https'
import * as http  from 'http'

const prisma = new PrismaClient()
const args   = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const check  = args.includes('--check')

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─────────────────────────────────────────────────────────────────
// nombre en DB (Showdown) → nombre en PokeAPI (null = igual)
// ─────────────────────────────────────────────────────────────────
const MEGA_FORMS: Record<string, string | null> = {
  // ── Gen 1 ─────────────────────────────────────────────────
  'venusaur-mega':       null,
  'charizard-mega-x':    null,
  'charizard-mega-y':    null,
  'blastoise-mega':      null,
  'beedrill-mega':       null,
  'pidgeot-mega':        null,
  'alakazam-mega':       null,
  'slowbro-mega':        null,
  'gengar-mega':         null,
  'kangaskhan-mega':     null,
  'pinsir-mega':         null,
  'gyarados-mega':       null,
  'aerodactyl-mega':     null,
  'mewtwo-mega-x':       null,
  'mewtwo-mega-y':       null,

  // ── Gen 2 ─────────────────────────────────────────────────
  'ampharos-mega':       null,
  'steelix-mega':        null,
  'scizor-mega':         null,
  'heracross-mega':      null,
  'houndoom-mega':       null,
  'tyranitar-mega':      null,

  // ── Gen 3 ─────────────────────────────────────────────────
  'sceptile-mega':       null,
  'blaziken-mega':       null,
  'swampert-mega':       null,
  'gardevoir-mega':      null,
  'sableye-mega':        null,
  'mawile-mega':         null,
  'aggron-mega':         null,
  'medicham-mega':       null,
  'manectric-mega':      null,
  'sharpedo-mega':       null,
  'camerupt-mega':       null,
  'altaria-mega':        null,
  'banette-mega':        null,
  'absol-mega':          null,
  'glalie-mega':         null,
  'salamence-mega':      null,
  'metagross-mega':      null,
  'latias-mega':         null,
  'latios-mega':         null,
  'rayquaza-mega':       null,
  'groudon-primal':      null,
  'kyogre-primal':       null,

  // ── Gen 4 ─────────────────────────────────────────────────
  'garchomp-mega':       null,
  'lucario-mega':        null,
  'abomasnow-mega':      null,
  'lopunny-mega':        null,
  'gallade-mega':        null,

  // ── Gen 5 ─────────────────────────────────────────────────
  'audino-mega':         null,

  // ── Gen 6 ─────────────────────────────────────────────────
  'diancie-mega':        null,
}

// ─── HTTP helper ─────────────────────────────────────────────────
function httpGetJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib.get(url, { headers: { 'User-Agent': 'Pokelab-Seed/1.0' } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return resolve(httpGetJSON(res.headers.location))
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks: Buffer[] = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try   { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔴 Pokelab — Seed Megas & Primals\n' + '─'.repeat(50))
  if (dryRun) console.log('⚠  DRY RUN — no se escribirá en la DB\n')

  const existing = await prisma.pokemon.findMany({ select: { nombre: true } })
  const inDB     = new Set(existing.map(p => p.nombre.toLowerCase()))
  console.log(`📦 ${inDB.size} Pokémon en DB`)
  console.log(`🎯 ${Object.keys(MEGA_FORMS).length} Megas/Primals en la lista`)

  // ── --check ───────────────────────────────────────────────
  if (check) {
    console.log('\n🔍 Estado:\n')
    let found = 0, missing = 0
    for (const name of Object.keys(MEGA_FORMS)) {
      const ok = inDB.has(name)
      console.log(`  ${ok ? '✅' : '❌'} ${name}`)
      ok ? found++ : missing++
    }
    console.log(`\n  ✅ En DB: ${found}  |  ❌ Faltan: ${missing}`)
    await prisma.$disconnect()
    return
  }

  const toInsert = Object.entries(MEGA_FORMS).filter(([name]) => !inDB.has(name))
  console.log(`🔧 ${toInsert.length} por insertar\n`)

  if (toInsert.length === 0) {
    console.log('✅ Todas las Megas ya están en la DB.')
    await prisma.$disconnect()
    return
  }

  let insertados = 0
  let errores    = 0
  const errList: string[] = []

  for (let i = 0; i < toInsert.length; i++) {
    const [showdownName, overrideName] = toInsert[i]
    const apiName = overrideName ?? showdownName

    process.stdout.write(`\r   [${i + 1}/${toInsert.length}] ⬇  ${showdownName}...                    `)

    try {
      const data = await httpGetJSON(`https://pokeapi.co/api/v2/pokemon/${apiName}`)

      const tipo1    = data.types[0].type.name
      const tipo2    = data.types.length > 1 ? data.types[1].type.name : null
      const hp_base  = data.stats.find((s: any) => s.stat.name === 'hp').base_stat
      const atk_base = data.stats.find((s: any) => s.stat.name === 'attack').base_stat
      const def_base = data.stats.find((s: any) => s.stat.name === 'defense').base_stat
      const spa_base = data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat
      const spd_base = data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat
      const spe_base = data.stats.find((s: any) => s.stat.name === 'speed').base_stat
      const sprite   = data.sprites?.other?.['official-artwork']?.front_default
                    ?? data.sprites?.front_default
                    ?? null

      if (!dryRun) {
        await prisma.pokemon.upsert({
          where:  { nombre: showdownName },
          create: { nombre: showdownName, tipo1, tipo2, hp_base, atk_base, def_base, spa_base, spd_base, spe_base, sprite_url: sprite },
          update: { tipo1, tipo2, hp_base, atk_base, def_base, spa_base, spd_base, spe_base, sprite_url: sprite },
        })
      }

      insertados++
      await delay(120)

    } catch (e: any) {
      errores++
      errList.push(`${showdownName} → ${e.message}`)
      await delay(300)
    }
  }

  console.log('\n\n' + '─'.repeat(50))
  console.log('✅ Completado')
  console.log(`   Insertados: ${insertados}`)
  console.log(`   Errores:    ${errores}`)

  if (errList.length) {
    console.log('\n⚠  No encontrados en PokeAPI:')
    errList.forEach(e => console.log(`   - ${e}`))
  }

  if (insertados > 0 && !dryRun) {
    console.log('\n💡 Siguiente paso:')
    console.log('   npx ts-node prisma/seed-showdown.ts --only-missing')
  }

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('\n❌ Error fatal:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})