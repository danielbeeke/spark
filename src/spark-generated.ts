// TODO in the future this file be can be generated automatically.

export type Pokemon = { pokemon: string; label: string };

export type triplyPatternTypes = {
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
  [`$pokemon rdfs:label ?label`]: Pokemon;
};

export const triplyPatternsGrouped = {
  pokemon: [`$pokemon rdf:type vocab:Pokémon`, `$pokemon rdfs:label ?label`],
} as const;