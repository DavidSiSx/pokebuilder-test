// Dictionary of regional variant Pokemon with their PokeAPI IDs
// Used for searching and suggesting regional forms

export interface RegionalVariant {
  name: string;
  region: 'alola' | 'galar' | 'hisui' | 'paldea';
  pokeapiId: number;
  types: [string, string?];
}

export const REGIONAL_VARIANTS: Record<string, RegionalVariant[]> = {
  // Alolan Forms
  rattata: [{ name: "Rattata-Alola", region: "alola", pokeapiId: 10091, types: ["dark", "normal"] }],
  raticate: [{ name: "Raticate-Alola", region: "alola", pokeapiId: 10092, types: ["dark", "normal"] }],
  raichu: [{ name: "Raichu-Alola", region: "alola", pokeapiId: 10100, types: ["electric", "psychic"] }],
  sandshrew: [{ name: "Sandshrew-Alola", region: "alola", pokeapiId: 10101, types: ["ice", "steel"] }],
  sandslash: [{ name: "Sandslash-Alola", region: "alola", pokeapiId: 10102, types: ["ice", "steel"] }],
  vulpix: [{ name: "Vulpix-Alola", region: "alola", pokeapiId: 10103, types: ["ice"] }],
  ninetales: [{ name: "Ninetales-Alola", region: "alola", pokeapiId: 10104, types: ["ice", "fairy"] }],
  diglett: [{ name: "Diglett-Alola", region: "alola", pokeapiId: 10105, types: ["ground", "steel"] }],
  dugtrio: [{ name: "Dugtrio-Alola", region: "alola", pokeapiId: 10106, types: ["ground", "steel"] }],
  meowth: [
    { name: "Meowth-Alola", region: "alola", pokeapiId: 10107, types: ["dark"] },
    { name: "Meowth-Galar", region: "galar", pokeapiId: 10161, types: ["steel"] },
  ],
  persian: [{ name: "Persian-Alola", region: "alola", pokeapiId: 10108, types: ["dark"] }],
  geodude: [{ name: "Geodude-Alola", region: "alola", pokeapiId: 10109, types: ["rock", "electric"] }],
  graveler: [{ name: "Graveler-Alola", region: "alola", pokeapiId: 10110, types: ["rock", "electric"] }],
  golem: [{ name: "Golem-Alola", region: "alola", pokeapiId: 10111, types: ["rock", "electric"] }],
  grimer: [{ name: "Grimer-Alola", region: "alola", pokeapiId: 10112, types: ["poison", "dark"] }],
  muk: [{ name: "Muk-Alola", region: "alola", pokeapiId: 10113, types: ["poison", "dark"] }],
  exeggutor: [{ name: "Exeggutor-Alola", region: "alola", pokeapiId: 10114, types: ["grass", "dragon"] }],
  marowak: [{ name: "Marowak-Alola", region: "alola", pokeapiId: 10115, types: ["fire", "ghost"] }],

  // Galarian Forms
  ponyta: [{ name: "Ponyta-Galar", region: "galar", pokeapiId: 10162, types: ["psychic"] }],
  rapidash: [{ name: "Rapidash-Galar", region: "galar", pokeapiId: 10163, types: ["psychic", "fairy"] }],
  slowpoke: [{ name: "Slowpoke-Galar", region: "galar", pokeapiId: 10164, types: ["psychic"] }],
  slowbro: [{ name: "Slowbro-Galar", region: "galar", pokeapiId: 10165, types: ["poison", "psychic"] }],
  slowking: [{ name: "Slowking-Galar", region: "galar", pokeapiId: 10172, types: ["poison", "psychic"] }],
  farfetchd: [{ name: "Farfetch'd-Galar", region: "galar", pokeapiId: 10166, types: ["fighting"] }],
  weezing: [{ name: "Weezing-Galar", region: "galar", pokeapiId: 10167, types: ["poison", "fairy"] }],
  "mr. mime": [{ name: "Mr. Mime-Galar", region: "galar", pokeapiId: 10168, types: ["ice", "psychic"] }],
  corsola: [{ name: "Corsola-Galar", region: "galar", pokeapiId: 10170, types: ["ghost"] }],
  zigzagoon: [{ name: "Zigzagoon-Galar", region: "galar", pokeapiId: 10171, types: ["dark", "normal"] }],
  linoone: [{ name: "Linoone-Galar", region: "galar", pokeapiId: 10173, types: ["dark", "normal"] }],
  darumaka: [{ name: "Darumaka-Galar", region: "galar", pokeapiId: 10174, types: ["ice"] }],
  darmanitan: [{ name: "Darmanitan-Galar", region: "galar", pokeapiId: 10175, types: ["ice"] }],
  yamask: [{ name: "Yamask-Galar", region: "galar", pokeapiId: 10176, types: ["ground", "ghost"] }],
  stunfisk: [{ name: "Stunfisk-Galar", region: "galar", pokeapiId: 10177, types: ["ground", "steel"] }],
  articuno: [{ name: "Articuno-Galar", region: "galar", pokeapiId: 10169, types: ["psychic", "flying"] }],
  zapdos: [{ name: "Zapdos-Galar", region: "galar", pokeapiId: 10178, types: ["fighting", "flying"] }],
  moltres: [{ name: "Moltres-Galar", region: "galar", pokeapiId: 10179, types: ["dark", "flying"] }],

  // Hisuian Forms
  growlithe: [{ name: "Growlithe-Hisui", region: "hisui", pokeapiId: 10229, types: ["fire", "rock"] }],
  arcanine: [{ name: "Arcanine-Hisui", region: "hisui", pokeapiId: 10230, types: ["fire", "rock"] }],
  voltorb: [{ name: "Voltorb-Hisui", region: "hisui", pokeapiId: 10231, types: ["electric", "grass"] }],
  electrode: [{ name: "Electrode-Hisui", region: "hisui", pokeapiId: 10232, types: ["electric", "grass"] }],
  typhlosion: [{ name: "Typhlosion-Hisui", region: "hisui", pokeapiId: 10233, types: ["fire", "ghost"] }],
  qwilfish: [{ name: "Qwilfish-Hisui", region: "hisui", pokeapiId: 10234, types: ["dark", "poison"] }],
  sneasel: [{ name: "Sneasel-Hisui", region: "hisui", pokeapiId: 10235, types: ["fighting", "poison"] }],
  samurott: [{ name: "Samurott-Hisui", region: "hisui", pokeapiId: 10236, types: ["water", "dark"] }],
  lilligant: [{ name: "Lilligant-Hisui", region: "hisui", pokeapiId: 10237, types: ["grass", "fighting"] }],
  zorua: [{ name: "Zorua-Hisui", region: "hisui", pokeapiId: 10238, types: ["normal", "ghost"] }],
  zoroark: [{ name: "Zoroark-Hisui", region: "hisui", pokeapiId: 10239, types: ["normal", "ghost"] }],
  braviary: [{ name: "Braviary-Hisui", region: "hisui", pokeapiId: 10240, types: ["psychic", "flying"] }],
  sliggoo: [{ name: "Sliggoo-Hisui", region: "hisui", pokeapiId: 10241, types: ["steel", "dragon"] }],
  goodra: [{ name: "Goodra-Hisui", region: "hisui", pokeapiId: 10242, types: ["steel", "dragon"] }],
  avalugg: [{ name: "Avalugg-Hisui", region: "hisui", pokeapiId: 10243, types: ["ice", "rock"] }],
  decidueye: [{ name: "Decidueye-Hisui", region: "hisui", pokeapiId: 10244, types: ["grass", "fighting"] }],

  // Paldean Forms
  tauros: [
    { name: "Tauros-Paldea-Combat", region: "paldea", pokeapiId: 10250, types: ["fighting"] },
    { name: "Tauros-Paldea-Blaze", region: "paldea", pokeapiId: 10251, types: ["fighting", "fire"] },
    { name: "Tauros-Paldea-Aqua", region: "paldea", pokeapiId: 10252, types: ["fighting", "water"] },
  ],
  wooper: [{ name: "Wooper-Paldea", region: "paldea", pokeapiId: 10253, types: ["poison", "ground"] }],
};

