import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Test from "./Test";
import QRFactory from "./QRFactory";
import "./index.css";

const container = document.getElementById("root") as HTMLElement;

createRoot(container).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/test" element={<Test />} />
      <Route path="/QRFactory" element={<QRFactory />} />
    </Routes>
  </HashRouter>
);
