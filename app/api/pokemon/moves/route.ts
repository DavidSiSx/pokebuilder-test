// app/api/pokemon/moves/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/apiAuth';

export async function GET(request: Request) {
  try {
    // Auth protection
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.toLowerCase();

    if (!name) return NextResponse.json([]);

    // Consultamos la PokéAPI para obtener la legalidad de movimientos en tiempo real
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) return NextResponse.json({ error: "Pokémon no encontrado" }, { status: 404 });

    const data = await res.json();
    
    // Mapeamos los movimientos con sus datos básicos
    const moves = await Promise.all(data.moves.slice(0, 40).map(async (m: any) => {
      const moveRes = await fetch(m.move.url);
      const moveData = await moveRes.json();
      return {
        nombre: m.move.name.replace('-', ' '),
        tipo: moveData.type.name,
        potencia: moveData.power,
        precision: moveData.accuracy,
        categoria: moveData.damage_class.name
      };
    }));

    return NextResponse.json(moves);
  } catch (error) {
    return NextResponse.json({ error: "Fallo al cargar movimientos" }, { status: 500 });
  }
}
