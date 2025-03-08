import { spark } from "./spark";

export default spark(`$pokemon rdfs:label ?label`, ({ label }) => (
  <h1>{label}</h1>
));
