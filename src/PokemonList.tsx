import { useState } from "react";
import Pokemon from "./Pokemon";
import { useSpark } from "./spark.js";

export default function PokemonList() {
  const [limit, setLimit] = useState(10);
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

  const { items: types } = useSpark(`
    $type rdfs:label $label . 
    filter(strstarts(str($type), str(id:)))
  `);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { items: pokemons } = useSpark(`
      $pokemon rdf:type vocab:Pokémon .
      $pokemon vocab:type ?type .
    `,
    {
      limit,
      orderDirection,
      sparql: selectedTypes.length
        ? `filter(?_type IN (${selectedTypes}))`
        : "",
    }
  );

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

      <select
        multiple
        value={selectedTypes}
        onChange={(event) => {
          setSelectedTypes(
            [...event.target.selectedOptions].map((option) => option.value)
          );
        }}
      >
        {types.map((type) => (
          <option value={`<${type.iri}>`} key={type.iri}>
            {type.label}
          </option>
        ))}
      </select>

      {pokemons.map((pokemon) => (
        <Pokemon key={pokemon.iri} {...pokemon} />
      ))}
    </div>
  );
}
