import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Función de apoyo para poner el nombre bonito (ej: "focus-sash" -> "Focus Sash")
const formatName = (str: string) => {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

async function main() {
  console.log('Iniciando descarga de datos competitivos...')

  // ---------------------------------------------------------
  // 1. Extraer Movimientos (Mantenemos Showdown porque funcionó)
  // ---------------------------------------------------------
  console.log('Revisando Movimientos...')
  try {
    const movesRes = await fetch('https://play.pokemonshowdown.com/data/moves.json')
    const movesData = await movesRes.json()

    const movimientosArray = []
    for (const key in movesData) {
      const move = movesData[key]
      if (move.category && move.type && move.name) {
        movimientosArray.push({
          nombre: move.name,
          tipo: move.type.toLowerCase(),
          categoria: move.category,
        })
      }
    }

    const movResult = await prisma.movimiento.createMany({
      data: movimientosArray,
      skipDuplicates: true, // Si ya están, los ignora y no da error
    })
    console.log(`¡Movimientos validados en Supabase! (Nuevos insertados: ${movResult.count})`)
  } catch (error) {
    console.log('Error con Movimientos. Como ya tenías 954, continuamos al siguiente paso...')
  }

  // ---------------------------------------------------------
  // 2. Extraer Habilidades (¡Cambiado a PokéAPI!)
  // ---------------------------------------------------------
  console.log('Descargando Habilidades desde PokéAPI...')
  const abRes = await fetch('https://pokeapi.co/api/v2/ability?limit=1000')
  const abData = await abRes.json()
  
  // Mapeamos los resultados para que coincidan con nuestro modelo
  const habilidadesArray = abData.results.map((ab: any) => ({
    nombre: formatName(ab.name)
  }))

  const abResult = await prisma.habilidad.createMany({
    data: habilidadesArray,
    skipDuplicates: true,
  })
  console.log(`¡${abResult.count} Habilidades guardadas en Supabase!`)

  // ---------------------------------------------------------
  // 3. Extraer Objetos (¡Cambiado a PokéAPI!)
  // ---------------------------------------------------------
  console.log('Descargando Objetos desde PokéAPI...')
  const itemsRes = await fetch('https://pokeapi.co/api/v2/item?limit=2500')
  const itemsData = await itemsRes.json()

  const objetosArray = itemsData.results.map((item: any) => ({
    nombre: formatName(item.name)
  }))

  const itResult = await prisma.objeto.createMany({
    data: objetosArray,
    skipDuplicates: true,
  })
  console.log(`¡${itResult.count} Objetos guardados en Supabase!`)

  // ---------------------------------------------------------
  // 4. Crear los Formatos Base
  // ---------------------------------------------------------
  console.log('Creando Formatos de Smogon/VGC...')
  const formatosArray = [
    { nombre: 'VGC Gen 9', reglas: 'Dobles 4v4. Legendarios restringidos.' },
    { nombre: 'Singles OU', reglas: 'Singles 6v6. OverUsed tier standard.' },
    { nombre: 'National Dex', reglas: 'Singles 6v6. Megas, Z-Moves permitidos.' },
    { nombre: 'Monotype', reglas: 'Singles 6v6. Todo el equipo comparte un tipo.' }
  ]

  const formResult = await prisma.formato.createMany({
    data: formatosArray,
    skipDuplicates: true,
  })
  console.log(`¡${formResult.count} Formatos creados!`)

  console.log('¡TODOS LOS DATOS COMPETITIVOS ESTÁN LISTOS!')
}

main()
  .catch((e) => {
    console.error('Error crítico en el script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })