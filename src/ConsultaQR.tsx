// src/ConsultaQR.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type QRRow = {
  uuid: string;
  qr_estatus: string;
  qr_created_at: string;
  qr_updated_at: string;
  lista_texto: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; // UUID v4

function getSearchParamsFromLocation(loc: ReturnType<typeof useLocation>): URLSearchParams {
  // 1) Query normal (?uuid=...) si no usas hash routing
  if (loc.search) return new URLSearchParams(loc.search);
  // 2) Hash routing (#/consulta?uuid=...)
  const hash = loc.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex !== -1) return new URLSearchParams(hash.slice(qIndex + 1));
  return new URLSearchParams();
}

export default function ConsultaQR() {
  const location = useLocation();

  const uuid = useMemo(() => {
    const params = getSearchParamsFromLocation(location);
    return params.get("uuid") ?? params.get("m");
  }, [location]);

  const [row, setRow] = useState<QRRow | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "empty" | "error">("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      if (!uuid) {
        setStatus("empty");
        setRow(null);
        return;
      }
      if (!UUID_RE.test(uuid)) {
        setStatus("error");
        setError("UUID inválido.");
        setRow(null);
        return;
      }

      setStatus("loading");
      setError("");
      setRow(null);

      try {
        const url =
          `${base}/rest/v1/vw_codigos_qr_con_listas` +
          `?uuid=eq.${encodeURIComponent(uuid)}`;// +
          //`&select=uuid,estatus,created_at,updated_at`;

        const resp = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${txt}`);
        }

        const data: QRRow[] = await resp.json();

        if (!Array.isArray(data) || data.length === 0) {
          setStatus("empty");
          setRow(null);
        } else {
          setRow(data[0]);
          setStatus("ok");
        }
      } catch (e: unknown) {
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    fetchData();
  }, [uuid]);

  const format = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "24px auto", padding: 16 }}>
      <h1>Consulta de código QR</h1>
      <p style={{ marginTop: -8, color: "#666" }}>
        Usa <code>?uuid=</code> o <code>?m=</code> en la URL. Ej.:{" "}
        <code>http://localhost:5173/#/consulta?uuid=4bd8…f559</code>
      </p>

      {status === "idle" && <p>Listo para consultar…</p>}
      {status === "loading" && <p>Cargando…</p>}
      {status === "error" && (
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {error}</p>
      )}
      {status === "empty" && <p>No se encontró el UUID solicitado.</p>}
      {status === "ok" && row && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>UUID:</strong>
            <div style={{ wordBreak: "break-all" }}>{row.uuid}</div>
          </div>
          <div>
            <strong>Estatus:</strong>{" "}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 12,
                background: row.qr_estatus?.toLowerCase() === "activo" ? "#000" : "#000",
                border: "1px solid #ddd",
              }}
            >
              {row.qr_estatus ?? "-"}
            </span>
          </div>
          <div>
            <strong>Creado:</strong> {format(row.qr_created_at)}
          </div>
          <div>
            <strong>Actualizado:</strong> {format(row.qr_updated_at)}
          </div>
            {row.lista_texto != null ? (
            <div>
                <strong>Lista de Viveres:</strong> {row.lista_texto}
            </div>
            ) : null}
        </div>
      )}
    </div>
  );
}
