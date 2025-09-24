import { useState } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";

export default function AcopioEscaneo() {
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScan = (codes: IDetectedBarcode[]) => {
    // codes es un array; toma el primero con contenido
    const result = codes?.[0]?.rawValue;
    if (!result) return;

    console.log("🔍 QR detectado:", result);
    setLastScan(result);

    try {
      // Extrae UUID del query param "uuid" dentro del hash
      const url = new URL(result);
      const qIndex = url.hash.indexOf("?");
      const params = qIndex !== -1 ? new URLSearchParams(url.hash.slice(qIndex + 1)) : null;
      const uuid = params?.get("uuid");

      if (uuid) {
        navigate(`/registroLista?uuid=${encodeURIComponent(uuid)}`);
      } else {
        setError("El QR no contiene un parámetro uuid válido.");
      }
    } catch {
      setError("No se pudo interpretar el QR (¿es una URL válida?).");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Escanear QR de Acopio</h1>
      <p>Apunta la cámara hacia un código QR válido.</p>

      <div style={{ maxWidth: 420, margin: "16px auto" }}>
        <Scanner
          onScan={handleScan}
          onError={(err) => setError(err instanceof Error ? err.message : String(err))}
          // Opcionales recomendados:
          scanDelay={300} // evita múltiples lecturas por segundo
          constraints={{ facingMode: "environment" }} // cámara trasera en móviles
          components={{ finder: true, torch: true, zoom: true }} // UI útil
          style={{ width: "100%" }}
        />
      </div>

      {lastScan && (
        <div style={{ marginTop: 16, background: "#f7f7f7", padding: 8 }}>
          <strong>Crudo detectado:</strong>
          <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {lastScan}
          </pre>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
    </div>
  );
}
