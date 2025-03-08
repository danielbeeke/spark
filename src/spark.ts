import { Spark } from "./lib/Spark";

export const { useSpark } = Spark({
  endpoint: `https://api.triplydb.com/datasets/academy/pokemon/services/jena/sparql`,
  prefixes: {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    vocab: "https://triplydb.com/academy/pokemon/vocab/",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  },
});
