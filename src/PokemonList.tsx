import { Suspense, useState } from "react";
import Pokemon from "./Pokemon";
import { useSpark } from "./spark.js";

export default function PokemonList() {
  const [limit, setLimit] = useState(12);
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { items: types } = useSpark(`
    $type rdfs:label $label . 
    filter(strstarts(str($type), str(id:)))
  `);

  return (
    <div className="col-6">
      <div className="filters d-flex p-3 gap-3">
        <div className="mb-3">
          <label htmlFor="limit" className="form-label">
            Limit
          </label>
          <input
            type="number"
            id="limit"
            className="form-control"
            value={limit}
            onChange={(event) => {
              const newLimit = Math.max(parseInt(event.target.value), 1);
              if (Number.isInteger(newLimit) && newLimit > 0) setLimit(newLimit);
            }}
            min={1}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="direction" className="form-label">
            Sorting direction
          </label>

          <select
            id="direction"
            className="form-select"
            onChange={(event) => setOrderDirection(event.target.value as "asc" | "desc")}
          >
            <option value={"asc"}>Ascending</option>
            <option value={"desc"}>Descending</option>
          </select>
        </div>

        <div className="mb-3" style={{flex: '30% 1 1'}}>
          <label htmlFor="types" className="form-label">
            Type(s)
          </label>

          <select
            multiple
            className="form-select"
            value={selectedTypes}
            onChange={(event) =>
              setSelectedTypes([...event.target.selectedOptions].map((option) => option.value))
            }
          >
            {types.map((type) => (
              <option value={`<${type.iri}>`} key={type.iri}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Suspense fallback={<span>Loading...</span>}>
        <InnerList {...{ orderDirection, limit, selectedTypes }} />
      </Suspense>
    </div>
  );
}

// We have an InnerList component because of the nature of useSpark.
// It needs Suspense to show loading states.
function InnerList({
  selectedTypes,
  limit,
  orderDirection,
}: {
  selectedTypes: string[];
  limit: number;
  orderDirection?: "asc" | "desc";
}) {
  const filterQuery = selectedTypes.length ? `filter(?type in (${selectedTypes}))` : "";

  const { items: pokemons } = useSpark(`
      $pokemon rdf:type vocab:Pokémon .
      $pokemon vocab:type ?type .
    `,
    {
      limit,
      orderDirection,
      sparql: filterQuery,
    }
  );

  return (
    <div
      className="d-flex flex-wrap"
      style={{ maxHeight: "calc(100vh - 186px)", overflow: "auto" }}
    >
      {pokemons.map((pokemon) => (
        <Pokemon key={pokemon.iri} {...pokemon} />
      ))}
    </div>
  );
}
