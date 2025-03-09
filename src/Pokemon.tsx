import type { Pokemon } from "./spark-generated"
import { useSpark } from "./spark"

export default function Pokemon ({ label, pokemon }: Pokemon) {
    useSpark('$pokemon rdfs:label ?label')

    return <div>
        <h2>{label}</h2>
        <em>{pokemon}</em>
    </div>
}