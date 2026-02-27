import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Iniciando actualización táctica...");

  // 1. Actualizar Movimientos con Potencia y Precisión
  const movimientos = await prisma.movimiento.findMany();
  for (const m of movimientos) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${m.nombre.toLowerCase().replace(/\s+/g, '-')}`);
      if (res.ok) {
        const data = await res.json();
        await prisma.movimiento.update({
          where: { id: m.id },
          data: {
            potencia: data.power,
            precision: data.accuracy,
            categoria: data.damage_class.name
          }
        });
        console.log(`✅ Movimiento actualizado: ${m.nombre}`);
      }
    } catch (e) { console.error(`Error en move ${m.nombre}`); }
  }
  
  console.log("✨ Datos tácticos listos.");
}

main().catch(console.error).finally(() => prisma.$disconnect());