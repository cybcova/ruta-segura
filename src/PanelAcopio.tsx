// src/PanelAcopio.tsx
import { useEffect, useMemo, useState } from "react";

type VwRow = {
  uuid: string;
  qr_estatus: string | null;
  lista_estatus: string | null;
  lista_texto: string | null;
};

type KitRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  lista_viveres: string | null;
  estatus: string | null;
  confirmacion_recepcion?: boolean | null;
  observaciones?: string | null;
  mensaje?: string | null;
  ubicacion?: string | null;
  lat?: number | null;
  lng?: number | null;
  categoria?: string | null;
};

const tailId = (id?: string | null) => {
  if (!id) return "-";
  const parts = id.split("-");
  return parts[parts.length - 1] || id;
};

const TEXT_EN_COLA = `aceite 1L x 40
antiseptico 250ml x 1
arroz 1kg x 48
atun lata x 198
biberon x 0
bolsas basura rollo x 50
cafe soluble 200g x 6
calcetas pares x 12
cepillo dental x 0
cloro 1L x 6
colchonetas x 17
cubetas x 1
curitas caja x 5
detergente 1kg x 0
frazada x 43
frijol 1kg x 48
galletas paquete x 52
gasas paquete x 3
guantes pares x 5
impermeable x 0
jabon barra x 100
kit botiquin basico x 0
kit escolar x 0
leche uht 1L x 22
lenteja 1kg x 4
mermelada 330g x 6
pasto (papel) higienico rollo x 88
pasta 500g x 82
pasta dental 75ml x 0
pañales paquete peq x 4
rastrillos x 50
ropa abrigo lote x 1
sardina lata x 72
sal 1kg x 0
shampoo 250ml x 52
toallas humedas paquete x 4
toallas mano x 60
toallas sanitarias paquete x 42
trapeadores x 5
escobas x 5
agua botella 1.5L x 8
leche uht 1L x 22`;

