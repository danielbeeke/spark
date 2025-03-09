import { triplyPatternTypes, triplyPatternsGrouped } from "../spark-generated";
import { Parser, Generator, SelectQuery } from "sparqljs";
import { nonNullable } from "./nonNullable";
import dataFactory from "@rdfjs/data-model";
import { CachedFetch } from "./CachedFetch";
import { use } from "react";

type SparkOptions = {
  endpoint: string;
  prefixes: Record<string, string>;
};

type QueryOptions = {
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export const Spark = ({ prefixes, endpoint }: SparkOptions) => {
  const parser = new Parser();
  const generator = new Generator();
  const cachedFetch = CachedFetch();

  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");

  const promises: Map<string, Promise<any>> = new Map();

  return {
    useSpark: <T extends keyof triplyPatternTypes>(
      triplePattern: T,
      queryOptions?: QueryOptions
    ) => {
      const groupingName = triplePattern
        .split(" ")[0]
        .substring(1) as keyof typeof triplyPatternsGrouped;
      if (!promises.has(groupingName)) {
        if (!(groupingName in triplyPatternsGrouped))
          throw new Error("Could not find the query");

        const templateQuery = "select * where {}";
        const mergedQuery = parser.parse(templateQuery) as SelectQuery;

        const partialQueries = triplyPatternsGrouped[groupingName].map(
          (triplyPattern) => {
            const query = `${prefixesString} select * where { ${triplyPattern} }`;
            return parser.parse(query);
          }
        ) as SelectQuery[];

        mergedQuery.prefixes = prefixes;
        mergedQuery.where = partialQueries
          .flatMap((partialQuery) => partialQuery.where)
          .filter(nonNullable);

        const { orderBy, orderDirection, limit, offset } = queryOptions ?? {};

        if (orderBy) {
          mergedQuery.order = [
            {
              expression: dataFactory.variable(orderBy),
              descending: orderDirection === "desc",
            },
          ];
        }
        if (limit !== undefined) mergedQuery.limit = limit;
        if (offset !== undefined) mergedQuery.offset = offset;

        const queryString = generator.stringify(mergedQuery);

        // Execute the mergedQuery via the cached fetch.
        const url = new URL(endpoint);
        url.searchParams.set("query", queryString);

        const promise = cachedFetch(url, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/sparql-results+json",
          },
        })
          .then((response) => response.json())
          .then(
            (sparqlResponse: {
              results: {
                bindings: [Record<string, { value: string }>];
              };
            }) =>
              sparqlResponse.results.bindings.map((binding) =>
                Object.fromEntries(
                  Object.entries(binding).map(([key, value]) => [
                    key,
                    value.value,
                  ])
                )
              )
          );

        promises.set(groupingName, promise);
      }
      return {
        items: use(promises.get(groupingName)!) as triplyPatternTypes[T][],
      };
    },
  };
};
