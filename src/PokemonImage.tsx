import type { Pokemon } from "./spark-generated";
import { useSpark } from "./spark.js";

export default function PokemonImage({ image }: Pokemon) {
  useSpark(`$pokemon 
    foaf:depiction $image ;
    schema:audio ?audio`);
  return <img src={image} />;
}
