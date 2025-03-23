# Spark

An experiment to create decoupled React components driven by SPARQL fragments.
This approach ensures efficient SPARQL querying while keeping React components modular and declarative.

---

## Installation

- Include `SparkCompiler` in your `vite.config.ts`. This is where you can define prefixes and specify the SPARQL endpoint you want to use. Optionally turn on `discoverDataTypes` to let Spark discover the datatypes via a SPARQL query.

## Usage

### Writing Components

- Use `useSpark('$product rdfs:label $label')` to require a predicate (e.g., `rdfs:label`) for a certain type.
- After writing this SPARQL fragment, a TypeScript type for `Product` will be generated, which you can use via the type `Spark<'product'>`.

### Property Notation inside the Query fragments

- `$label` denotes a singular property.
- `?label` denotes a plural property.

### Query Structure

- The first argument of `useSpark()` represents what you would typically write inside the curly brackets of a `SELECT * WHERE {}` SPARQL query.
- All SPARQL syntax is supported.
- The `useSpark()` hook returns two properties: `{ items: Item[], item: Item[] }`.
  - `Items` are all the resources fetched
  - `Item` is the first resource fetched
  - Accessing this variable triggers the fetcher.
  - If the variable is not accessed, the fetch is not executed.


### Additional Options

`useSpark()` accepts a second argument: an optional configuration object with the following keys:

- `limit` & `offset`: For pagination.
- `orderBy` & `orderDirection`: For sorting results.
- `sparql`: Allows execution of dynamic SPARQL queries alongside the requested properties (useful for filtering).

### Type Generation

- The subject in the generated TypeScript type is assigned the variable `iri`.

## TODO

[ ] Add caching for the dataTypes query
[ ] Support multiple sources
[ ] Support for multilingual text handling
    - Could be achieved via dynamic Sparql that according to the data types add a filter
    - Would not deal with multiple objects with the same language.
    - Could work with $ but still receives multiple bindings.
[ ] Improve the handling of optional
[ ] More support for type casting, such as xsd:date to Date.
[ ] Support nested objects similar to sparqljson-to-tree.js