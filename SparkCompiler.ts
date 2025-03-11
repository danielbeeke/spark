import fs from "fs";
import { Parser, Generator, SelectQuery, Term } from "sparqljs";
import { nonNullable } from "./src/lib/nonNullable";
import { capitalize, uniq } from "lodash-es";
import dataFactory from "@rdfjs/data-model";

type Options = {
  entry: string;
  root: string;
  output: string;
};

const regex = new RegExp(/useSpark\([`](.[^`]*)[`]/gms);

type Meta = Record<
  string,
  {
    triplePatterns: string[];
    variables: Record<string, boolean>;
  }
>;

const getTripleMeta = async (
  options: Options,
  prefixes: Record<string, string>
): Promise<Meta> => {
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

  const groupingNames = uniq(
    triplePatterns.map((triplePattern) =>
      triplePattern.split(" ")[0].substring(1)
    )
  );

  return Object.fromEntries(
    groupingNames.map((groupingName) => {
      const groupingTriplePatterns = triplePatterns.filter((triplePattern) => {
        const innerGroupingName = triplePattern.split(" ")[0].substring(1);
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
          triplePatterns: groupingTriplePatterns,
          variables: Object.fromEntries(
            variables.map((variable) => {
              const isSingular = groupingTriplePatterns.some((triplePattern) =>
                triplePattern.includes(`$${variable}`)
              );
              const isPlural = groupingTriplePatterns.some((triplePattern) =>
                triplePattern.includes(`?${variable}`)
              );
              if ((!isSingular && !isPlural) || (isSingular && isPlural))
                throw new Error("Unexpected");

              return [variable, isPlural];
            })
          ),
        },
      ];
    })
  );
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

const createFragmentType = (meta: Meta) => {
  return `export type fragmentTypes = {\n${Object.entries(meta)
    .map(([groupingName, classData]) => {
      return classData.triplePatterns
        .map(
          (triplePattern) =>
            `  [\`${triplePattern}\`]: ${capitalize(groupingName)};`
        )
        .join("\n");
    })
    .join("\n")}\n};`;
};

const getVariablesFromTriplePattern = (
  triplePattern: string,
  prefixes: Record<string, string>
) => {
  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");
  const parser = new Parser();

  const finalQuery = `${prefixesString} select * where { ${triplePattern} }`;
  const parsedQuery = parser.parse(finalQuery) as SelectQuery;
  const variables = uniq(
    parsedQuery.where
      ?.flatMap((where) => {
        return where.type === "bgp" ? where.triples : [];
      })
      .flatMap((pattern) => [
        pattern.subject,
        pattern.predicate,
        pattern.object,
      ])
      .filter((term) => (term as Term).termType === "Variable")
      .map((variable) => (variable as Term).value)
  );

  return variables;
};

const createClassTypes = (meta: Meta) => {
  return Object.entries(meta)
    .map(([groupingName, classData]) => {
      return `export type ${capitalize(groupingName)} = {\n${Object.entries(
        classData.variables
      )
        .map(([variable, isPlural]) => {
          return `  ${variable === groupingName ? 'iri' : variable}: string${isPlural ? "[]" : ""};`;
        })
        .join("\n")}\n}`;
    })
    .join("\n");
};

const createClassQueries = (meta: Meta, prefixes: Record<string, string>) => {
  const parser = new Parser();
  const generator = new Generator();
  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");

  const queries = Object.fromEntries(
    Object.entries(meta).map(([groupingName, classData]) => {
      const fragmentWheres = classData.triplePatterns.flatMap(
        (triplePattern) => {
          let triplePatternRewritten = triplePattern;
          for (const [variable, isPlural] of Object.entries(
            classData.variables
          )) {
            if (!isPlural) continue;
            triplePatternRewritten = triplePatternRewritten.replace(
              `?${variable}`,
              `?_${variable}`
            );
          }
          const finalQuery = `${prefixesString} select * where { ${triplePatternRewritten} }`;
          const parsedQuery = parser.parse(finalQuery) as SelectQuery;
          return parsedQuery.where;
        }
      );

      const mergedQuery = parser.parse(
        `${prefixesString} select * where {}`
      ) as SelectQuery;
      mergedQuery.where = fragmentWheres.filter(nonNullable);
      mergedQuery.variables = Object.entries(classData.variables)
        .map(([variable, isPlural]) => (isPlural ? {
          expression: {
            expression: dataFactory.variable('_' + variable),
            type: 'aggregate',
            aggregation: "group_concat",
            distinct: false,
            separator: "|||",
          },
          variable: dataFactory.variable(variable)
        } : dataFactory.variable(variable)));

      mergedQuery.group = Object.entries(classData.variables)
        .filter(([_variable, isPlural]) => !isPlural)
        .map(([variable]) => ({ expression: dataFactory.variable(variable) }));

      return [
        groupingName,
        generator.stringify(mergedQuery) + `\n#orderBy\n#limit\n#offset`,
      ];
    })
  );

  return `export const queries = {\n${Object.entries(queries).map(
    ([name, query]) => {
      const indentedQuery = query
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n");
      return `  ${name}:\`\n${indentedQuery}\`,`;
    }
  )}\n}`;
};

const createClassMeta = (meta: Meta) => {
  return `export const classMeta = ${JSON.stringify(meta, null, 2)}`;
};

const sparkGenerate = async (options: Options) => {
  const prefixes = await getPrefixes(options);
  const meta = await getTripleMeta(options, prefixes);

  const output = [
    createClassTypes(meta),
    createFragmentType(meta),
    createClassQueries(meta, prefixes),
    createClassMeta(meta),
  ].join("\n\n");

  await fs.promises.writeFile(
    `${import.meta.dirname}/${options.output}`,
    output,
    "utf8"
  );
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
