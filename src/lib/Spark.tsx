import { triplePatternTypes, triplePatternsGrouped } from "../spark-generated";
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

export const Spark = ({ endpoint, prefixes }: SparkOptions) => {
  const cachedFetch = CachedFetch();
  const promises: Map<string, Promise<any>> = new Map();

  return {
    endpoint,
    prefixes,
    useSpark: <T extends keyof triplePatternTypes>(
      triplePattern: T,
      queryOptions?: QueryOptions
    ) => {
      const groupingName = triplePattern
        .split(" ")[0]
        .substring(1) as keyof typeof triplePatternsGrouped;

      const cid = groupingName + JSON.stringify(queryOptions)

      if (!promises.has(cid)) {
        if (!(groupingName in triplePatternsGrouped))
          throw new Error("Could not find the query");

        let query = triplePatternsGrouped[groupingName];
        const { orderBy, orderDirection = 'asc', limit, offset } = queryOptions ?? {};

        if (orderBy)
          query = query.replace("#orderBy", `order by ${orderDirection}(${orderBy})`);
        if (limit !== undefined) query = query.replace('#limit', `limit ${limit}`)
        if (offset !== undefined) query = query.replace('#offset', `offset ${offset}`)

        // Execute the mergedQuery via the cached fetch.
        const url = new URL(endpoint);
        url.searchParams.set("query", query);

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

        promises.set(cid, promise);
      }
      return use(promises.get(cid)!) as triplePatternTypes[T][]
    },
  };
};
