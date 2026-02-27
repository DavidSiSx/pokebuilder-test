// scripts/check-models.ts
import 'dotenv/config'; // Esto carga automáticamente tu archivo .env

async function checkModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ CRÍTICO: No se encontró la API Key en las variables de entorno.");
    return;
  }

  console.log("🔍 Conectando con Google AI Studio para verificar tus modelos autorizados...\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error de la API de Google:", data.error.message);
      return;
    }

    console.log("✅ MODELOS DISPONIBLES PARA TU CUENTA:\n");
    
    // Filtramos solo los que soportan generación de texto/contenido
    const textModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods?.includes("generateContent")
    );

    textModels.forEach((model: any) => {
      // Limpiamos el prefijo "models/" para que veas el nombre exacto que debes usar
      const exactName = model.name.replace('models/', '');
      console.log(`▶ Nombre exacto para el código: "${exactName}"`);
      console.log(`  Info: ${model.displayName}`);
      console.log("  --------------------------------------------------");
    });

    console.log("\n💡 COPIA EL NOMBRE EXACTO DEL MODELO QUE DIGA '1.5 Flash' O 'Gemini Pro'.");

  } catch (error) {
    console.error("❌ Error de red al intentar conectar:", error);
  }
}

checkModels();