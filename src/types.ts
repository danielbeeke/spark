type Pokemon = { pokemon: string; label: string };

export type queries = {
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
  [`$pokemon rdfs:label ?label`]: Pokemon;
};
