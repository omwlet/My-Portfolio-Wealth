import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PortfolioProvider } from "./context/PortfolioContext";
import { UIProvider } from "./context/UIContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UIProvider>
      <CurrencyProvider>
        <PortfolioProvider>
          <App />
        </PortfolioProvider>
      </CurrencyProvider>
    </UIProvider>
  </React.StrictMode>
);
