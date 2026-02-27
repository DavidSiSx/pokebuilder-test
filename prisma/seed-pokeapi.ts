import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando descarga masiva desde PokéAPI...')

  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
  const data = await response.json()
  const pokemonList = data.results

  console.log(`Se encontraron ${pokemonList.length} Pokémon. Empezando a procesar...`)

  for (const [index, p] of pokemonList.entries()) {
    try {
      const pokeRes = await fetch(p.url)
      const pokeData = await pokeRes.json()

      const tipo1 = pokeData.types[0].type.name
      const tipo2 = pokeData.types.length > 1 ? pokeData.types[1].type.name : null

      const hp_base = pokeData.stats.find((s: any) => s.stat.name === 'hp').base_stat
      const atk_base = pokeData.stats.find((s: any) => s.stat.name === 'attack').base_stat
      const def_base = pokeData.stats.find((s: any) => s.stat.name === 'defense').base_stat
      const spa_base = pokeData.stats.find((s: any) => s.stat.name === 'special-attack').base_stat
      const spd_base = pokeData.stats.find((s: any) => s.stat.name === 'special-defense').base_stat
      const spe_base = pokeData.stats.find((s: any) => s.stat.name === 'speed').base_stat

      await prisma.pokemon.upsert({
        where: { nombre: pokeData.name },
        update: {},
        create: {
          nombre: pokeData.name,
          tipo1: tipo1,
          tipo2: tipo2,
          hp_base: hp_base,
          atk_base: atk_base,
          def_base: def_base,
          spa_base: spa_base,
          spd_base: spd_base,
          spe_base: spe_base,
        },
      })

      if ((index + 1) % 50 === 0) {
        console.log(`Progreso: ${index + 1} / ${pokemonList.length} Pokémon guardados...`)
      }
    } catch (error) {
      console.error(`Error procesando a ${p.name}:`, error)
    }
  }

  console.log('¡Toda la Pokédex ha sido guardada en Supabase con éxito!')
}

main()
  .catch((e) => {
    console.error('Error fatal en el script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })