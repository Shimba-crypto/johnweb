import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { installAuthFetch } from "./lib/apiFetch";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

installAuthFetch();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        let reloaded = false;
        nw.addEventListener("statechange", () => {
          if (nw.state === "activated" && !reloaded && navigator.serviceWorker.controller) {
            reloaded = true;
            localStorage.setItem("jwVersionBump", Date.now().toString());
            window.location.reload();
          }
        });
      });
    }).catch((err) => console.log("SW registration failed:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
