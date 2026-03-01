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

// ─── BLOQUE DE REGLAS COMPETITIVAS ÉLITE PARA EL JUEZ ───────────
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
      Eres el Juez Principal y Head Coach de un campeonato mundial de Pokémon.
      Tu trabajo es evaluar y DESTROZAR CONSTRUCTIVAMENTE el equipo propuesto por un jugador.
      FORMATO A EVALUAR: ${format || 'VGC Doubles'}
      ${mechanicsNote}

      EQUIPO PROPUESTO:
      ${teamDescription}

      INSTRUCCIONES DE EVALUACIÓN NIVEL ÉLITE:
      Evalúa este equipo con la máxima rigurosidad táctica. No seas complaciente.
      Analiza la sinergia (Cores FWG/FDS), el speed control, los matchups (¿quién los frena en seco?) y la optimización de los EVs/Items.
      
      ${ELITE_COMPETITIVE_RULES}

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
        "analysis": "Texto detallado del analisis general usando jerga VGC/Smogon...",
        "weakPoints": ["Debilidad crítica 1 (Ej. Extremadamente vulnerable a prioridad de Sucker Punch)", "Debilidad 2"],
        "suggestions": ["Sugerencia concreta 1 (Ej. Cambiar Leftovers por Eviolite en Dusclops)", "Sugerencia 2"],
        "pokemonRatings": {
          "NombrePokemon": { "score": 8, "comment": "Comentario agresivo pero útil sobre la build de este Pokémon..." }
        }
      }

      REGLAS DE FORMATO:
      - score general: promedio ponderado de las categorias, con 1 decimal (Escala 1 a 10).
      - Cada categoria va de 1 a 10.
      - analysis: 2-3 parrafos separados por \\n\\n detallando las "Win Conditions" del equipo.
      - weakPoints: 2-4 debilidades tácticas principales.
      - suggestions: 2-4 sugerencias directas de cambios de objetos, moves o Pokémon.
      - pokemonRatings: una entrada por cada Pokemon del equipo con score (1-10) y comentario corto.
      - SÉ HONESTO: Un equipo de 6 sweepers sin Protect/Hazards debe tener 3 puntos. Solo dale 9+ si cumple con sinergias avanzadas, control de velocidad y objetos matemáticamente correctos.
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