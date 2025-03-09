import PokemonImage from "./PokemonImage.js"
import type { Pokemon } from "./spark-generated"
import { useSpark } from "./spark.js"

export default function Pokemon (pokemon: Pokemon) {
    useSpark(`$pokemon rdfs:label ?label`)

    return <div className="pokemon">
        <h2>{pokemon.label}</h2>
        <PokemonImage {...pokemon} />
    </div>
}
