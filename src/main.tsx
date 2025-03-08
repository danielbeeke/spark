import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PokemonList from "./PokemonList";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PokemonList />
  </StrictMode>
);
