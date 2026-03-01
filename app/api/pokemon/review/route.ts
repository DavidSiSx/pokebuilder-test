import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@/lib/supabase/apiAuth';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const reviewRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3600000;
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

const ELITE_COMPETITIVE_RULES = `
  CRITERIOS DE PENALIZACIÓN SEVERA (RESTA PUNTOS SI EL USUARIO FALLA AQUÍ):
  - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band/Specs/Scarf" o "Assault Vest", SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO. Si tienen Protect o Danza Espada con estos objetos, asume que el usuario es novato y penalízalo.
  - EVIOLITE (MINERAL EVOLUTIVO): Pre-evoluciones viables (ej. Porygon2, Dusclops, Clefairy) sin Eviolite son un error táctico crítico.
  - OBJETOS EXCLUSIVOS: Si usan Pikachu sin Light Ball, o Marowak sin Thick Club, es un fallo garrafal.
  - SINERGIAS DE CLIMA/TERRENO: Si hay un Pokémon con Drizzle/Drought pero no hay abusadores (Swift Swim/Chlorophyll), el clima está desperdiciado.
  - CONTROL DE VELOCIDAD: Equipos sin Tailwind, Trick Room, Icy Wind o usuarios veloces (Scarf) son presa fácil en el meta moderno.
`;

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

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
      Eres el Juez Principal y Head Coach de un campeonato mundial de Pokémon.
      FORMATO: ${format || 'VGC Doubles'}
      ${mechanicsNote}

      EQUIPO PROPUESTO:
      ${teamDescription}

      ${ELITE_COMPETITIVE_RULES}

      DEVUELVE SOLO JSON con este formato exacto (TODAS LAS PUNTUACIONES SON SOBRE 100, no sobre 10):
      {
        "score": 74,
        "grade": "B+",
        "categories": {
          "sinergia":      { "score": 80, "label": "Sinergia de Equipo",   "desc": "Frase corta evaluando la sinergia" },
          "cobertura":     { "score": 70, "label": "Cobertura Ofensiva",   "desc": "Frase corta sobre cobertura de tipos" },
          "speedControl":  { "score": 60, "label": "Control de Velocidad", "desc": "Tailwind/Trick Room/Scarf presentes o no" },
          "matchupSpread": { "score": 75, "label": "Spread de Matchups",   "desc": "Qué tan bien responde a meta amenazas" },
          "itemsOptim":    { "score": 85, "label": "Optimización Items",   "desc": "Objetos matemáticamente correctos o no" },
          "consistencia":  { "score": 65, "label": "Consistencia",         "desc": "Qué tan fiable es el plan de juego" },
          "originalidad":  { "score": 55, "label": "Factor Sorpresa",      "desc": "Qué tan predecible es el equipo en el meta" }
        },
        "analysis": "2-3 párrafos con \\n\\n sobre las Win Conditions del equipo y su viabilidad en el meta actual.",
        "weakPoints": ["Debilidad crítica 1", "Debilidad 2", "Debilidad 3"],
        "suggestions": ["Sugerencia concreta 1", "Sugerencia 2", "Sugerencia 3"],
        "pokemonRatings": {
          "NombrePokemon": { "score": 82, "comment": "Comentario agresivo pero útil sobre la build de este Pokémon..." }
        },
        "metaVerdict": "Una frase corta y contundente sobre el potencial del equipo en torneos. Ej: 'Viable en regionales, frágil contra rain.' Máx 15 palabras."
      }

      REGLAS:
      - score general: promedio ponderado de las 7 categorías, número entero.
      - grade: A+ A A- B+ B B- C+ C D F según el score (90+ = A+, 85+ = A, 80+ = A-, 75+ = B+, 70+ = B, 65+ = B-, 60+ = C+, 55+ = C, 45+ = D, <45 = F).
      - Cada categoría: score entero 0-100.
      - Sé HONESTO: Un equipo sin Protect en ningún Pokémon en Doubles debe tener speedControl < 40. Solo da 85+ si cumple con sinergias avanzadas.
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