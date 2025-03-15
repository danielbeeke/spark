import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import SparkCompiler from "./lib/SparkCompiler";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    SparkCompiler({
      sources: {
        default: {
          endpoint: `https://api.triplydb.com/datasets/academy/pokemon/services/jena/sparql`,
          prefixes: {
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            vocab: "https://triplydb.com/academy/pokemon/vocab/",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            foaf: "http://xmlns.com/foaf/0.1/",
            schema: "http://schema.org/",
            id: "https://triplydb.com/academy/pokemon/id/type/",
          },
          discoverDataTypes: true,
        },
      },
    }),
  ],
  build: {
    outDir: "docs",
  },
  base: "https://danielbeeke.nl/spark/",
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "./lib"),
    },
  },
});
