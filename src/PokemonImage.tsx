import { useSpark } from "@lib/Spark.js";
import type { Spark } from "@lib/Spark.js";

export default function PokemonImage({ image }: Spark<'pokemon'>) {
  useSpark(`$pokemon foaf:depiction $image`);
  return <img style={{maxWidth: 100, maxHeight: 100}} src={image} />;
}
