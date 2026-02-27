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