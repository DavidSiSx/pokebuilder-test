export const TYPE_COLORS: Record<string, string> = {
  normal: "bg-stone-500 text-white", fire: "bg-red-500 text-white", water: "bg-blue-500 text-white",
  grass: "bg-green-500 text-white", electric: "bg-yellow-400 text-black font-black",
  ice: "bg-cyan-300 text-black font-black", fighting: "bg-orange-600 text-white",
  poison: "bg-purple-500 text-white", ground: "bg-yellow-600 text-white",
  flying: "bg-indigo-300 text-black font-black", psychic: "bg-pink-500 text-white",
  bug: "bg-lime-500 text-black font-black", rock: "bg-yellow-700 text-white",
  ghost: "bg-indigo-700 text-white", dragon: "bg-indigo-500 text-white",
  dark: "bg-gray-800 text-white", steel: "bg-slate-500 text-white", fairy: "bg-pink-300 text-black font-black"
};

export const TYPE_TRANSLATIONS: Record<string, string> = {
  normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta", electric: "Eléctrico",
  ice: "Hielo", fighting: "Lucha", poison: "Veneno", ground: "Tierra", flying: "Volador",
  psychic: "Psíquico", bug: "Bicho", rock: "Roca", ghost: "Fantasma", dragon: "Dragón",
  dark: "Siniestro", steel: "Acero", fairy: "Hada"
};

export const NATURES: Record<string, string> = {
  Adamant: "+Atk, -SpA", Bold: "+Def, -Atk", Brave: "+Atk, -Spe", Calm: "+SpD, -Atk", Careful: "+SpD, -SpA",
  Gentle: "+SpD, -Def", Hasty: "+Spe, -Def", Impish: "+Def, -SpA", Jolly: "+Spe, -SpA", Lax: "+Def, -SpD",
  Lonely: "+Atk, -Def", Mild: "+SpA, -Def", Modest: "+SpA, -Atk", Naive: "+Spe, -SpD", Naughty: "+Atk, -SpD",
  Quiet: "+SpA, -Spe", Rash: "+SpA, -SpD", Relaxed: "+Def, -Spe", Sassy: "+SpD, -Spe", Timid: "+Spe, -Atk",
  Hardy: "Neutral", Docile: "Neutral", Serious: "Neutral", Bashful: "Neutral", Quirky: "Neutral"
};

