import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PortfolioProvider } from "./context/PortfolioContext";
import { UIProvider } from "./context/UIContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UIProvider>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </UIProvider>
  </React.StrictMode>
);
