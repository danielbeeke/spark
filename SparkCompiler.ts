import fs from "fs";
import { Parser, Query, Generator, SelectQuery, Term } from "sparqljs";
import { nonNullable } from "./src/lib/nonNullable";
import { capitalize } from "lodash-es";

type Options = {
  entry: string;
  root: string;
  output: string;
};

const regex = new RegExp(/useSpark\(['"`](.[^'"`]*)['"`]/gms);

const sparkGenerate = async (options: Options) => {
  // For this PoC there are quite some limitations on how you can use Spark.
  let output = ''
  let triplePatternTypes = 'export type triplePatternTypes = {\n'
  const parser = new Parser();
  const generator = new Generator();
  const mergedQueries: Map<string, string> = new Map();
  const partials: Map<string, SelectQuery[]> = new Map();
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
  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");

  const files = await fs.promises.readdir(options.root, {
    recursive: true,
  });

  const triplePatterns: string[] = [];

  for (const file of files) {
    const path = `${import.meta.dirname}/${options.root}/${file}`;
    const stats = await fs.promises.stat(path);
    if (stats.isFile()) {
      const contents = await fs.promises.readFile(
        `${import.meta.dirname}/${options.root}/${file}`,
        "utf8"
      );
      if (contents.includes("useSpark")) {
        const matches = contents.matchAll(regex);
          for (const match of matches) {
            triplePatterns.push(match[1]);
          }
      }
    }
  }

  for (const triplePattern of triplePatterns) {
    const groupingName = triplePattern.split(" ")[0].substring(1);

    triplePatternTypes += `  [\`${triplePattern}\`]: ${capitalize(groupingName)};\n`

    if (!partials.has(groupingName)) partials.set(groupingName, []);
    const subjectPartials = partials.get(groupingName)!;

    const finalQuery = `${prefixesString} select * where { ${triplePattern} }`;
    const parsedQuery = parser.parse(finalQuery) as SelectQuery;
    subjectPartials.push(parsedQuery);
  }

  triplePatternTypes += '};\n\n'
  output += triplePatternTypes + 'export const triplePatternsGrouped = {\n'

  for (const [groupingName, subjectPartials] of partials.entries()) {
    const mergedQuery = parser.parse(
      `${prefixesString} select * where {}`
    ) as SelectQuery;
    mergedQuery.where = subjectPartials
      .flatMap((subjectPartial) => subjectPartial.where)
      .filter(nonNullable);
    mergedQueries.set(groupingName, generator.stringify(mergedQuery));

    output += `${groupingName}: \`${generator.stringify(mergedQuery)}\n#orderBy\n#limit\n#offset\`,`

    const triplePatterns = mergedQuery.where.flatMap((wherePart) =>
      wherePart.type === "bgp" ? wherePart.triples : []
    );
    const variables = [
      ...new Set(
        triplePatterns
          .flatMap((pattern) => [
            pattern.subject,
            pattern.predicate,
            pattern.object,
          ])
          .filter((term) => (term as Term).termType === "Variable")
          .map((variable) => (variable as Term).value)
      ),
    ];

    output += `\n}\n\nexport type ${capitalize(groupingName)} = {
${variables.map(variable => `  ${variable}: string`).join('\n')}
}\n`
  }

  await fs.promises.writeFile( `${import.meta.dirname}/${options.output}`, output, 'utf8')
};

export default function SparkCompiler(options: Options) {
  return {
    name: "spark-compiler",

    async buildStart() {
      await sparkGenerate(options);
    },

    async handleHotUpdate () {
      await sparkGenerate(options);
    }
  };
}
