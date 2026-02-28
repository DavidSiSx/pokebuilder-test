import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@/lib/supabase/apiAuth';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Rate limiting per user for review
const reviewRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_REVIEWS_PER_HOUR = 10;

function isReviewRateLimited(userId: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  const timestamps = (reviewRateLimitMap.get(userId) || []).filter(t => t > windowStart);
  if (timestamps.length >= MAX_REVIEWS_PER_HOUR) return true;
  timestamps.push(now);
  reviewRateLimitMap.set(userId, timestamps);
  return false;
}

const MODEL_PRIORITY = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash"];

async function generateWithFallback(prompt: string) {
  let lastError = null;
  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(prompt);
    } catch (error: any) {
      lastError = error;
      if (error.status === 429 || error.status === 404) continue;
      throw error;
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  try {
    // Auth protection
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    // Rate limiting
    if (isReviewRateLimited(user!.id)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Maximo 10 reviews por hora. Espera un momento." },
        { status: 429 }
      );
    }

    const { team, format, mechanics } = await request.json();
    if (!API_KEY) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    if (!team || !Array.isArray(team) || team.length === 0 || team.length > 6) {
      return NextResponse.json({ error: "Equipo invalido. Debe tener entre 1 y 6 Pokemon." }, { status: 400 });
    }

    // Build team description for the prompt
    const teamDescription = team.map((p: any, i: number) => {
      return `${i + 1}. ${p.name}
   - Item: ${p.item || 'Ninguno'}
   - Ability: ${p.ability || 'No especificada'}
   - Nature: ${p.nature || 'No especificada'}
   - Tera Type: ${p.teraType || 'No especificado'}
   - Moves: ${(p.moves || []).filter(Boolean).join(', ') || 'No especificados'}
   - EVs: ${p.evs || 'No especificados'}
   - Mechanic: ${p.mechanic || 'Ninguna'}`;
    }).join('\n\n');

    const mechanicsNote = mechanics
      ? `Mecanicas habilitadas: ${Object.entries(mechanics).filter(([_, v]) => v).map(([k]) => k).join(', ')}`
      : '';

    const prompt = `
      Eres un juez competitivo de Pokemon de Nivel Mundial, especialista en ${format || 'VGC Doubles'}.
      ${mechanicsNote}

      EQUIPO A EVALUAR:
      ${teamDescription}

      INSTRUCCIONES:
      Evalua este equipo de forma CRITICA y HONESTA. No seas complaciente.
      Analiza la sinergia entre los miembros, la cobertura de tipos, el speed control, los matchups y la consistencia general.

      DEVUELVE SOLO JSON con este formato exacto:
      {
        "score": 7.5,
        "categories": {
          "sinergia": 8,
          "cobertura": 7,
          "speedControl": 6,
          "matchupSpread": 8,
          "consistencia": 7
        },
        "analysis": "Texto detallado del analisis general...",
        "weakPoints": ["Debilidad 1", "Debilidad 2"],
        "suggestions": ["Sugerencia de mejora 1", "Sugerencia 2"],
        "pokemonRatings": {
          "NombrePokemon": { "score": 8, "comment": "Comentario sobre este Pokemon..." }
        }
      }

      REGLAS:
      - score general: promedio ponderado de las categorias, con 1 decimal
      - Cada categoria va de 1 a 10
      - analysis: 2-3 parrafos separados por \\n\\n
      - weakPoints: 2-4 debilidades principales
      - suggestions: 2-4 sugerencias concretas de mejora
      - pokemonRatings: una entrada por cada Pokemon del equipo con score (1-10) y comentario corto
      - Se HONESTO: un equipo aleatorio deberia tener 3-4 puntos. Un equipo meta solido 7-8. Solo 9+ para equipos optimizados.
    `;

    const result = await generateWithFallback(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON invalido en respuesta de IA");
    const reviewData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(reviewData);

  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "CUOTA_AGOTADA", message: "Cuota de Gemini excedida. Espera un minuto." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Fallo en la evaluacion del equipo." }, { status: 500 });
  }
}
