// TODO in the future this file be can be generated automatically.

export type Pokemon = { pokemon: string; label: string };

export type triplePatternTypes = {
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
  [`$pokemon rdfs:label ?label`]: Pokemon;
};

export const triplePatternsGrouped = {
  pokemon: `
    prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    prefix vocab: <https://triplydb.com/academy/pokemon/vocab/>
    prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    select * where {
      $pokemon a vocab:Pokémon.
      $pokemon rdfs:label ?label.
    }
    #orderBy
    #limit
    #offset
  `,
}