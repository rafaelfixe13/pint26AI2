import "bootstrap/dist/css/bootstrap.min.css"; // ← 1º sempre
import "./index.css";                           // ← 2º os teus estilos
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);