export default function PanelAcopio() {
  const [tab, setTab] = useState<"vw" | "kits" | "cola">("vw");

  const [vwData, setVwData] = useState<VwRow[]>([]);
  const [vwStatus, setVwStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [vwMsg, setVwMsg] = useState("");

  const [kitsData, setKitsData] = useState<KitRow[]>([]);
  const [kitsStatus, setKitsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [kitsMsg, setKitsMsg] = useState("");

  const cola = useMemo(() => {
    return TEXT_EN_COLA.split(/\r?\n/).map((line) => {
      const m = line.match(/^(.+?)\s+x\s+(\d+)\s*$/i);
      return {
        item: m ? m[1].trim() : line.trim(),
        cantidad: m ? Number(m[2]) : null,
      };
    });
  }, []);

  const fetchVW = async () => {
    try {
      setVwStatus("loading");
      setVwMsg("");
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      const url = `${base}/rest/v1/vw_codigos_qr_con_listas`;
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
      const data: VwRow[] = await resp.json();
      setVwData(Array.isArray(data) ? data : []);
      setVwStatus("ok");
    } catch (err) {
      setVwStatus("error");
      setVwMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchKits = async () => {
    try {
      setKitsStatus("loading");
      setKitsMsg("");
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      const url = `${base}/rest/v1/kits_entregados?select=*`;
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
      const data: KitRow[] = await resp.json();
      setKitsData(Array.isArray(data) ? data : []);
      setKitsStatus("ok");
    } catch (err) {
      setKitsStatus("error");
      setKitsMsg(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    // carga ambos al entrar
    fetchVW();
    fetchKits();
  }, []);

  // Agrupa kits por categoria
  const kitsPorCategoria = useMemo(() => {
    const map = new Map<string, KitRow[]>();
    for (const k of kitsData) {
      const cat = (k.categoria || "Sin categoría").trim();
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(k);
    }
    // ordenar cada grupo por created_at desc si existe
    for (const [cat, arr] of map.entries()) {
      arr.sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      map.set(cat, arr);
    }
    // ordenar categorías por nombre asc
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kitsData]);

  const TabButton = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #000",
        background: tab === id ? "#000" : "#000",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Panel de Acopio</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <TabButton id="vw" label="Códigos QR + Listas" />
        <TabButton id="kits" label="Kits entregados" />
        <TabButton id="cola" label="En cola" />
      </div>

      {/* TAB 1: Vista vw_codigos_qr_con_listas */}
      {tab === "vw" && (
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <strong>Vista:</strong> <code>vw_codigos_qr_con_listas</code>
            <button onClick={fetchVW} style={{ marginLeft: "auto", padding: "6px 10px" }}>
              Recargar
            </button>
          </div>

          {vwStatus === "loading" && <p>Cargando…</p>}
          {vwStatus === "error" && <p style={{ color: "crimson" }}>{vwMsg}</p>}

          {vwStatus === "ok" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>UUID (tail)</th>
                    <th style={th}>QR estatus</th>
                    <th style={th}>Lista estatus</th>
                    <th style={th}>Lista</th>
                  </tr>
                </thead>
                <tbody>
                  {vwData.map((r, i) => (
                    <tr key={i}>
                      <td style={tdMono}>{tailId(r.uuid)}</td>
                      <td style={td}>{r.qr_estatus ?? "-"}</td>
                      <td style={td}>{r.lista_estatus ?? "-"}</td>
                      <td style={{ ...td, whiteSpace: "pre-wrap" }}>
                        {r.lista_texto ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {vwData.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>
                        Sin datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Kits entregados por categoría */}
      {tab === "kits" && (
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <strong>Tabla:</strong> <code>kits_entregados</code>
            <button onClick={fetchKits} style={{ marginLeft: "auto", padding: "6px 10px" }}>
              Recargar
            </button>
          </div>

          {kitsStatus === "loading" && <p>Cargando…</p>}
          {kitsStatus === "error" && <p style={{ color: "crimson" }}>{kitsMsg}</p>}

          {kitsStatus === "ok" && (
            <div style={{ display: "grid", gap: 12 }}>
              {kitsPorCategoria.map(([categoria, filas]) => (
                <details key={categoria} >
                  <summary style={summary}>
                    <span style={{ fontWeight: 700 }}>{categoria}</span>
                    <span style={{ color: "#666" }}> ({filas.length})</span>
                  </summary>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={th}>ID (tail)</th>
                          <th style={th}>Estatus</th>
                          <th style={th}>Confirmado</th>
                          <th style={th}>Lista víveres</th>
                          <th style={th}>Ubicación</th>
                          {/*<th style={th}>Coordenadas</th>*/}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((k) => (
                          <tr key={k.id}>
                            <td style={tdMono}>{tailId(k.id)}</td>
                            <td style={td}>{k.estatus ?? "-"}</td>
                            <td style={td}>
                              {k.confirmacion_recepcion ? "Sí" : "No"}
                            </td>
                            <td style={{ ...td, whiteSpace: "pre-wrap" }}>
                              {k.lista_viveres ?? "—"}
                            </td>
                            <td style={{ ...td, whiteSpace: "pre-wrap" }}>
                              {k.ubicacion ?? "—"}
                            </td>
                            {/*<td style={td}>
                              {k.lat != null && k.lng != null
                                ? `${k.lat.toFixed(6)}, ${k.lng.toFixed(6)}`
                                : "—"}
                            </td>*/}
                          </tr>
                        ))}
                        {filas.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ ...td, textAlign: "center", color: "#666" }}>
                              Sin registros.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
              {kitsPorCategoria.length === 0 && (
                <p style={{ color: "#666" }}>Sin datos.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: En cola (texto fijo) */}
      {tab === "cola" && (
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>En cola</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Ítem</th>
                  <th style={th}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {cola.map((r, i) => (
                  <tr key={i}>
                    <td style={td}>{r.item}</td>
                    <td style={{ ...td, textAlign: "right", width: 120 }}>
                      {r.cantidad ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  background: "#000",
  borderBottom: "1px solid #000",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #000",
  verticalAlign: "top",
};

const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const summary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  background: "#000",
  border: "1px solid #000",
  borderRadius: 8,
  cursor: "pointer",
};
