import fs from "fs";
import { Parser, SelectQuery } from "sparqljs";
import { uniq } from "lodash-es";
import traverse from "traverse";

export type Meta = Record<
  string,
  {
    endpoint: string;
    triplePatterns: string[];
    variables: Record<
      string,
      {
        plural: boolean;
        optional: boolean;
        dataTypes: string[]
      }
    >;
  }
>;

const regex = new RegExp(/useSpark\([`](.[^`]*)[`]/gms);

const getGroupingName = (triplePattern: string, prefixes: Record<string, string>) => {
  const query = `select * where { ${triplePattern} }`;
  const parser = new Parser({ prefixes });
  const parsedQuery = parser.parse(query) as SelectQuery;
  const bgps = parsedQuery.where?.filter((where) => where.type === "bgp");
  const groupingName = bgps?.[0].triples[0].subject.value;
  if (!groupingName) throw new Error("Could not extract the groupingName");
  return groupingName;
};

export const getTripleMeta = async (
  root: string,
  prefixes: Record<string, string>,
  endpoint: string
): Promise<Meta> => {
  const files = await fs.promises.readdir(root, {
    recursive: true,
  });

  const triplePatterns: string[] = [];

  for (const file of files) {
    const path = `${process.cwd()}/${root}/${file}`;
    const stats = await fs.promises.stat(path);
    if (!stats.isFile()) continue;

    const contents = await fs.promises.readFile(`${process.cwd()}/${root}/${file}`, "utf8");
    if (contents.includes("useSpark")) {
      const matches = contents.matchAll(regex);
      for (const match of matches) triplePatterns.push(match[1]);
    }
  }

  const groupingNames = uniq(
    triplePatterns.map((triplePattern) => getGroupingName(triplePattern, prefixes))
  );

  return Object.fromEntries(
    groupingNames.map((groupingName) => {
      const groupingTriplePatterns = triplePatterns.filter((triplePattern) => {
        const innerGroupingName = getGroupingName(triplePattern, prefixes);
        return innerGroupingName === groupingName;
      });

      const variables = uniq(
        groupingTriplePatterns.flatMap((triplePattern) =>
          getVariablesFromTriplePattern(triplePattern, prefixes)
        )
      );

      return [
        groupingName,
        {
          endpoint,
          triplePatterns: groupingTriplePatterns,
          variables: Object.fromEntries(
            variables.map(({ variable, optional }) => {
              const isSingular = groupingTriplePatterns.some((triplePattern) =>
                triplePattern.includes(`$${variable}`)
              );
              const isPlural = groupingTriplePatterns.some((triplePattern) =>
                triplePattern.includes(`?${variable}`)
              );
              if ((!isSingular && !isPlural) || (isSingular && isPlural))
                throw new Error(
                  `The variable ${variable} is plural: ${isPlural} & is singular: ${isSingular}`
                );

              return [
                variable,
                {
                  plural: isPlural,
                  optional,
                  dataTypes: []
                },
              ];
            })
          ),
        },
      ];
    })
  );
};

const getVariablesFromTriplePattern = (triplePattern: string, prefixes: Record<string, string>) => {
  const parser = new Parser({ prefixes });

  const finalQuery = `select * where { ${triplePattern} }`;
  const parsedQuery = parser.parse(finalQuery) as SelectQuery;

  const variables: { variable: string; optional: boolean }[] = [];
  traverse(parsedQuery).forEach(function (value) {
    if (value.termType === "Variable") {
      const containsOptional = this.parents.some((parent) => parent.node.type === "optional");
      variables.push({ variable: value.value, optional: containsOptional });
    }
  });

  return variables;
};
