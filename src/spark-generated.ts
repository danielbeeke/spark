export type Pokemon = {
  iri: string;
  label: string;
  image: string;
  audio: string[];
}

export type fragmentTypes = {
  [`$pokemon rdfs:label $label.`]: Pokemon;
  [`$pokemon 
    foaf:depiction $image ;
    schema:audio ?audio`]: Pokemon;
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
};

export const queries = {
  pokemon:`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX schema: <http://schema.org/>
    SELECT ?pokemon ?label ?image (GROUP_CONCAT(?_audio; SEPARATOR = "|||") AS ?audio) WHERE {
      ?pokemon rdfs:label ?label.
      ?pokemon foaf:depiction ?image;
        schema:audio ?_audio.
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
      "$pokemon \n    foaf:depiction $image ;\n    schema:audio ?audio",
      "$pokemon rdf:type vocab:Pokémon"
    ],
    "variables": {
      "pokemon": false,
      "label": false,
      "image": false,
      "audio": true
    }
  }
}