/**
 * Given a search term, returns any matching regional variants
 * filtered by which regions are enabled in config.
 */
export function getRegionalVariants(
  searchTerm: string,
  config: { includeAlola?: boolean; includeGalar?: boolean; includeHisui?: boolean; includePaldea?: boolean }
): RegionalVariant[] {
  const term = searchTerm.toLowerCase().trim();
  const results: RegionalVariant[] = [];

  for (const [baseName, variants] of Object.entries(REGIONAL_VARIANTS)) {
    // Match if the search term is contained in the base name or variant name
    if (baseName.includes(term) || variants.some(v => v.name.toLowerCase().includes(term))) {
      for (const variant of variants) {
        const include =
          (variant.region === 'alola' && config.includeAlola !== false) ||
          (variant.region === 'galar' && config.includeGalar !== false) ||
          (variant.region === 'hisui' && config.includeHisui !== false) ||
          (variant.region === 'paldea' && config.includePaldea !== false);
        if (include) results.push(variant);
      }
    }
  }

  return results;
}

// Mega Evolutions dictionary (for reference in prompts)
export const MEGA_POKEMON: Record<string, string[]> = {
  venusaur: ["Venusaur-Mega"],
  charizard: ["Charizard-Mega-X", "Charizard-Mega-Y"],
  blastoise: ["Blastoise-Mega"],
  alakazam: ["Alakazam-Mega"],
  gengar: ["Gengar-Mega"],
  kangaskhan: ["Kangaskhan-Mega"],
  pinsir: ["Pinsir-Mega"],
  gyarados: ["Gyarados-Mega"],
  aerodactyl: ["Aerodactyl-Mega"],
  mewtwo: ["Mewtwo-Mega-X", "Mewtwo-Mega-Y"],
  ampharos: ["Ampharos-Mega"],
  scizor: ["Scizor-Mega"],
  heracross: ["Heracross-Mega"],
  houndoom: ["Houndoom-Mega"],
  tyranitar: ["Tyranitar-Mega"],
  blaziken: ["Blaziken-Mega"],
  gardevoir: ["Gardevoir-Mega"],
  mawile: ["Mawile-Mega"],
  aggron: ["Aggron-Mega"],
  medicham: ["Medicham-Mega"],
  manectric: ["Manectric-Mega"],
  banette: ["Banette-Mega"],
  absol: ["Absol-Mega"],
  garchomp: ["Garchomp-Mega"],
  lucario: ["Lucario-Mega"],
  abomasnow: ["Abomasnow-Mega"],
  gallade: ["Gallade-Mega"],
  audino: ["Audino-Mega"],
  diancie: ["Diancie-Mega"],
  lopunny: ["Lopunny-Mega"],
  salamence: ["Salamence-Mega"],
  metagross: ["Metagross-Mega"],
  latias: ["Latias-Mega"],
  latios: ["Latios-Mega"],
  rayquaza: ["Rayquaza-Mega"],
  swampert: ["Swampert-Mega"],
  sceptile: ["Sceptile-Mega"],
  sableye: ["Sableye-Mega"],
  sharpedo: ["Sharpedo-Mega"],
  camerupt: ["Camerupt-Mega"],
  altaria: ["Altaria-Mega"],
  glalie: ["Glalie-Mega"],
  pidgeot: ["Pidgeot-Mega"],
  slowbro: ["Slowbro-Mega"],
  steelix: ["Steelix-Mega"],
  beedrill: ["Beedrill-Mega"],
};

// Gigantamax Pokemon list
export const GMAX_POKEMON = [
  "Charizard", "Butterfree", "Pikachu", "Meowth", "Machamp", "Gengar",
  "Kingler", "Lapras", "Eevee", "Snorlax", "Garbodor", "Melmetal",
  "Corviknight", "Orbeetle", "Drednaw", "Coalossal", "Flapple", "Appletun",
  "Sandaconda", "Toxtricity", "Centiskorch", "Hatterene", "Grimmsnarl",
  "Alcremie", "Copperajah", "Duraludon", "Urshifu", "Venusaur", "Blastoise",
  "Rillaboom", "Cinderace", "Inteleon",
];
