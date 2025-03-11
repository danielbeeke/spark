import { fragmentTypes, queries, classMeta } from "../spark-generated";
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
  sparql?: string;
};

type SparqlResponse = {
  results: {
    bindings: [Record<string, { value: string }>];
  };
};

const processBindings = (groupingName: string) => (sparqlResponse: SparqlResponse) => {
  return sparqlResponse.results.bindings.map((binding) =>
    Object.fromEntries(
      Object.entries(binding).map(([key, value]) => {
        const variables = classMeta[groupingName as keyof typeof classMeta].variables;
        const { plural } = variables[key as keyof typeof variables];
        const preparedValue = plural ? value.value.split("|||") : value.value;
        return [key === groupingName ? "iri" : key, preparedValue];
      })
    )
  );
};

const createPromise = ({
  cachedFetch,
  groupingName,
  queryOptions,
  endpoint,
}: {
  cachedFetch: (typeof global)["fetch"];
  groupingName: keyof typeof queries;
  queryOptions?: QueryOptions;
  endpoint: string;
}) => {
  if (!(groupingName in queries)) throw new Error("Could not find the query");

  let query = queries[groupingName];
  const {
    orderBy = `$${groupingName}`,
    orderDirection = "asc",
    limit,
    offset,
    sparql,
  } = queryOptions ?? {};

  query = query.replace("#orderBy", orderBy ? `order by ${orderDirection}(${orderBy})` : "");
  query = query.replace("#limit", limit !== undefined ? `limit ${limit}` : "");
  query = query.replace("#offset", offset ? `offset ${offset}` : "");
  query = query.replace("#additionSparql", sparql ?? "");

  const url = new URL(endpoint);
  url.searchParams.set("query", query);

  console.log(query);

  return cachedFetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
  })
    .then((response) => response.json())
    .then(processBindings(groupingName));
};

export const Spark = ({ endpoint, prefixes }: SparkOptions) => {
  const cachedFetch = CachedFetch();
  const promises: Map<string, Promise<any>> = new Map();

  return {
    endpoint,
    prefixes,
    useSpark: <T extends keyof fragmentTypes>(triplePattern: T, queryOptions?: QueryOptions) => {
      const getPromise = (): Promise<fragmentTypes[T][]> => {
        const groupingName = triplePattern
          .trim()
          .split(" ")[0]
          .substring(1) as keyof typeof queries;

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

        return promises.get(cid)!;
      };

      const returnObject = {
        prefixes,
        endpoint,
        get items(): fragmentTypes[T][] {
          return use(getPromise());
        },
        get item(): fragmentTypes[T] {
          return use(getPromise().then((items) => items[0]));
        },
      };

      return returnObject;
    },
  };
};
