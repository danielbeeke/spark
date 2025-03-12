# Spark 

An experiment to have decoupled React components driven by SPARQL fragments that are pieced together into one query which is only fetched once.

# How to use?

- Start by creating a local Spark instance exactly like: ./src/spark.ts. Here you can add prefixes and the SPARQL endpoint that you want to use.
- Write components and use `useSpark('$product rdfs:label $label')` to require the predicate rdfs:label to be fetched for products.
    - After writing this SPARQL fragment, a TypeScript type will be available for `Product` which you can find in spark-generated.ts.
- Using `$`label denotes that the property label is singular, to have it plural use `?`label.
- The first argument of `useSpark()` is what you normally would write in between the curly brackets in `select * where {}`
- Because of that it is allowed use filter() or other SPARQL functions.
- `useSparql()` also has a return object. It returns `{ items: Item[], item: Item[] }` where `Item` is the type of all the fragments for a certain subject variable bundled together. Reading this variable executes the fetcher. Not reading it out does not execute it.
- This gives the possibility to create React components and locally declare that a certain predicate is needed. 
- The framework will make sure a SPARQL query is pieced together for all the fragments of one subject variable.
- There is a second argument to `useSpark`, it is an object that contains the optional keys: limit, offset, orderBy, orderDirection and sparql.
    - `sparql` can be used to execute dynamic SPARQL together with all the properties that will be fetched. You can use this for filtering.
    - `offset` and `limit` can be used for pagination.
    - `orderBy` and `orderDirection` can be used for ordering.