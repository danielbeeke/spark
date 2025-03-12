import type { Pokemon } from "./spark-generated";
import { useSpark } from "./spark.js";

export default function PokemonImage({ image }: Pokemon) {
  useSpark(`$pokemon foaf:depiction $image`);
  return <img style={{maxWidth: 100, maxHeight: 100}} src={image} />;
}
