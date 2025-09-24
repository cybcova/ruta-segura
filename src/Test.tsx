import { useState } from "react";

function Test() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Holi"); // valor inicial

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
        body: JSON.stringify({ message }) // 👈 usamos el valor dinámico
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
