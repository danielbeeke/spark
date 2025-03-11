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

- [x] Allow optional and propagate to the types.
- [x] Allow filter() statically. Somewhat implemented. You can use it in the SPARQL.
- [x] Allow filtering dynamically.
- [x] Use ? SPARQL variables to denote plural and $ to denote singular.
- [x] Translate the subject variable always to `iri` and singular.

# What do you need to know to use it?
- `useSpark`s first argument is used statically. The input you can give is everything that you normally write between the curly brackets in `select * as {}`. The compiler reads these SPARQL fragments and extracts all the information needed to create a TypeScript type and to write an accompanying query template (see spark-generated.ts). 
- Dynamic tricks can be done with the second argument to `useSpark`. It contains a limit, offset, orderDirection and orderBy arguments as well as `additionalSparql` in which you can write raw SPARQL for dynamic filters.
- SPARQL variables: ? denotes a predicate is plural, $ denotes it is singular.