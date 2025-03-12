import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PokemonList from "./PokemonList";
import readme from "../README.md?raw";
import Markdown from 'react-markdown'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="container">
      <div className="row">
        <div className="col-5 p-3">
          <Markdown>{readme}</Markdown>
        </div>
        <PokemonList />
      </div>
    </div>
  </StrictMode>
);
