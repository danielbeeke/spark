import { useSpark } from "@lib/Spark.js";
import type { Spark } from "@lib/Spark.js";

import PokemonImage from "./PokemonImage.js";

export default function Pokemon(pokemon: Spark<'pokemon'>) {
  useSpark(`
    $pokemon rdfs:label $label .
    optional { $pokemon vocab:sinnohNumber $sinnohNumber }
    $pokemon vocab:description ?description .
  `);

  return (
    <div className="pokemon m-3" style={{flex: '20% 1 1'}}>
      <h3>{pokemon.label}</h3>
      <PokemonImage {...pokemon} />
    </div>
  );
}