export const TERA_TYPES = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy', 'Stellar'
];
export const COMPETITIVE_ITEMS: Record<string, string> = {
  // Objetos Core (Top Tier)
  "Leftovers": "Restaura 1/16 de los PS máximos del portador al final de cada turno.",
  "Life Orb": "Aumenta el daño de los ataques un 30%, pero pierde 10% de PS máximos en cada ataque.",
  "Choice Band": "Aumenta el Ataque físico un 50%, pero encierra en el primer movimiento.",
  "Choice Specs": "Aumenta el Ataque Especial un 50%, pero encierra en el primer movimiento.",
  "Choice Scarf": "Aumenta la Velocidad un 50%, pero encierra en el primer movimiento.",
  "Focus Sash": "Si tiene PS al máximo, sobrevive con 1 PS a un ataque letal.",
  "Assault Vest": "Aumenta la Def. Esp. un 50%, pero impide usar movimientos de estado.",
  "Heavy-Duty Boots": "Inmunidad a los peligros de entrada (Trampa Rocas, Púas, etc.).",
  "Rocky Helmet": "Si recibe un ataque de contacto, el atacante pierde 1/6 de sus PS máximos.",
  "Eviolite": "Aumenta la Defensa y Def. Esp. un 50% si aún puede evolucionar.",
  "Covert Cloak": "Inmunidad a los efectos secundarios de los ataques (ej. retrocesos, bajadas de stats).",
  "Clear Amulet": "Inmunidad a las bajadas de estadísticas causadas por el rival.",
  "Booster Energy": "Activa Paleosíntesis o Carga Cuark aumentando la estadística más alta.",
  
  // Objetos de Clima / Terreno
  "Damp Rock": "Extiende la duración de Danza Lluvia de 5 a 8 turnos.",
  "Heat Rock": "Extiende la duración de Día Soleado de 5 a 8 turnos.",
  "Smooth Rock": "Extiende la duración de Tormenta Arena de 5 a 8 turnos.",
  "Icy Rock": "Extiende la duración de Paisaje Nevado/Granizo de 5 a 8 turnos.",
  "Terrain Extender": "Extiende la duración de los Terrenos de 5 a 8 turnos.",
  "Electric Seed": "Sube la Defensa un nivel en Campo Eléctrico. Un uso.",
  "Grassy Seed": "Sube la Defensa un nivel en Campo Herbal. Un uso.",
  "Psychic Seed": "Sube la Def. Esp. un nivel en Campo Psíquico. Un uso.",
  "Misty Seed": "Sube la Def. Esp. un nivel en Campo Brumoso. Un uso.",

  // Orbes y Objetos de Estado
  "Toxic Orb": "Envenena gravemente al portador (Útil con Agallas o Antídoto).",
  "Flame Orb": "Quema al portador (Útil con Agallas o Ímpetu Ardiente).",
  "Light Clay": "Extiende Reflejo, Pantalla de Luz y Velo Aurora a 8 turnos.",
  "Black Sludge": "Restaura 1/16 de PS si es Veneno; daña 1/8 si no lo es.",
  "Sticky Barb": "El atacante que haga contacto pierde 1/8 de PS cada turno.",

  // Hierbas
  "White Herb": "Restaura stats reducidos a su estado original. Un uso.",
  "Mental Herb": "Cura Mofa, Otra Vez, Tormento, etc. Un uso.",
  "Power Herb": "Permite usar ataques de carga (Ataque Aéreo, Rayo Solar) en 1 turno. Un uso.",
  "Mirror Herb": "Copia los aumentos de stats del rival. Un uso.",

  // Objetos Tácticos Ofensivos/Defensivos
  "Air Balloon": "Inmune a tipo Tierra hasta recibir un golpe directo.",
  "Expert Belt": "Aumenta un 20% el daño de ataques Súper Efectivos.",
  "Weakness Policy": "Si recibe un ataque Súper Efectivo, Ataque y Atq. Esp suben 2 niveles.",
  "Blunder Policy": "Si un ataque falla por precisión, la Velocidad sube 2 niveles.",
  "Throat Spray": "Sube el Atq. Esp 1 nivel tras usar un movimiento de sonido.",
  "Safety Goggles": "Inmunidad a daño de arena/nieve y movimientos de polvo/esporas.",
  "Protective Pads": "Inmunidad a efectos que se activan al hacer contacto (ej. Piel Tosca).",
  "Shed Shell": "Inmunidad a efectos que impiden el cambio (ej. Sombra Trampa).",
  "Red Card": "Si el portador es golpeado, fuerza el cambio del rival.",
  "Eject Button": "Permite al portador escapar de trampas de cambio.",
  "Eject Pack": "Si el portador es golpeado, se retira automáticamente.",
  "Room Service": "Sube la Velocidad 1 nivel si se activa Espacio Raro.",

  // Bayas Competitivas
  "Sitrus Berry": "Restaura el 25% de PS cuando baja de la mitad (50%).",
  "Lum Berry": "Cura cualquier problema de estado o confusión. Un uso.",
  "Chesto Berry": "Cura el sueño (Útil con Descanso). Un uso.",
  "Pecha Berry": "Cura el veneno. Un uso.",
  "Figy Berry": "Restaura 33% de PS si baja del 25% (Confunde si no le gusta el sabor picante).",
  "Iapapa Berry": "Restaura 33% de PS si baja del 25% (Confunde si no le gusta el sabor ácido).",
  "Wiki Berry": "Restaura 33% de PS si baja del 25% (Confunde si no le gusta el sabor seco).",
  "Aguav Berry": "Restaura 33% de PS si baja del 25% (Confunde si no le gusta el sabor amargo).",
  "Mago Berry": "Restaura 33% de PS si baja del 25% (Confunde si no le gusta el sabor dulce).",
  "Salac Berry": "Sube la Velocidad 1 nivel cuando los PS bajan del 25%.",
  "Liechi Berry": "Sube el Ataque 1 nivel cuando los PS bajan del 25%.",
  "Petaya Berry": "Sube el Atq. Esp 1 nivel cuando los PS bajan del 25%.",
  "Apicot Berry": "Sube la Def. Esp 1 nivel cuando los PS bajan del 25%.",
  "Ganlon Berry": "Sube la Defensa 1 nivel cuando los PS bajan del 25%.",
  "Kee Berry": "Sube la Defensa 1 nivel al recibir un ataque físico.",
  "Maranga Berry": "Sube la Def. Esp 1 nivel al recibir un ataque especial.",
  "Colbur Berry": "Sube la Defensa 1 nivel al recibir un ataque físico (Un uso).",

  // Bayas de reducción de daño (Súper Efectivos)
  "Occa Berry": "Reduce a la mitad el daño de un ataque Fuego Súper Efectivo.",
  "Passho Berry": "Reduce a la mitad el daño de un ataque Agua Súper Efectivo.",
  "Wacan Berry": "Reduce a la mitad el daño de un ataque Eléctrico Súper Efectivo.",
  "Rindo Berry": "Reduce a la mitad el daño de un ataque Planta Súper Efectivo.",
  "Yache Berry": "Reduce a la mitad el daño de un ataque Hielo Súper Efectivo.",
  "Chople Berry": "Reduce a la mitad el daño de un ataque Lucha Súper Efectivo.",
  "Kebia Berry": "Reduce a la mitad el daño de un ataque Veneno Súper Efectivo.",
  "Shuca Berry": "Reduce a la mitad el daño de un ataque Tierra Súper Efectivo.",
  "Coba Berry": "Reduce a la mitad el daño de un ataque Volador Súper Efectivo.",
  "Payapa Berry": "Reduce a la mitad el daño de un ataque Psíquico Súper Efectivo.",
  "Tanga Berry": "Reduce a la mitad el daño de un ataque Bicho Súper Efectivo.",
  "Charti Berry": "Reduce a la mitad el daño de un ataque Roca Súper Efectivo.",
  "Kasib Berry": "Reduce a la mitad el daño de un ataque Fantasma Súper Efectivo.",
  "Haban Berry": "Reduce a la mitad el daño de un ataque Dragón Súper Efectivo.",
  "Colbur Berry ": "Reduce a la mitad el daño de un ataque Siniestro Súper Efectivo.", // Note: space added to avoid duplicate key error if merged with above, adjust as needed.
  "Babiri Berry": "Reduce a la mitad el daño de un ataque Acero Súper Efectivo.",
  "Roseli Berry": "Sube la Def. Esp al recibir un ataque especial.",
  "Chilan Berry": "Reduce a la mitad el daño de un ataque Normal.",

  // Objetos Específicos Clásicos
  "Light Ball": "Duplica el Ataque y Atq. Esp si el portador es Pikachu.",
  "Thick Club": "Duplica el Ataque si el portador es Cubone o Marowak.",
  "Eviolite ": "Aumenta las defensas de Pokémon no evolucionados." // Note: space added to avoid duplicate key error
};
export const COMMON_ABILITIES = [
  "Intimidate", "Levitate", "Regenerator", "Prankster", "Protean", "Libero",
  "Huge Power", "Speed Boost", "Unaware", "Magic Guard", "Mold Breaker",
  "Guts", "Rough Skin", "Static", "Flame Body", "Water Absorb", "Flash Fire",
  "Beast Boost", "Protosynthesis", "Quark Drive", "Good as Gold", "Purifying Salt",
  "Sword of Ruin", "Orichalcum Engine", "Hadron Engine", "Supreme Overlord"
].sort();