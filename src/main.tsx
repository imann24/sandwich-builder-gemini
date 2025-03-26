// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// You might want a global CSS reset or base styles here
// import './index.css'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
