# Spark 

An experiment to have decoupled React components driven by SPARQL fragments that are pieced together into one query which is only fetched once.

## How does it work?

We can write SPARQL fragments like a basic graph pattern.
The variable name of the subject is used to group things together:

```TypeScript
export default function PokemonList () {
    const pokemons = useSpark('$pokemon rdf:type vocab:Pokémon', {
        limit: 10,
        orderBy: '$pokemon'
    })

    return pokemons.map(pokemon => <Pokemon key={pokemon.pokemon} {...pokemon} />)
}
```

```TypeScript
export default function Pokemon ({ label, pokemon }: Pokemon) {
    useSpark('$pokemon rdfs:label ?label')

    return <div>
        <h2>{label}</h2>
        <em>{pokemon}</em>
    </div>
}
```

Together become:

```sparql
SELECT * WHERE {
  ?pokemon rdfs:label ?label.
  ?pokemon a vocab:Pokémon.
}
order by $pokemon
limit 10
```

The tool also generates types that are used inside useSpark and the developer can reuse these for easy development.
Removing a triply pattern will show all the places where that binding was used.

# Ideas

- Use ? SPARQL variables to denote plural and $ to denote singular.
- Allow optional and propagate to the types.
- Translate the subject variable always to `iri` and singular.
- Allow filter() statically and also dynamically.
- Reconsider the choice of using SPARQL fragments. Maybe something that mimics it gives more freedom.
  - $subject rdfs:label? $label