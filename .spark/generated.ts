export type Pokemon = {
  iri: string;
  label: string;
  sinnohNumber?: number;
  image: string;
  type: Array<string>;
}
export type Type = {
  iri: string;
  label: string;
}

export type fragmentTypes = {
  [`
    $pokemon rdfs:label $label .
    optional { $pokemon vocab:sinnohNumber $sinnohNumber }
  `]: Pokemon;
  [`$pokemon foaf:depiction $image`]: Pokemon;
  [`
      $pokemon rdf:type vocab:Pokémon .
      $pokemon vocab:type ?type .
    `]: Pokemon;
  pokemon: Pokemon;
  [`
    $type rdfs:label $label . 
    filter(strstarts(str($type), str(id:)))
  `]: Type;
  type: Type;
};

export const queries = {
  pokemon:`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vocab: <https://triplydb.com/academy/pokemon/vocab/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?pokemon ?label ?sinnohNumber ?image (GROUP_CONCAT(?_type; SEPARATOR = "|||") AS ?type) WHERE {
      ?pokemon rdfs:label ?label.
      OPTIONAL { ?pokemon vocab:sinnohNumber ?sinnohNumber. }
      ?pokemon foaf:depiction ?image.
      ?pokemon rdf:type <https://triplydb.com/academy/pokemon/vocab/Pokémon>;
        vocab:type ?_type.
    #additionSparql
    }
    GROUP BY ?pokemon ?label ?sinnohNumber ?image
    #orderBy
    #limit
    #offset`,  type:`
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?type ?label WHERE {
      ?type rdfs:label ?label.
      FILTER(STRSTARTS(STR(?type), STR(<https://triplydb.com/academy/pokemon/id/type/>)))
    #additionSparql
    }
    GROUP BY ?type ?label
    #orderBy
    #limit
    #offset`,
}

export const classMeta = {
  "pokemon": {
    "endpoint": "https://api.triplydb.com/datasets/academy/pokemon/services/jena/sparql",
    "triplePatterns": [
      "\n    $pokemon rdfs:label $label .\n    optional { $pokemon vocab:sinnohNumber $sinnohNumber }\n  ",
      "$pokemon foaf:depiction $image",
      "\n      $pokemon rdf:type vocab:Pokémon .\n      $pokemon vocab:type ?type .\n    "
    ],
    "variables": {
      "pokemon": {
        "plural": false,
        "optional": false,
        "dataTypes": []
      },
      "label": {
        "plural": false,
        "optional": false,
        "dataTypes": [
          "string"
        ]
      },
      "sinnohNumber": {
        "plural": false,
        "optional": true,
        "dataTypes": [
          "number"
        ]
      },
      "image": {
        "plural": false,
        "optional": false,
        "dataTypes": [
          "string"
        ]
      },
      "type": {
        "plural": true,
        "optional": false,
        "dataTypes": []
      }
    }
  },
  "type": {
    "endpoint": "https://api.triplydb.com/datasets/academy/pokemon/services/jena/sparql",
    "triplePatterns": [
      "\n    $type rdfs:label $label . \n    filter(strstarts(str($type), str(id:)))\n  "
    ],
    "variables": {
      "type": {
        "plural": false,
        "optional": false,
        "dataTypes": []
      },
      "label": {
        "plural": false,
        "optional": false,
        "dataTypes": [
          "string"
        ]
      }
    }
  }
}