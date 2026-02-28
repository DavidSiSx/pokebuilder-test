import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/apiAuth';

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.toLowerCase();

    if (!name) return NextResponse.json({ moves: [], abilities: [] });

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) return NextResponse.json({ error: "Pokémon no encontrado" }, { status: 404 });

    const data = await res.json();

    // ── HABILIDADES ───────────────────────────────────────────────
    const abilities = data.abilities.map((a: any) =>
      a.ability.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    // ── MOVIMIENTOS ───────────────────────────────────────────────
    // ARREGLO: eliminamos el slice(0, 40) que cortaba movimientos signature.
    // En cambio, deduplicamos por nombre primero (la PokeAPI lista el mismo move
    // varias veces cuando se aprende por distintos métodos: nivel, MT, tutor, huevo).
    // Luego obtenemos detalles en lotes paralelos de 20 para no saturar la API.

    const allMoveEntries: any[] = data.moves;

    // Deduplicar por nombre (conservar primera aparición)
    const seenNames = new Set<string>();
    const uniqueMoveEntries = allMoveEntries.filter((m: any) => {
      const n = m.move.name;
      if (seenNames.has(n)) return false;
      seenNames.add(n);
      return true;
    });

    // Fetch de detalles en lotes de 20 (balance entre velocidad y no saturar PokeAPI)
    const BATCH_SIZE = 20;
    const moves: any[] = [];

    for (let i = 0; i < uniqueMoveEntries.length; i += BATCH_SIZE) {
      const batch = uniqueMoveEntries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (m: any) => {
          const formattedName = m.move.name
            .split('-')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          try {
            const moveRes = await fetch(m.move.url);
            if (!moveRes.ok) throw new Error('not ok');
            const moveData = await moveRes.json();

            return {
              nombre: formattedName,
              tipo: moveData.type.name,
              potencia: moveData.power,
              precision: moveData.accuracy,
              categoria: moveData.damage_class.name, // 'physical' | 'special' | 'status'
            };
          } catch {
            // Fallback si falla el fetch individual
            return { nombre: formattedName };
          }
        })
      );
      moves.push(...batchResults);
    }

    // Ordenar: primero físicos y especiales (con potencia) por potencia desc,
    // luego de estado, para que los moves más relevantes aparezcan primero en el picker
    moves.sort((a, b) => {
      if (a.categoria === 'status' && b.categoria !== 'status') return 1;
      if (a.categoria !== 'status' && b.categoria === 'status') return -1;
      return (b.potencia ?? 0) - (a.potencia ?? 0);
    });

    return NextResponse.json({ moves, abilities });

  } catch (error) {
    return NextResponse.json({ error: "Fallo al cargar datos" }, { status: 500 });
  }
}