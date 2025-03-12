import type { Pokemon } from "./spark-generated";
import { useSpark } from "./spark.js";

import PokemonImage from "./PokemonImage.js";

export default function Pokemon(pokemon: Pokemon) {
  useSpark(`
    $pokemon rdfs:label $label .
    optional { $pokemon vocab:sinnohNumber $sinnohNumber }
  `);

  return (
    <div className="pokemon m-3" style={{flex: '20% 1 1'}}>
      <h3>{pokemon.label}</h3>
      <PokemonImage {...pokemon} />
    </div>
  );
}
