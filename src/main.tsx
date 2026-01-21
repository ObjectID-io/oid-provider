import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./state/AppState";
import ObjectId from "./sdk/ObjectId";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error('Missing <div id="root"></div> in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <ObjectId>
          <App />
        </ObjectId>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
);
