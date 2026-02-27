export interface TeamMember {
  id: number;
  nombre: string;
  tipos?: string[]; 
  tipo1?: string;   
  tipo2?: string;
  sprite_url: string;
  suggestedBuild?: any;
}

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { fighting: 2, ghost: 0 },
  fire: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
  water: { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  grass: { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
  ice: { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
  fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
  poison: { ground: 2, psychic: 2, fighting: 0.5, poison: 0.5, bug: 0.5, grass: 0.5, fairy: 0.5 },
  ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  flying: { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
  psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  bug: { fire: 2, flying: 2, rock: 2, fighting: 0.5, ground: 0.5, grass: 0.5 },
  rock: { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
  ghost: { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
  dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, grass: 0.5, electric: 0.5 },
  dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  steel: { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
  fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 }
};

export type DetailedTypeAnalysis = {
  [attackType: string]: { x4: string[]; x2: string[]; x05: string[]; x025: string[]; x0: string[]; score: number }
};

export function analyzeTeamDetailed(team: TeamMember[]): DetailedTypeAnalysis {
  const analysis: DetailedTypeAnalysis = {};
  Object.keys(TYPE_CHART).forEach(t => analysis[t] = { x4: [], x2: [], x05: [], x025: [], x0: [], score: 0 });

  team.forEach(pokemon => {
    if (!pokemon) return; 
    const activeTypes = pokemon.tipos || [pokemon.tipo1, pokemon.tipo2].filter(Boolean);

    Object.keys(TYPE_CHART).forEach(attackType => {
      let multiplier = 1;
      (activeTypes as string[]).forEach(pokeType => {
        if (!pokeType) return;
        const pt = pokeType.toLowerCase();
        if (TYPE_CHART[pt] && TYPE_CHART[pt][attackType] !== undefined) multiplier *= TYPE_CHART[pt][attackType];
      });

      if (multiplier === 4) { analysis[attackType].x4.push(pokemon.nombre); analysis[attackType].score += 2; }
      if (multiplier === 2) { analysis[attackType].x2.push(pokemon.nombre); analysis[attackType].score += 1; }
      if (multiplier === 0.5) { analysis[attackType].x05.push(pokemon.nombre); analysis[attackType].score -= 1; }
      if (multiplier === 0.25) { analysis[attackType].x025.push(pokemon.nombre); analysis[attackType].score -= 2; }
      if (multiplier === 0) { analysis[attackType].x0.push(pokemon.nombre); analysis[attackType].score -= 5; }
    });
  });

  return analysis;
}