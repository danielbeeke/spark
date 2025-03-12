import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PokemonList from "./PokemonList";
import readme from "../README.md?raw";
import Markdown from 'react-markdown'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ display: "flex" }}>
      <PokemonList />
      <div>
        <Markdown>{readme}</Markdown>
      </div>
    </div>
  </StrictMode>
);
