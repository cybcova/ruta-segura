import { useState } from "react";

function Test() {
  const [status, setStatus] = useState("idle");

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
          "Prefer": "return=representation" // para ver lo insertado
        },
        body: JSON.stringify({ message: "Holi" })
      });

      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setStatus(`ok: ${JSON.stringify(data[0] ?? data)}`);
    } catch (e) {
      setStatus(`error: ${e.message}`);
    }
  };

  return (
    <div style={{display:"grid",placeItems:"center",minHeight:"100dvh",gap:12}}>
      <button onClick={send} disabled={status==="loading"} style={{padding:12,fontSize:18}}>
        {status==="loading" ? "Enviando..." : "Enviar 'Holi'"}
      </button>
      <code>{status}</code>
    </div>
  );
}

export default Test;
