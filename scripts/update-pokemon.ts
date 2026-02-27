// scripts/update-pokemon.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePokemonData() {
  console.log("🚀 Iniciando actualización de 1025 Pokémon...");

  // 1. Obtenemos todos los pokémon que no tienen sprite aún
  const pokemones = await prisma.pokemon.findMany({
    where: { sprite_url: null }
  });

  for (const pokemon of pokemones) {
    try {
      // Limpiamos el nombre para la API (minúsculas y sin espacios)
      const searchName = pokemon.nombre.toLowerCase().replace(" ", "-");
      
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchName}`);
      
      if (!response.ok) {
        console.warn(`⚠️ No se encontró a ${pokemon.nombre} en la PokéAPI`);
        continue;
      }

      const data = await response.json();

      // 2. Extraemos los datos necesarios
      const spriteUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
      
      // Guardamos las stats como un objeto JSON
      const statsJson = {
        hp: data.stats[0].base_stat,
        atk: data.stats[1].base_stat,
        def: data.stats[2].base_stat,
        spa: data.stats[3].base_stat,
        spd: data.stats[4].base_stat,
        spe: data.stats[5].base_stat,
      };

      // 3. Actualizamos en la base de datos
      await prisma.pokemon.update({
        where: { id: pokemon.id },
        data: {
          sprite_url: spriteUrl,
          stats: statsJson,
          // Aprovechamos para asegurar que las stats base coincidan
          hp_base: data.stats[0].base_stat,
          atk_base: data.stats[1].base_stat,
          def_base: data.stats[2].base_stat,
          spa_base: data.stats[3].base_stat,
          spd_base: data.stats[4].base_stat,
          spe_base: data.stats[5].base_stat,
        }
      });

      console.log(`✅ ${pokemon.nombre} actualizado correctamente.`);
    } catch (error) {
      console.error(`❌ Error procesando a ${pokemon.nombre}:`, error);
    }
  }

  console.log("✨ ¡Proceso terminado!");
  await prisma.$disconnect();
}

updatePokemonData();