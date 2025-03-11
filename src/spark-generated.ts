export type Pokemon = {
  pokemon: string;
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
    SELECT * WHERE {
      ?pokemon rdfs:label ?label.
      ?pokemon foaf:depiction ?image;
        schema:audio ?audio.
      ?pokemon rdf:type <https://triplydb.com/academy/pokemon/vocab/Pokémon>.
    }
    #orderBy
    #limit
    #offset`,
}

export const classMeta = {
  pokemon: {
    pokemon: false,
    label: false,
    image: false,
    audio: true,
  }
}