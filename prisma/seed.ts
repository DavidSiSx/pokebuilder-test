import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando el seeding de la base de datos...')

  // 1. Crear Formato
  const formatoVGC = await prisma.formato.upsert({
    where: { nombre: 'VGC Gen 9' },
    update: {},
    create: { nombre: 'VGC Gen 9', reglas: 'Dobles, trae 6 elige 4' },
  })

  // 2. Crear Objeto y Habilidad
  const focusSash = await prisma.objeto.upsert({
    where: { nombre: 'Focus Sash' },
    update: {},
    create: { nombre: 'Focus Sash' },
  })

  const drizzle = await prisma.habilidad.upsert({
    where: { nombre: 'Drizzle' },
    update: {},
    create: { nombre: 'Drizzle' },
  })

  // 3. Crear Pokémon
  const pelipper = await prisma.pokemon.upsert({
    where: { nombre: 'Pelipper' },
    update: {},
    create: {
      nombre: 'Pelipper',
      tipo1: 'Water',
      tipo2: 'Flying',
      hp_base: 60,
      atk_base: 50,
      def_base: 100,
      spa_base: 95,
      spd_base: 70,
      spe_base: 65,
    },
  })

  // 4. Crear Movimientos
  const movimientosDatos = [
    { nombre: 'Hurricane', tipo: 'Flying', categoria: 'Special' },
    { nombre: 'Tailwind', tipo: 'Flying', categoria: 'Status' },
    { nombre: 'Weather Ball', tipo: 'Normal', categoria: 'Special' },
    { nombre: 'Protect', tipo: 'Normal', categoria: 'Status' },
  ]

  const movimientosDb = []
  for (const mov of movimientosDatos) {
    const m = await prisma.movimiento.upsert({
      where: { nombre: mov.nombre },
      update: {},
      create: mov,
    })
    movimientosDb.push(m)
  }

  // 5. Unir todo en la Build Competitiva
  const buildPelipper = await prisma.buildCompetitiva.create({
    data: {
      pokemonId: pelipper.id,
      formatoId: formatoVGC.id,
      objetoId: focusSash.id,
      habilidadId: drizzle.id,
      rol: 'Tailwind Setter / Rain Invocator',
      naturaleza: 'Modest',
      ev_hp: 4,
      ev_spa: 252,
      ev_spe: 252,
      movimientos: {
        create: [
          { movimientoId: movimientosDb[0].id, slot: 1 }, // Hurricane
          { movimientoId: movimientosDb[1].id, slot: 2 }, // Tailwind
          { movimientoId: movimientosDb[2].id, slot: 3 }, // Weather Ball
          { movimientoId: movimientosDb[3].id, slot: 4 }, // Protect
        ],
      },
    },
  })

  console.log('¡Seeding completado con éxito! Build de Pelipper creada:', buildPelipper.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })