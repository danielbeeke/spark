import { createContext, JSX, lazy, LazyExoticComponent, Suspense, useContext } from "react";
import { queries } from "../types";
import { Parser, Query, Generator } from "sparqljs";
import { CachedFetch } from "./CachedFetch";
import { nonNullable } from "./nonNullable";

type SparkOptions = {
  endpoint: string;
  prefixes: Record<string, string>;
};

const sparkContext = createContext<{ groupingName?: string, index?: number }>({})

export function Spark({ endpoint, prefixes }: SparkOptions) {
  // Scoped to this Spark instance.
  const cachedFetch = CachedFetch()
  const parser = new Parser();
  const generator = new Generator();
  const partials: Map<string, Query[]> = new Map();
  const mergedQueries: Map<string, string> = new Map();
  
  return function spark<Query extends keyof queries>(
    query: Query,
    Component: (props: queries[Query]) => JSX.Element
  ): LazyExoticComponent<any> {
    // Registration phase
    const prefixesString = Object.entries(prefixes)
      .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
      .join("\n");

    const finalQuery = `${prefixesString} select * where { ${query} }`;

    const parsedQuery = parser.parse(finalQuery);
    if (parsedQuery.type !== "query")
      throw new Error("Can not support update queries");
    const firstPattern = parsedQuery?.where?.[0];
    if (firstPattern?.type !== "bgp") throw new Error("Must be triples");

    const groupingName = firstPattern.triples[0].subject.value;

    if (!partials.has(groupingName)) partials.set(groupingName, []);
    const subjectPartials = partials.get(groupingName)!;
    subjectPartials.push(parsedQuery);

    return lazy(async () => {
      // Execution phase, piecing together the merged query.
      if (!mergedQueries.has(groupingName)) {
        const templateQuery = `select * where {}`;
        const mergedQuery = parser.parse(templateQuery);
        if (mergedQuery.type !== "query")
          throw new Error("Can not support update queries");
        mergedQuery.where = subjectPartials
          .flatMap((subjectPartial) => subjectPartial.where)
          .filter(nonNullable);
        mergedQueries.set(groupingName, generator.stringify(mergedQuery));
      }

      // Execute the mergedQuery via the cached fetch.
      const url = new URL(endpoint)
      console.log(mergedQueries.get(groupingName))
      url.searchParams.set("query", mergedQueries.get(groupingName)!);
      const response = await cachedFetch(url, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/sparql-results+json",
        },
      });

      const data = await response.json();

      return {
        default: function () {
          const localSparkContext = useContext(sparkContext)
          const localBindings = localSparkContext.index === undefined ? data.results.bindings : [data.results.bindings[localSparkContext.index]]

          return (
            <Suspense>
              {localBindings.map(
                (
                  bindings: Record<string, { value: string }>,
                  index: number
                ) => (
                  <sparkContext.Provider key={index + groupingName} value={{ groupingName: localSparkContext.groupingName ?? groupingName, index: localSparkContext.index ?? index }}>
                  {/* @ts-ignore */}
                  <Component
                    key={index}
                    {...Object.fromEntries(
                      Object.entries(bindings).map(([key, value]) => [
                        key,
                        value.value,
                      ])
                    )}
                  />
                  </sparkContext.Provider>
                )
              )}
            </Suspense>
          );
        },
      };
    });
  };
}
