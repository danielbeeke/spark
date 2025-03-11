export type Pokemon = {
  iri: string;
  label: string;
  image: string;
}

export type fragmentTypes = {
  [`$pokemon rdfs:label $label.`]: Pokemon;
  [`$pokemon foaf:depiction $image`]: Pokemon;
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
};

export const queries = {
  pokemon:`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?pokemon ?label ?image WHERE {
      ?pokemon rdfs:label ?label.
      ?pokemon foaf:depiction ?image.
      ?pokemon rdf:type <https://triplydb.com/academy/pokemon/vocab/Pokémon>.
    }
    GROUP BY ?pokemon ?label ?image
    #orderBy
    #limit
    #offset`,
}

export const classMeta = {
  "pokemon": {
    "triplePatterns": [
      "$pokemon rdfs:label $label.",
      "$pokemon foaf:depiction $image",
      "$pokemon rdf:type vocab:Pokémon"
    ],
    "variables": {
      "pokemon": false,
      "label": false,
      "image": false
    }
  }
}