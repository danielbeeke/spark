export type Pokemon = {
  pokemon: string;
  label: string;
  image: string;
}

export type triplePatternTypes = {
  [`$pokemon rdfs:label ?label.`]: Pokemon;
  [`$pokemon foaf:depiction ?image`]: Pokemon;
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
};

export const triplePatternsGrouped = {
  pokemon:`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT * WHERE {
      ?pokemon rdfs:label ?label.
      ?pokemon foaf:depiction ?image.
      ?pokemon rdf:type <https://triplydb.com/academy/pokemon/vocab/Pokémon>.
    }
    #orderBy
    #limit
    #offset`,
}