import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Test from "./Test";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element "#root" not found. Asegúrate de tener <div id="root"></div> en index.html');
}

createRoot(container).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/test" element={<Test />} />
    </Routes>
  </BrowserRouter>
);
