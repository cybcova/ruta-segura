import { useEffect, useRef, useState } from "react";
import L, { Map as LMap, LayerGroup, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

type Movimiento = {
  id: number;
  rfid_uid: string;
  movimiento: string;
  lat: number;
  lon: number;
};

export default function MapaRFIDSimple() {
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const mapRef = useRef<LMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON as string;

  // Inicializa mapa
  useEffect(() => {
    if (mapRef.current) return;

    const el = document.getElementById("leaflet-map");
    if (!el) return;

    const map = L.map(el, {
      center: [19.4326, -99.1332],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, []);

  // Consulta todos los movimientos sin filtrar
  const fetchMovs = async () => {
    setLoading(true);
    setError("");

    try {
      const resp = await fetch(
        `${base}/rest/v1/rfid_movimientos?order=movimiento.asc`,
        {
          headers: {
            "Content-Type": "application/json",
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
        }
      );

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data: Movimiento[] = await resp.json();
      setMovs(data);

      drawPoints(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  // Dibuja puntos rojos, más intenso donde hay acumulación
  const drawPoints = (data: Movimiento[]) => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!data.length) return;

    data.forEach(p => {
      if (typeof p.lat === "number" && typeof p.lon === "number") {
        L.circleMarker([p.lat, p.lon], {
          radius: 6,
          color: "red",
          fillColor: "red",
          fillOpacity: 0.4, // opaco para que acumulación = intensidad
          weight: 1,
        }).addTo(layer);
      }
    });

    // Fit bounds si hay puntos
    const coords = data.map(d => [d.lat, d.lon]) as [number, number][];
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Se consulta automáticamente al entrar
  useEffect(() => {
    fetchMovs();
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100dvh" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" , display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Movimientos RFID (Mapa simple)</h2>

        <button
          onClick={fetchMovs}
          disabled={loading}
          style={{ padding: "6px 12px", marginTop: 8 }}
        >
          {loading ? "Cargando…" : "Actualizar"}
        </button>

        {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
        <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
          Total de puntos: {movs.length}
        </div>
      </div>

      <div id="leaflet-map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
