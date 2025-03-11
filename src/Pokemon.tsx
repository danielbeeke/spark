import type { Pokemon } from "./spark-generated";
import { useSpark } from "./spark.js";

import PokemonImage from "./PokemonImage.js";

export default function Pokemon(pokemon: Pokemon) {
  useSpark(`
    $pokemon rdfs:label $label .
    optional { $pokemon vocab:sinnohNumber $sinnohNumber }
  `);

  return (
    <div className="pokemon">
      <h2>{pokemon.label}</h2>
      <PokemonImage {...pokemon} />
    </div>
  );
}
