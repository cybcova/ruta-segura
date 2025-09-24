import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type InsertPayload = {
  codigo_qr_id: string;
  estatus: string;
  lista: string;
};

export default function RegistroLista() {
  const loc = useLocation();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const uuid = params.get("uuid");

  const [lista, setLista] = useState("");
  const [estatus, setEstatus] = useState<"registrada" | "pendiente" | "cancelada">("registrada");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    setMsg("");
    setStatus("idle");
  }, [uuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) {
      setStatus("error");
      setMsg("Falta el parámetro uuid en la URL.");
      return;
    }
    if (!lista.trim()) {
      setStatus("error");
      setMsg("La lista no puede estar vacía.");
      return;
    }

    setStatus("loading");
    setMsg("");

    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      const url = `${base}/rest/v1/listas_acopio`;

      const payload: InsertPayload = {
        codigo_qr_id: uuid,
        estatus : "registrada",
        lista: lista.trim(),
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          // Evita depender de SELECT post-insert si RLS no lo permite:
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 201) {
        setStatus("ok");
        setMsg("Registro guardado correctamente.");
        // Opcional: limpia el textarea
        // setLista("");
      } else {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt}`);
      }
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Registro de Lista</h1>

      {uuid ? (
        <p>
          UUID recibido: <code style={{ wordBreak: "break-all" }}>{uuid}</code>
        </p>
      ) : (
        <p style={{ color: "crimson" }}>No se recibió ningún UUID</p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Lista (separada por comas):</span>
          <textarea
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            placeholder="leche, pan, huevos"
            rows={5}
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        {/* 
        <label style={{ display: "grid", gap: 6 }}>
        <span>Estatus:</span>
        <select
            value={estatus}
            onChange={(e) => setEstatus(e.target.value as any)}
            style={{ padding: 8, fontSize: 16, maxWidth: 240 }}
        >
            <option value="registrada">registrada</option>
            <option value="pendiente">pendiente</option>
            <option value="cancelada">cancelada</option>
        </select>
        </label>
        */}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={!uuid || status === "loading"}
            style={{ padding: "10px 14px", fontSize: 16 }}
          >
            {status === "loading" ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLista("");
              setEstatus("registrada");
              setStatus("idle");
              setMsg("");
            }}
            disabled={status === "loading"}
            style={{ padding: "10px 14px", fontSize: 16 }}
          >
            Limpiar
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
