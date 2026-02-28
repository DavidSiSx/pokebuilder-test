import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Filtramos formas estéticas o no competitivas para no ensuciar el buscador
const formasIgnoradas = [
  '-totem', '-cap', '-cosplay', '-star', '-gmax', '-eternamax', 
  '-spiky-eared', '-starter', '-resolute', '-busted'
]

async function main() {
  console.log('Iniciando descarga masiva y táctica desde PokéAPI...')

  // Aumentamos el límite a 1500 para atrapar todos los IDs 10001+ (Formas Regionales, Megas, etc.)
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500')
  const data = await response.json()
  const pokemonList = data.results

  console.log(`Se encontraron ${pokemonList.length} registros. Filtrando y procesando...`)

  let guardados = 0;

  for (const [index, p] of pokemonList.entries()) {
    try {
      // Evitar llamadas innecesarias a la API si el nombre incluye un sufijo ignorado
      if (formasIgnoradas.some(sufijo => p.name.includes(sufijo))) {
        continue;
      }

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

      // Nota: Si en tu schema tienes sprite_url, puedes agregarlo aquí:
      // const sprite_url = pokeData.sprites.front_default || pokeData.sprites.other['official-artwork'].front_default

      await prisma.pokemon.upsert({
        where: { nombre: pokeData.name },
        update: {}, // Si ya existe, no lo sobreescribe para no gastar tiempo
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
          // sprite_url: sprite_url, <-- Descomenta si lo usas en tu DB
        },
      })

      guardados++;

      if (guardados % 50 === 0) {
        console.log(`Progreso: ${guardados} Pokémon y formas alternas guardados... (Último: ${pokeData.name})`)
      }
    } catch (error) {
      console.error(`Error procesando a ${p.name}:`, error)
    }
  }

  console.log(`¡Carga completada! ${guardados} Pokémon insertados exitosamente (Formas de Alola, Megas y Oricorios incluidos).`)
}

main()
  .catch((e) => {
    console.error('Error fatal en el script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })