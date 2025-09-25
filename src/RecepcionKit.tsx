import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RecepcionKit() {
  const loc = useLocation();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  // Limpia posibles espacios en uuid de la URL
  const uuid = (params.get("uuid") || "").trim();

  const [recibioTodo, setRecibioTodo] = useState<"si" | "no">("si");
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const getUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setMsg("Este navegador no soporta geolocalización.");
      setStatus("error");
      return;
    }
    setMsg("");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setStatus("idle");
      },
      (err) => {
        setStatus("error");
        setMsg(`No se pudo obtener ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!uuid) {
      setStatus("error");
      setMsg("Falta el parámetro uuid en la URL.");
      return;
    }

    // Estatus según selección:
    // Asunción: "entrega completa" si recibió todo, "entrega parcial" si NO.
    const estatus = recibioTodo === "si" ? "entrega completa" : "entrega parcial";

    // Observaciones obligatorio si NO recibió todo
    if (recibioTodo === "no" && !observaciones.trim()) {
      setStatus("error");
      setMsg("Agrega observaciones si no se recibió todo.");
      return;
    }

    setStatus("loading");

    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      const url = `${base}/rest/v1/kits_entregados?id=eq.${encodeURIComponent(uuid)}`;

      const body: Record<string, any> = {
        estatus,
        confirmacion_recepcion: true,
        observaciones: observaciones.trim() || "Sin observaciones",
        mensaje: mensaje.trim() || null,
        ubicacion: direccion.trim() || null,
        lat: lat ?? null,
        lng: lng ?? null,
      };

      const resp = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt}`);
      }

      setStatus("ok");
      setMsg("¡Gracias! Registro actualizado correctamente.");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Recepción de Kit</h1>
      {uuid ? (
        <p>
          ID del kit: <code style={{ wordBreak: "break-all" }}>{uuid}</code>
        </p>
      ) : (
        <p style={{ color: "crimson" }}>No se recibió ningún UUID</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <legend>Confirmación</legend>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              name="recibioTodo"
              value="si"
              checked={recibioTodo === "si"}
              onChange={() => setRecibioTodo("si")}
            />
            <span>Recibí el kit con <strong>todo</strong> lo indicado en la lista</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <input
              type="radio"
              name="recibioTodo"
              value="no"
              checked={recibioTodo === "no"}
              onChange={() => setRecibioTodo("no")}
            />
            <span>Recibí el kit de forma <strong>incompleta</strong></span>
          </label>

          {recibioTodo === "no" && (
            <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
              <span>Observaciones (obligatorio si faltó algo):</span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                placeholder="Ej. Faltó 1 botella de agua."
                style={{ padding: 8, fontSize: 16 }}
              />
            </label>
          )}
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <legend>Ubicación</legend>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={getUbicacion} style={{ padding: "8px 12px" }}>
              Obtener mi ubicación
            </button>
            <div style={{ fontSize: 12, color: "#555" }}>
              {lat != null && lng != null
                ? `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
                : "Aún sin coordenadas"}
            </div>
          </div>

          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span>Dirección (opcional, puedes escribirla manualmente):</span>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Estenógrafos 12, Pachuca, Hgo."
              style={{ padding: 8, fontSize: 16 }}
            />
          </label>
        </fieldset>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Mensaje para los donantes (opcional):</span>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            placeholder="Ej. ¡Gracias por su apoyo!"
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={!uuid || status === "loading"}
            style={{ padding: "10px 14px", fontSize: 16 }}
          >
            {status === "loading" ? "Enviando..." : "Enviar confirmación"}
          </button>
        </div>
      </form>

      {msg && (
        <p
          style={{
            marginTop: 12,
            color: status === "error" ? "crimson" : "green",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
