# Spark 

An experiment to have decoupled React components driven by SPARQL fragments that are pieced together into one query which is only fetched once.

## How does it work?

We can write SPARQL fragments like a basic graph pattern.
The variable name of the subject is used to group things together:

So: `$pokemon rdf:type vocab:Pokémon` and `$pokemon rdfs:label ?label` will be merged into:

```sparql
SELECT * WHERE {
  ?pokemon rdfs:label ?label.
  ?pokemon a vocab:Pokémon.
}
```

A context is used to make the decoupling possible. Every component by default is executed multiple times, when the context has an index we now we need the specific bindings for that index and not the whole list.