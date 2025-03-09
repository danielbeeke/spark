import Pokemon from "./Pokemon"
import { useSpark } from "./spark.js"

export default function PokemonList () {
    const pokemons = useSpark('$pokemon rdf:type vocab:Pokémon', {
        limit: 10,
        orderBy: '$pokemon'
    })

    return pokemons.map(pokemon => <Pokemon key={pokemon.pokemon} {...pokemon} />)
}
