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

type SparqlResponse = {
  results: {
    bindings: [Record<string, { value: string }>];
  };
};

const createPromise = ({
  cachedFetch,
  groupingName,
  queryOptions,
  endpoint,
}: {
  cachedFetch: (typeof global)["fetch"];
  groupingName: keyof typeof triplePatternsGrouped;
  queryOptions?: QueryOptions;
  endpoint: string;
}) => {
  if (!(groupingName in triplePatternsGrouped))
    throw new Error("Could not find the query");

  let query = triplePatternsGrouped[groupingName];
  const {
    orderBy = `$${groupingName}`,
    orderDirection = "asc",
    limit,
    offset,
  } = queryOptions ?? {};

  if (orderBy)
    query = query.replace("#orderBy", `order by ${orderDirection}(${orderBy})`);
  if (limit !== undefined) query = query.replace("#limit", `limit ${limit}`);
  if (offset !== undefined)
    query = query.replace("#offset", `offset ${offset}`);

  const url = new URL(endpoint);
  url.searchParams.set("query", query);

  return cachedFetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
  })
    .then((response) => response.json())
    .then((sparqlResponse: SparqlResponse) =>
      sparqlResponse.results.bindings.map((binding) =>
        Object.fromEntries(
          Object.entries(binding).map(([key, value]) => [key, value.value])
        )
      )
    );
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
      return {
        prefixes,
        endpoint,
        // You can use the useSpark where you want to execute the promise and 
        // where you only want to statically signal something must be used.
        get items(): triplePatternTypes[T][] {
          const groupingName = triplePattern
            .split(" ")[0]
            .substring(1) as keyof typeof triplePatternsGrouped;

          const cid = groupingName + JSON.stringify(queryOptions);

          if (!promises.has(cid)) {
            const promise = createPromise({
              cachedFetch,
              endpoint,
              queryOptions,
              groupingName,
            });
            promises.set(cid, promise);
          }

          return use(promises.get(cid)!);
        },
      };
    },
  };
};
