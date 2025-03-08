import PokemonLabel from "./PokemonLabel";
import { spark } from "./spark";

export default spark(
`$pokemon rdf:type vocab:Pokémon`,
  ({ pokemon }) => {
    return (
      <div className="pokemon">
        <span>{pokemon}</span>
        <PokemonLabel />
      </div>
    );
  }
);
