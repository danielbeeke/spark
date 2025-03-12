# Spark

An experiment to create decoupled React components driven by SPARQL fragments, which are combined into a single query that is fetched only once.

## Installation

1. Include `SparkCompiler` in your `vite.config.ts`.
2. Create a local Spark instance by following the example in `./src/spark.ts`. This is where you can define prefixes and specify the SPARQL endpoint you want to use.

## Usage

### Writing Components

- Use `useSpark('$product rdfs:label $label')` to request a predicate (e.g., `rdfs:label`) for a product.
- After writing this SPARQL fragment, a TypeScript type for `Product` will be generated in `spark-generated.ts`.

### Property Notation

- `$label` denotes a singular property.
- `?label` denotes a plural property.

### Query Structure

- The first argument of `useSpark()` represents what you would typically write inside the curly brackets of a `SELECT * WHERE {}` SPARQL query.
- All SPARQL syntax is supported.
- The `useSpark()` hook returns an object: `{ items: Item[], item: Item[] }`.
  - `Item` is a bundled type representing all fragments for a given subject variable.
  - Accessing this variable triggers the fetcher.
  - If the variable is not accessed, the fetch is not executed.

### Component-driven Queries

- React components can locally declare required predicates.
- The framework ensures a single SPARQL query is assembled for all fragments related to the same subject variable.

### Additional Options

`useSpark()` accepts a second argument: an optional configuration object with the following keys:

- `limit` & `offset`: For pagination.
- `orderBy` & `orderDirection`: For sorting results.
- `sparql`: Allows execution of dynamic SPARQL queries alongside the requested properties (useful for filtering).

### Type Generation

- The subject in the generated TypeScript type is assigned the variable `iri`.

This approach ensures efficient SPARQL querying while keeping React components modular and declarative.
