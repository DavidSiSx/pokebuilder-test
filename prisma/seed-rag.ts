import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from "@google/generative-ai"
import 'dotenv/config'

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Throttling: Pausa de 1.5 segundos para evitar el Rate Limit de la Free Tier
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log("🚀 Iniciando Carga Maestra: Procesando 1000+ Pokémon...");

  // Formatos clave para Cobblemon y Showdown (usando archivos -0 para info completa)
  const formats = [
    'gen9nationaldex-0.json', // El más importante para Cobblemon
    'gen9vgc2026regi-0.json', // Meta de dobles actual
    'gen9ou-0.json'           // Singles estándar
  ];

  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const baseUrl = 'https://www.smogon.com/stats/2026-01/chaos/';

  for (const formatFile of formats) {
    console.log(`\n-----------------------------------------`);
    console.log(`📂 Descargando datos de: ${formatFile}`);
    
    try {
      const res = await fetch(`${baseUrl}${formatFile}`);
      if (!res.ok) throw new Error(`Fallo al descargar: ${res.status}`);

      const statsData = await res.json();
      const pokemonStats = statsData.data;
      const formatName = formatFile.split('-')[0];

      const entries = Object.entries(pokemonStats);
      console.log(`✅ ${entries.length} Pokémon encontrados. Iniciando inyección semántica...`);

      for (const [name, stats] of entries) {
        // Buscamos el Pokémon en tu tabla base (PokeAPI)
        const pokeInDb = await prisma.pokemon.findFirst({ 
          where: { nombre: name.toLowerCase() } 
        });

        if (pokeInDb) {
          // Construimos el perfil con ítems, movimientos y compañeros
          const items = Object.keys((stats as any).Items || {}).slice(0, 3).join(", ") || "Cualquiera";
          const moves = Object.keys((stats as any).Moves || {}).slice(0, 4).join(", ") || "Varios";
          const teammates = Object.keys((stats as any).Teammates || {}).slice(0, 3).join(", ") || "Cualquiera";

          const profile = `Pokemon: ${name}. Formato: ${formatName}. Items: ${items}. Movimientos: ${moves}. Sinergia: ${teammates}.`;

          try {
            // Generamos el vector de 3072 dimensiones
            const result = await model.embedContent(profile);
            const embedding = result.embedding.values;

            // Inserción masiva con manejo de conflictos
            await prisma.$executeRawUnsafe(
              `INSERT INTO "AnalisisMeta" (pokemon_id, formato_nombre, perfil_estrategico, embedding) 
               VALUES ($1, $2, $3, $4::vector)
               ON CONFLICT DO NOTHING`,
              pokeInDb.id, formatName, profile, `[${embedding.join(",")}]`
            );
            
            console.log(`✅ [${formatName}] ${name} procesado.`);
            await delay(1500); // Evita que la API de Google nos bloquee

          } catch (err) {
            console.error(`⚠️ Error en ${name}:`, err.message);
            if (err.message.includes("429")) {
                console.log("⏸️ Rate limit detectado. Pausando 20 segundos...");
                await delay(20000);
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error fatal en ${formatFile}:`, error.message);
    }
  }
}

main()
  .catch((e) => console.error("💀 Error en el proceso:", e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("\n✨ Base de datos inteligente completada con éxito.");
  });