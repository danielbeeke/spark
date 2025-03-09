import fs from "fs";
import { Parser, Generator, SelectQuery, Term } from "sparqljs";
import { nonNullable } from "./src/lib/nonNullable";
import { capitalize, uniq } from "lodash-es";

type Options = {
  entry: string;
  root: string;
  output: string;
};

const regex = new RegExp(/useSpark\(['"`](.[^'"`]*)['"`]/gms);

const getTriplePatterns = async (options: Options) => {
  const files = await fs.promises.readdir(options.root, {
    recursive: true,
  });

  const triplePatterns: string[] = [];

  for (const file of files) {
    const path = `${import.meta.dirname}/${options.root}/${file}`;
    const stats = await fs.promises.stat(path);
    if (!stats.isFile()) continue;

    const contents = await fs.promises.readFile(
      `${import.meta.dirname}/${options.root}/${file}`,
      "utf8"
    );
    if (contents.includes("useSpark")) {
      const matches = contents.matchAll(regex);
      for (const match of matches) triplePatterns.push(match[1]);
    }
  }

  return triplePatterns;
};

const getPrefixes = async (options: Options) => {
  const entryContents = await fs.promises.readFile(
    `${import.meta.dirname}/${options.entry}`,
    "utf8"
  );
  const entryContentsCleaned = entryContents
    .split("\n")
    .filter((line) => !line.includes("import"))
    .join("\n");
  const spark = `const Spark = (options) => { return { useSpark: {}, ...options } }\n`;
  const b64moduleData =
    "data:text/javascript;base64," + btoa(spark + entryContentsCleaned);
  const entry = await import(b64moduleData);
  const { prefixes } = entry.default;
  return prefixes;
};

const createFragmentType = (triplePatterns: string[]) => {
  return `export type triplePatternTypes = {\n${triplePatterns
    .map((triplePattern) => {
      const groupingName = triplePattern.split(" ")[0].substring(1);
      return `  [\`${triplePattern}\`]: ${capitalize(groupingName)};`;
    })
    .join("\n")}\n};`;
};

const createClassTypes = (
  groupingNames: string[],
  triplePatterns: string[],
  prefixes: Record<string, string>
) => {
  const prefixesString = Object.entries(prefixes)
  .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
  .join("\n");
  const parser = new Parser();

  return groupingNames
    .map((groupingName) => {
      const groupingTriplePatterns = triplePatterns.filter((triplePattern) => {
        const innerGroupingName = triplePattern.split(" ")[0].substring(1);
        return innerGroupingName === groupingName;
      });

      const variables = uniq(groupingTriplePatterns.flatMap(triplePattern => {
        const finalQuery = `${prefixesString} select * where { ${triplePattern} }`;
        const parsedQuery = parser.parse(finalQuery) as SelectQuery;
        return parsedQuery.where?.flatMap(where => {
          return where.type === 'bgp' ? where.triples : []
        }).flatMap((pattern) => [
          pattern.subject,
          pattern.predicate,
          pattern.object,
        ])
        .filter((term) => (term as Term).termType === "Variable")
        .map((variable) => (variable as Term).value)
      }))

      return `export type ${capitalize(groupingName)} = {\n${variables.map((variable) => `  ${variable}: string;`).join("\n")}\n}`;
    })
    .join("\n");
};

const createClassQueries = (
  groupingNames: string[],
  triplePatterns: string[],
  prefixes: Record<string, string>
) => {
  const parser = new Parser();
  const generator = new Generator();
  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");

  const queries = Object.fromEntries(
    groupingNames.map((groupingName) => {
      const fragmentWheres = triplePatterns
        .filter((triplePattern) => {
          const innerGroupingName = triplePattern.split(" ")[0].substring(1);
          return innerGroupingName === groupingName;
        })
        .flatMap((triplePattern) => {
          const finalQuery = `${prefixesString} select * where { ${triplePattern} }`;
          const parsedQuery = parser.parse(finalQuery) as SelectQuery;
          return parsedQuery.where;
        });

      const mergedQuery = parser.parse(
        `${prefixesString} select * where {}`
      ) as SelectQuery;
      mergedQuery.where = fragmentWheres.filter(nonNullable);

      return [groupingName, generator.stringify(mergedQuery) + `\n#orderBy\n#limit\n#offset`];
    })
  );

  return `export const triplePatternsGrouped = {\n${Object.entries(queries).map(
    ([name, query]) => {
      const indentedQuery = query
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n");
      return `  ${name}:\`\n${indentedQuery}\`,`;
    }
  )}\n}`;
};

const sparkGenerate = async (options: Options) => {
  const triplePatterns = await getTriplePatterns(options);
  const prefixes = await getPrefixes(options);
  const groupingNames = [
    ...new Set(
      triplePatterns.map((triplePattern) =>
        triplePattern.split(" ")[0].substring(1)
      )
    ),
  ];

  const output = [
    createClassTypes(groupingNames, triplePatterns, prefixes),
    createFragmentType(triplePatterns),
    createClassQueries(groupingNames, triplePatterns, prefixes),
  ].join("\n\n");

  await fs.promises.writeFile( `${import.meta.dirname}/${options.output}`, output, 'utf8')
};

export default function SparkCompiler(options: Options) {
  return {
    name: "spark-compiler",

    async buildStart() {
      await sparkGenerate(options);
    },

    async handleHotUpdate() {
      await sparkGenerate(options);
    },
  };
}
