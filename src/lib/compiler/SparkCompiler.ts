import fs from "fs";
import { Parser, Generator, SelectQuery } from "sparqljs";
import { nonNullable } from "../nonNullable";
import { capitalize } from "lodash-es";
import dataFactory from "@rdfjs/data-model";
import { getPrefixes, getTripleMeta, Meta } from "./meta";

export type Options = {
  entry: string;
  root: string;
  output: string;
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

const createClassTypes = (meta: Meta) => {
  return Object.entries(meta)
    .map(([groupingName, classData]) => {
      return `export type ${capitalize(groupingName)} = {\n${Object.entries(
        classData.variables
      )
        .map(([variable, isPlural]) => {
          return `  ${variable === groupingName ? "iri" : variable}: string${
            isPlural ? "[]" : ""
          };`;
        })
        .join("\n")}\n}`;
    })
    .join("\n");
};

const createClassQueries = (meta: Meta, prefixes: Record<string, string>) => {
  const parser = new Parser({ prefixes });
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
      mergedQuery.variables = Object.entries(classData.variables).map(
        ([variable, isPlural]) =>
          isPlural
            ? {
                expression: {
                  expression: dataFactory.variable("_" + variable),
                  type: "aggregate",
                  aggregation: "group_concat",
                  distinct: false,
                  separator: "|||",
                },
                variable: dataFactory.variable(variable),
              }
            : dataFactory.variable(variable)
      );

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
