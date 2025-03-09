import { useState } from "react";
import Pokemon from "./Pokemon";
import { useSpark } from "./spark.js";

export default function PokemonList() {
  const [limit, setLimit] = useState(10);
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

  const { items: pokemons } = useSpark(`$pokemon rdf:type vocab:Pokémon`, {
    limit,
    orderDirection,
  });

  return (
    <div>
      <input
        type="number"
        value={limit}
        onChange={(event) => setLimit(parseInt(event.target.value))}
        min={1}
      />
      <select
        onChange={(event) =>
          setOrderDirection(event.target.value as "asc" | "desc")
        }
      >
        <option value={"asc"}>Ascending</option>
        <option value={"desc"}>Descending</option>
      </select>

      {pokemons.map((pokemon) => (
        <Pokemon key={pokemon.pokemon} {...pokemon} />
      ))}
    </div>
  );
}
