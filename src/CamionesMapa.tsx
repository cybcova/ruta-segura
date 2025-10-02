import { useEffect, useMemo, useRef, useState } from "react";
import L, { Map as LMap, Polyline, LayerGroup, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

type Camion = { id: number; nombre: string };
type Punto = {
  id: number;
  camion_id: number;
  coo?: string | null;
  lat: number;
  lon: number;
  recorded_at: string;
};

export default function CamionesMapa() {
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [camionId, setCamionId] = useState<number | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mapRef = useRef<LMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const polyRef = useRef<Polyline | null>(null);
  const startRef = useRef<CircleMarker | null>(null);
  const endRef   = useRef<CircleMarker | null>(null);
  const timerRef = useRef<number | null>(null);

  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON as string;

  // --- Inicializa mapa una sola vez ---
  useEffect(() => {
    if (mapRef.current) return;

    const el = document.getElementById("leaflet-map");
    if (!el) return;

    const map = L.map(el, {
        center: [19.4326, -99.1332],
        zoom: 13,
        zoomControl: false, // desactiva el default
    });
        
    // agrega el control donde lo quieras
    L.control.zoom({ position: "bottomright" }).addTo(map);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, []);

  // --- Carga camiones al entrar ---
  const fetchCamiones = async () => {
    setError("");
    try {
      const resp = await fetch(`${base}/rest/v1/camiones`, {
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      const data: Camion[] = await resp.json();
      const items = Array.isArray(data) ? data.sort((a,b) => a.nombre.localeCompare(b.nombre)) : [];
      setCamiones(items);
      if (items.length && camionId == null) setCamionId(items[0].id);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  useEffect(() => {
    fetchCamiones();
    // cleanup polling al salir
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Trae puntos y pinta ---
  const fetchPuntos = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const url = `${base}/rest/v1/recorrido_puntos?camion_id=eq.${id}&order=recorded_at.asc`;
      const resp = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      const data: Punto[] = await resp.json();
      setPuntos(data);
      setLastUpdated(new Date());
      drawOnMap(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const drawOnMap = (data: Punto[]) => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // Limpia capa
    layer.clearLayers();
    polyRef.current = null;
    startRef.current = null;
    endRef.current = null;

    if (!data.length) return;

    const coords = data
      .filter(p => typeof p.lat === "number" && typeof p.lon === "number")
      .map(p => [p.lat, p.lon] as [number, number]);

    if (!coords.length) return;

    // Polilínea
    const poly = L.polyline(coords, { weight: 4 }); // color por defecto
    poly.addTo(layer);
    polyRef.current = poly;

    // Inicio / fin con circleMarker (evita problema de íconos PNG en Vite)
    const start = L.circleMarker(coords[0], { radius: 6, color: "#2d7" })
      .addTo(layer)
      .bindPopup("Inicio");
    startRef.current = start;

    const end = L.circleMarker(coords[coords.length - 1], { radius: 8, color: "#27f" })
      .addTo(layer)
      .bindPopup("Fin");
    endRef.current = end;

    // Ajusta vista
    map.fitBounds(poly.getBounds(), { padding: [20, 20] });
  };

  // --- Handler botón Consultar: trae puntos y activa polling ---
  const handleConsultar = () => {
    if (camionId == null) return;
    // 1) consulta inmediata
    fetchPuntos(camionId);
    // 2) activa polling 5s
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      fetchPuntos(camionId);
    }, 5000);
    setPolling(true);
  };

  // Si cambia el camión seleccionado y ya había polling, vuelve a iniciar
  useEffect(() => {
    if (polling && camionId != null) {
      handleConsultar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camionId]);

  const puntosInfo = useMemo(() => {
    if (!puntos.length) return { total: 0, inicio: null as string | null, fin: null as string | null };
    return {
      total: puntos.length,
      inicio: puntos[0].recorded_at,
      fin: puntos[puntos.length - 1].recorded_at,
    };
  }, [puntos]);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100dvh" }}>
      {/* Barra superior */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Recorridos de camiones</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            Camión:&nbsp;
            <select
              value={camionId ?? ""}
              onChange={(e) => setCamionId(Number(e.target.value))}
              style={{ padding: 6, minWidth: 200 }}
            >
              {camiones.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} (#{c.id})</option>
              ))}
              {camiones.length === 0 && <option value="">—</option>}
            </select>
          </label>

          <button onClick={handleConsultar} disabled={camionId == null || loading} style={{ padding: "8px 12px" }}>
            {loading ? "Cargando…" : "Consultar"}
          </button>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>
            {polling ? "Actualizando cada 5 s" : "Sin actualización automática"}
            {lastUpdated && ` • Última: ${lastUpdated.toLocaleTimeString()}`}
            {puntosInfo.total ? ` • Puntos: ${puntosInfo.total}` : ""}
          </span>
        </div>

        {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
      </div>

      {/* Mapa */}
      <div id="leaflet-map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
