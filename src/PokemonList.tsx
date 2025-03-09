import Pokemon from "./Pokemon"
import { useSpark } from "./spark"

export default function PokemonList () {
    const { items } = useSpark('$pokemon rdf:type vocab:Pokémon', {
        limit: 10
    })

    return items.map((item) => <Pokemon key={item.pokemon} {...item} />)
}