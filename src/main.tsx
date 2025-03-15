import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PokemonList from "./PokemonList";
import readme from "../README.md?raw";
import Markdown from "react-markdown";

const [intro, howTo] = readme.split("---").map((text) => text.trim());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="container">
      <div className="row">
        <div className="col-6 p-3">
          <Markdown>{intro}</Markdown>

          <iframe
            className="youtube-embed"
            style={{ aspectRatio: 16 / 9, width: "100%", border: "1px solid gray" }}
            src="https://www.youtube.com/embed/ZNgbQti7tyo?si=l9TbkCBdsuEcjTIz"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
          <br />
          <br />
          
          <details>
            <summary>Installation & usage</summary>
            <br />
            <Markdown>{howTo}</Markdown>
          </details>
        </div>
        <PokemonList />
      </div>
    </div>
  </StrictMode>
);