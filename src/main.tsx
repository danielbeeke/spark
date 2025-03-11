import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PokemonList from "./PokemonList";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ display: "flex" }}>
      <PokemonList />
      <div>
        <h1>How does it work?</h1>
        <h2>useSpark</h2>
        <p>A hook that has multiple usages:</p>
        <h3>Requiring one or multiple SPARQL triple patterns.</h3>
        <p>You can write what you normally write between the curly brackets of select * where {`{}`}</p>
        <h3>Returning items or one item</h3>
        <p>The return type of the hook is: {`{ items: Item[], item: Item }`}</p>
      </div>
    </div>
  </StrictMode>
);
