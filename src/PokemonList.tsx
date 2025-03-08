import { useList } from "./lib/Spark.tsx";
import Pokemon from "./Pokemon.tsx";

export default function PokemonList() {
  const { limit, setLimit } = useList({
    for: "pokemon",
    limit: 10,
    orderBy: "label",
  });

  return (
    <div className="all-pokemon">
      <span>
        Showing{" "}
        <input
          type="number"
          value={limit}
          onChange={(event) => setLimit(parseInt(event.target.value))}
          min={1}
        />
        {limit} pokemons
      </span>
      <Pokemon />
    </div>
  );
}
