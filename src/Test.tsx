import { useEffect, useState } from "react";

function getSearchParams(): URLSearchParams {
  // 1) SPA clásica: ?a=b en la URL normal
  if (window.location.search) return new URLSearchParams(window.location.search);

  // 2) Hash routing: #/ruta?m=...
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex !== -1) return new URLSearchParams(hash.slice(qIndex + 1));

  return new URLSearchParams();
}

function readInitialMessage(): string {
  const params = getSearchParams();
  return params.get("message") ?? params.get("m") ?? "Holi";
}

function Test() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState<string>(() => readInitialMessage());

  // Soporta back/forward y cambios en el hash (?m=...)
  useEffect(() => {
    const sync = () => setMessage(readInitialMessage());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const send = async () => {
    setStatus("loading");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/VerificacionPrueba`;
      const anon = import.meta.env.VITE_SUPABASE_ANON;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anon,
          "Authorization": `Bearer ${anon}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ message })
      });

      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setStatus(`ok: ${JSON.stringify(data[0] ?? data)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`error: ${msg}`);
    }
  };

  return (
    <div style={{display:"grid",placeItems:"center",minHeight:"100dvh",gap:12}}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje"
        style={{padding:8, fontSize:16}}
      />
      <button onClick={send} disabled={status==="loading"} style={{padding:12,fontSize:18}}>
        {status==="loading" ? "Enviando..." : "Enviar"}
      </button>
      <code>{status}</code>
    </div>
  );
}

export default Test;
