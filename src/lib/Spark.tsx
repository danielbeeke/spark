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
  sparql?: string
};

type SparqlResponse = {
  results: {
    bindings: [Record<string, { value: string }>];
  };
};

/**
 * This can fail when your data has multiple values for a certain predicate but you used the wrong symbol in the triple pattern:
 * ? denotes a predicate is plural, $ denotes it is singular.
 */
const processBindings = (groupingName: string) => (sparqlResponse: SparqlResponse) => {
  return sparqlResponse.results.bindings.map((binding) =>
    Object.fromEntries(
      Object.entries(binding).map(([key, value]) => {
        const variables = classMeta[groupingName as keyof typeof classMeta].variables
        const { plural } = variables[key as keyof typeof variables]
        const preparedValue = plural ? value.value.split('|||') : value.value
        return [key === groupingName ? 'iri' : key, preparedValue]
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
    sparql
  } = queryOptions ?? {};

  query = query.replace("#orderBy", orderBy ? `order by ${orderDirection}(${orderBy})` : '');
  query = query.replace("#limit", limit !== undefined ? `limit ${limit}` : '');
  query = query.replace("#offset", offset ? `offset ${offset}` : '');
  query = query.replace("#additionSparql", sparql ?? '');

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
    /**
     * In this PoC we can only fetch things if the predicate only exists once for the subject.
     * When there are multiple objects we can complete duplicate bindings except for that one object.
     * This is logical and inherit to RDF.
     *
     * Maybe we can use group_concat. Don't know, should be fixed, how to signal the cardinality?.
     * We don't have shapes and that is kind of cool. Could we encode it in the triple patterns?
     */
    useSpark: <T extends keyof fragmentTypes>(
      triplePattern: T,
      queryOptions?: QueryOptions
    ) => {
      return {
        prefixes,
        endpoint,
        // You can use the useSpark where you want to execute the promise and
        // where you only want to statically signal something must be used.
        // For that reason we lazily executed the fetch.
        get items(): fragmentTypes[T][] {
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

          return use(promises.get(cid)!);
        },
      };
    },
  };
};
