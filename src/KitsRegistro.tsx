import { useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type KitRow = {
  id: string;
  created_at: string;
  updated_at: string;
  lista_viveres: string;
  estatus: string;
  confirmacion_recepcion: boolean | null;
  observaciones: string | null;
  mensaje: string | null;
};

const kits: Record<string, string> = {
    "Kit de Alimentación": `1 kg arroz,
1 kg frijol o lenteja,
1 paquete pasta (500 g – 1 kg),
1 L aceite,
1 kg azúcar,
1 kg sal,
6 latas proteína (atún/sardina),
2 L leche UHT,
2 paquetes galletas,
1 frasco mermelada o café`,
    "Kit de Hidratación": `12 botellas de 1.5 L (18 L en total)`,
    "Kit de Higiene Personal": `4 barras jabón,
1 kg detergente,
2 cepillos + 2 pastas dentales,
1 shampoo (250 ml),
1 paquete toallas sanitarias,
2 rastrillos,
4 rollos papel higiénico`,
    "Kit de Limpieza": `1 escoba,
1 trapeador,
1 cubeta,
2 L cloro,
2 kg detergente,
1 rollo bolsas de basura`,
    "Kit de Primeros Auxilios": `1 botiquín básico,
1 caja curitas,
1 paquete gasas,
1 botella antiséptico (250 ml),
1 par guantes`,
    "Kit de Bebé": `1 paquete pañales,
1 paquete toallitas húmedas,
1 lata fórmula infantil,
1 biberón`,
    "Kit de Abrigo": `2 frazadas,
1 impermeable,
2 pares calcetas,
1 colchoneta`,
    "Kit Escolar": `1 kit escolar prearmado (cuaderno, colores, lápiz, etc.)`,
  };


export default function KitsRegistro() {
  const [lista, setLista] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [kitUrl, setKitUrl] = useState<string | null>(null);
  const [kitId, setKitId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lista.trim()) {
      setStatus("error");
      setMsg("La lista de víveres no puede estar vacía.");
      return;
    }
    setStatus("loading");
    setMsg("");
    setQrDataUrl(null);
    setKitUrl(null);
    setKitId(null);

    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const anon = import.meta.env.VITE_SUPABASE_ANON as string;

      // 1) POST a kits_entregados
      const resp = await fetch(`${base}/rest/v1/kits_entregados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          lista_viveres: lista.trim(),
          categoria : categoria,
          estatus: "registrado",
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt}`);
      }

      const data: KitRow[] = await resp.json();
      const row = data?.[0];
      if (!row?.id) {
        throw new Error("La respuesta no devolvió un id.");
      }
      setKitId(row.id);

      // 2) Construye URL para recepción
      const url = `${window.location.origin}/#/${"recepcionKit"}?uuid=${encodeURIComponent(row.id)}`;
      setKitUrl(url);

      // 3) Genera QR (PNG base64)
      const qr = await QRCode.toDataURL(url, { width: 300, margin: 1 });
      setQrDataUrl(qr);

      // 4) Genera PDF
      await makePdf({ url, qrDataUrl: qr, lista: row.lista_viveres, id: row.id });

      setStatus("ok");
      setMsg("Kit registrado y PDF generado.");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const makePdf = async (args: { url: string; qrDataUrl: string; lista: string; id: string }) => {
    const { url, qrDataUrl, lista, id } = args;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("Ayudanos a ayudar!", margin, y);
    y += 48;

    doc.setFontSize(18);
    doc.text("Escanea para confirmar recepción", margin, y);
    y += 12;

    // Inserta QR
    const qrSize = 220;
    doc.addImage(qrDataUrl, "PNG", margin, y, qrSize, qrSize);

    // A la derecha del QR, imprime la URL
    doc.setFontSize(12);
    const rightX = margin + qrSize + 16;
    doc.setFont("helvetica", "bold");
    doc.text("URL:", rightX, y + 18);
    doc.setFont("helvetica", "normal");
    const urlLines = doc.splitTextToSize(url, 250);
    doc.text(urlLines, rightX, y + 36);
    y += 250;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Es importante para nosotros saber que estos viveres estan llegando a quien lo necesita,", margin, y);
    y += 16;
    doc.text("escanea el qr y responde unas simples preguntas que nos ayudara a seguir ayudando", margin, y);
    y += 32;

    doc.setFontSize(18);
    doc.text(categoria, margin, y);
    y += 20;

    doc.setFontSize(12);
    doc.text("Este kit debe contener:", margin, y);
    y += 16;

    // Pinta lista (multi-linea)
    const lines = doc.splitTextToSize(lista, 520);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 10;


    // Pie
    doc.setFontSize(10);
    doc.text(
      "Ruta segura.",
      margin,
      812
    );

    doc.save(`kit-${id}.pdf`);
  };

return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Registro de Kits Entregados</h1>
      <p style={{ color: "#666", marginTop: -6 }}>
        Captura la lista de víveres. Al guardar se generará el ID, el QR y un PDF descargable.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Categoría:</span>
          <select
            value={categoria}
            onChange={(e) => {
              const value = e.target.value;
              setCategoria(value);
              if (kits[value]) {
                setLista(kits[value]);
              }
            }}
            style={{ padding: 8, fontSize: 16 }}
          >
            <option value="">-- Selecciona una categoría --</option>
            {Object.keys(kits).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Lista de víveres:</span>
          <textarea
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            placeholder="Arroz 1kg, Frijol 1kg, Agua 2L"
            rows={8}
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={status === "loading"}
            style={{ padding: "10px 14px", fontSize: 16 }}
          >
            {status === "loading" ? "Guardando..." : "Guardar y generar PDF"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLista("");
              setCategoria("");
              setStatus("idle");
              setMsg("");
              setQrDataUrl(null);
              setKitUrl(null);
              setKitId(null);
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

      {kitId && (
        <div style={{ marginTop: 16 }}>
          <strong>ID:</strong> <code>{kitId}</code>
        </div>
      )}
      {kitUrl && (
        <div style={{ marginTop: 8 }}>
          <strong>URL:</strong>{" "}
          <a href={kitUrl} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
            {kitUrl}
          </a>
        </div>
      )}
      {qrDataUrl && (
        <div style={{ marginTop: 12 }}>
          <img src={qrDataUrl} alt="QR" style={{ width: 220, height: "auto" }} />
        </div>
      )}
    </div>
  );
}
