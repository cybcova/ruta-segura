// src/main.tsx
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import App from "./App";
import Test from "./Test";
import QRFactory from "./QRFactory";
import ConsultaQR from "./ConsultaQR";
import AcopioEscaneo from "./AcopioEscaneo";
import RegistroLista from "./RegistroLista";
import KitsRegistro from "./KitsRegistro";
import RecepcionKit from "./RecepcionKit";
import HeaderMenu from "./HeaderMenu";

import "./index.css";

const container = document.getElementById("root") as HTMLElement;

function LayoutWithConditionalHeader() {
  const location = useLocation();
  const showHeaderOn = new Set([
    "/QRFactory",
    "/acopioEscaneo",
    "/kitsRegistro",
    "/",
  ]);

  const showHeader = showHeaderOn.has(location.pathname);

  return (
    <>
      { showHeader && <HeaderMenu /> }
      <div style={{ maxWidth: 1024, margin: "0 auto", padding: "12px 16px" }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/test" element={<Test />} />
          <Route path="/QRFactory" element={<QRFactory />} />
          <Route path="/ConsultaQR" element={<ConsultaQR />} />
          <Route path="/acopioEscaneo" element={<AcopioEscaneo />} />
          <Route path="/registroLista" element={<RegistroLista />} />
          <Route path="/kitsRegistro" element={<KitsRegistro />} />
          <Route path="/recepcionKit" element={<RecepcionKit />} />
        </Routes>
      </div>
    </>
  );
}

createRoot(container).render(
  <HashRouter>
    <LayoutWithConditionalHeader />
  </HashRouter>
);
