import { useState } from "react";
import { NavLink } from "react-router-dom";

const HEADER_H = 56; // alto fijo del header

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/QRFactory", text: "QR Factory" },
    { to: "/acopioEscaneo", text: "Escaneo" },
    { to: "/kitsRegistro", text: "Kits" },
    { to: "/", text: "Panel" },
  ];

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_H,
          zIndex: 1000,
          background: "rgba(20,20,20,.95)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #333",
        }}
      >
        <div
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            height: "100%",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#eee",
          }}
        >
          <strong>Ruta Segura</strong>
          <button
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={{
              border: "1px solid #555",
              background: "transparent",
              color: "#eee",
              padding: "6px 10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ☰ Menú
          </button>
        </div>

        {/* panel desplegable absoluto */}
        <nav
          style={{
            position: "absolute",
            top: HEADER_H,
            left: 0,
            right: 0,
            maxHeight: open ? 320 : 0,
            overflow: "hidden",
            transition: "max-height 220ms ease",
            background: "rgba(20,20,20,.98)",
            borderBottom: open ? "1px solid #333" : "1px solid transparent",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "8px 12px 12px",
              display: "grid",
              gap: 6,
              maxWidth: 1024,
              marginInline: "auto",
            }}
          >
            {items.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: isActive ? "#8ab4f8" : "#ddd",
                    background: isActive ? "rgba(138,180,248,0.08)" : "transparent",
                    border: "1px solid #333",
                  })}
                >
                  {it.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Espaciador para que el contenido no quede bajo el header */}
      <div style={{ height: HEADER_H }} />
    </>
  );
}
