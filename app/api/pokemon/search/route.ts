import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate de tener el Singleton configurado

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // Si no hay búsqueda, devolvemos un array vacío
    if (!name) return NextResponse.json([]);

    const results = await prisma.pokemon.findMany({
      where: {
        OR: [
          { 
            nombre: { 
              contains: name, 
              mode: 'insensitive' // Ignora mayúsculas/minúsculas en PostgreSQL
            } 
          },
          { 
            tipo1: { 
              contains: name, 
              mode: 'insensitive' 
            } 
          },
          { 
            tipo2: { 
              contains: name, 
              mode: 'insensitive' 
            } 
          }
        ]
      },
      include: { 
        AnalisisMeta: true // Incluye la relación con tus análisis de meta
      },
      take: 5 // Limitamos a 5 resultados para que el dropdown no sea gigante
    });

    return NextResponse.json(results);
  } catch (error) {
    // Esto se verá en tu terminal de VS Code para que puedas debugear
    console.error("❌ ERROR EN POKEMON API:", error);

    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error instanceof Error ? error.message : "Error desconocido" 
      }, 
      { status: 500 }
    );
  }
}