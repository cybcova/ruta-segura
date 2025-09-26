import { useState } from "react";
import QRCode from "qrcode";

export default function QRFactory() {
  const [items, setItems] = useState<Item[]>([]);
  const [count, setCount] = useState(1);
  const route = "ConsultaQR"; // tu ruta hash: #/test

  const makeUUID = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const makeUrl = (id: string) =>
    `${window.location.origin}/#/${route}?uuid=${encodeURIComponent(id)}`;

const saveInSupabase = async (uuid: string) => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/codigos_qr`;
  const anon = import.meta.env.VITE_SUPABASE_ANON;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      // sin representation para no requerir SELECT
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ uuid, estatus: "Pendiente" }),
  });

  if (!resp.ok) throw new Error(await resp.text());
  // Si llega aquí y es 201, lo consideramos guardado:
  return { ok: resp.status === 201, uuid };
};

type Item = { id: string; url: string; dataUrl: string; saved: boolean };

const createOne = async () => {
  const id = makeUUID();
  const url = makeUrl(id);
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 256 });

  const { ok } = await saveInSupabase(id);

  setItems(prev => [{ id, url, dataUrl, saved: ok }, ...prev]);
};


  const createMany = async (n: number) => {
    for (let i = 0; i < n; i++) {
      // secuencial para no saturar la API
      // eslint-disable-next-line no-await-in-loop
      await createOne();
    }
  };

  const handleGenerate = async () => {
    const n = Math.max(1, Math.min(500, Number(count) || 1));
    await createMany(n);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("URL copiada");
    } catch {
      alert("No se pudo copiar");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Generador de QRs</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label>
          Cantidad:&nbsp;
          <input
            type="number"
            value={count}
            min={1}
            max={500}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            style={{ width: 80, padding: 6 }}
          />
        </label>
        <button onClick={handleGenerate} style={{ padding: "8px 12px" }}>Generar</button>
        <button onClick={() => setItems([])} style={{ padding: "8px 12px" }}>Limpiar</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map(({ id, url, dataUrl, saved }) => (
          <div key={id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <img src={dataUrl} alt={url} style={{ width: "100%", height: "auto" }} />
            <div style={{ fontSize: 12, marginTop: 8, wordBreak: "break-all" }}>{url}</div>
            <div style={{ fontSize: 12, color: saved ? "green" : "red" }}>
                {saved ? "Guardado en DB" : "No guardado"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={() => copy(url)} style={{ padding: "6px 10px" }}>Copiar URL</button>
              <a href={dataUrl} download={`qr-${id}.png`} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, textDecoration: "none" }}>
                Descargar PNG
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
