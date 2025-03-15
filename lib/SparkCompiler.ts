import fs from "fs";
import { Parser, Generator, SelectQuery } from "sparqljs";
import { nonNullable } from "./nonNullable";
import { capitalize } from "lodash-es";
import dataFactory from "@rdfjs/data-model";
import { getTripleMeta, Meta } from "./meta";

type Source = {
  discoverDataTypes?: boolean
  endpoint: string,
  prefixes?: Record<string, string>
}

export type Options = {
  sources: Record<string, Source>
};

export type DataTypes = Record<string, Record<string, string[]>>;

const createFragmentType = (meta: Meta) => {
  return `export type fragmentTypes = {\n${Object.entries(meta)
    .map(([groupingName, classData]) => {
      return `${classData.triplePatterns
        .map((triplePattern) => `  [\`${triplePattern}\`]: ${capitalize(groupingName)};`)
        .join("\n")}\n  ${groupingName}: ${capitalize(groupingName)};`;
    })
    .join("\n")}\n};`;
};

const dataTypeMapping = {
  "http://www.w3.org/2001/XMLSchema#string": "string",
  "http://www.w3.org/2001/XMLSchema#integer": "number",
};

const mapType = (iri: string): string => {
  return iri in dataTypeMapping
  ? dataTypeMapping[iri as keyof typeof dataTypeMapping]
  : "string";
}

const createClassTypes = (meta: Meta, dataTypes: DataTypes) => {
  return Object.entries(meta)
    .map(([groupingName, classData]) => {
      return `export type ${capitalize(groupingName)} = {\n${Object.entries(classData.variables)
        .map(([variable, { plural, optional }]) => {
          const variableDataTypes = dataTypes[groupingName]?.[variable] ?? [
            "http://www.w3.org/2001/XMLSchema#string",
          ];

          const type = variableDataTypes
            .map(mapType)
            .join(" | ");
          return `  ${variable === groupingName ? "iri" : variable}${optional ? "?" : ""}: ${
            plural ? "Array<" : ""
          }${type}${plural ? ">" : ""};`;
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
      const fragmentWheres = classData.triplePatterns.flatMap((triplePattern) => {
        let triplePatternRewritten = triplePattern;
        for (const [variable, { plural }] of Object.entries(classData.variables)) {
          if (!plural) continue;
          triplePatternRewritten = triplePatternRewritten.replaceAll(
            `?${variable}`,
            `?_${variable}`
          );
        }
        const finalQuery = `${prefixesString} select * where { ${triplePatternRewritten} }`;
        const parsedQuery = parser.parse(finalQuery) as SelectQuery;
        return parsedQuery.where;
      });

      const mergedQuery = parser.parse(`${prefixesString} select * where {}`) as SelectQuery;
      mergedQuery.where = fragmentWheres.filter(nonNullable);
      mergedQuery.variables = Object.entries(classData.variables).map(([variable, { plural }]) =>
        plural
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
        .filter(([_variable, { plural }]) => !plural)
        .map(([variable]) => ({ expression: dataFactory.variable(variable) }));

      let query = generator.stringify(mergedQuery) + `\n#orderBy\n#limit\n#offset`;
      query = query.replace(`}\nGROUP`, `#additionSparql\n}\nGROUP`);

      return [groupingName, query];
    })
  );

  return `export const queries = {\n${Object.entries(queries)
    .map(([name, query]) => {
      const indentedQuery = query
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n");
      return `  ${name}:\`\n${indentedQuery}\`,`;
    })
    .join("")}\n}`;
};

const createClassMeta = (meta: Meta) => {
  return `export const classMeta = ${JSON.stringify(meta, null, 2)}`;
};

const getDataTypes = async (meta: Meta, prefixes: Record<string, string>, endpoint: string) => {
  const generator = new Generator();
  const parser = new Parser({ prefixes });
  const prefixesString = Object.entries(prefixes)
    .map(([alias, namespace]) => `prefix ${alias}: <${namespace}>`)
    .join("\n");

  const allDataTypes: Record<string, Record<string, string[]>> = {};
  for (const [groupingName, classData] of Object.entries(meta)) {
    const fragmentWheres = classData.triplePatterns.flatMap((triplePattern) => {
      let triplePatternRewritten = triplePattern;
      const finalQuery = `${prefixesString} select * where { ${triplePatternRewritten} }`;
      const parsedQuery = parser.parse(finalQuery) as SelectQuery;
      return parsedQuery.where;
    });

    const mergedQuery = parser.parse(`${prefixesString} select * where {}`) as SelectQuery;
    const binds = Object.entries(classData.variables)
      .map(([variable]) => {
        if (variable === groupingName) return undefined;
        return {
          type: "bind" as const,
          variable: dataFactory.variable(variable + "Datatype"),
          expression: {
            type: "operation" as const,
            operator: "datatype",
            args: [dataFactory.variable(variable)],
          },
        };
      })
      .filter(nonNullable);
    mergedQuery.where = [...fragmentWheres.filter(nonNullable), ...binds.filter(nonNullable)];
    mergedQuery.variables = Object.entries(classData.variables).map(([variable]) =>
      dataFactory.variable(variable + "Datatype")
    );
    mergedQuery.group = Object.entries(classData.variables).map(([variable]) => ({
      expression: dataFactory.variable(variable + "Datatype"),
    }));

    const query = generator.stringify(mergedQuery);
    const url = new URL(endpoint);
    url.searchParams.set("query", query);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
    });

    const datatypes: Record<string, string[]> = {};
    const json: any = await response.json();
    for (const binding of json.results.bindings) {
      for (const [key, datatype] of Object.entries(binding)) {
        const cleanedKey = key.replace("Datatype", "");
        if (!datatypes[cleanedKey]) datatypes[cleanedKey] = [];
        const dataTypeIri = (datatype as any).value as string;
        if (!datatypes[cleanedKey].includes(dataTypeIri)) datatypes[cleanedKey].push(dataTypeIri);
      }
    }

    allDataTypes[groupingName] = datatypes;
  }

  return allDataTypes;
};

const sparkGenerate = async ({ prefixes = {}, endpoint, discoverDataTypes }: Source) => {
  const meta = await getTripleMeta('./src', prefixes, endpoint);
  const dataTypes = discoverDataTypes ? await getDataTypes(meta, prefixes, endpoint) : {};

  for (const [groupingName, groupDataTypes] of Object.entries(dataTypes)) {
    for (const [variable, variableDataTypes] of Object.entries(groupDataTypes)) {
      meta[groupingName].variables[variable].dataTypes = variableDataTypes.map(mapType)
    }
  }
  
  const output = [
    createClassTypes(meta, dataTypes),
    createFragmentType(meta),
    createClassQueries(meta, prefixes),
    createClassMeta(meta),
  ].join("\n\n");

  await fs.promises.writeFile(`${process.cwd()}/.spark/generated.ts`, output, "utf8");
};

export default function SparkCompiler({ sources }: Options) {
  if (Object.keys(sources).length > 1) throw new Error('Multiple sources not yet supported')

  return {
    name: "spark-compiler",

    async buildStart() {
      for (const source of Object.values(sources)) {
        await sparkGenerate(source);
      }
    },

    async handleHotUpdate({ file }: { file: string }) {
      if (file.includes("spark-generated")) return;

      for (const source of Object.values(sources)) {
        await sparkGenerate(source);
      }
    },
  };
}
