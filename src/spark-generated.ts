export type Pokemon = {
  iri: string;
  label: string;
  sinnohNumber?: string;
  image: string;
}

export type fragmentTypes = {
  [`
    $pokemon rdfs:label $label .
    optional { $pokemon vocab:sinnohNumber $sinnohNumber }
  `]: Pokemon;
  [`$pokemon foaf:depiction $image`]: Pokemon;
  [`$pokemon rdf:type vocab:Pokémon`]: Pokemon;
};

export const queries = {
  pokemon:`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vocab: <https://triplydb.com/academy/pokemon/vocab/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?pokemon ?label ?sinnohNumber ?image WHERE {
      ?pokemon rdfs:label ?label.
      OPTIONAL { ?pokemon vocab:sinnohNumber ?sinnohNumber. }
      ?pokemon foaf:depiction ?image.
      ?pokemon rdf:type <https://triplydb.com/academy/pokemon/vocab/Pokémon>.
    }
    GROUP BY ?pokemon ?label ?sinnohNumber ?image
    #orderBy
    #limit
    #offset`,
}

export const classMeta = {
  "pokemon": {
    "triplePatterns": [
      "\n    $pokemon rdfs:label $label .\n    optional { $pokemon vocab:sinnohNumber $sinnohNumber }\n  ",
      "$pokemon foaf:depiction $image",
      "$pokemon rdf:type vocab:Pokémon"
    ],
    "variables": {
      "pokemon": {
        "plural": false,
        "optional": false
      },
      "label": {
        "plural": false,
        "optional": false
      },
      "sinnohNumber": {
        "plural": false,
        "optional": true
      },
      "image": {
        "plural": false,
        "optional": false
      }
    }
  }
}