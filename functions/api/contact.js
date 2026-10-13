// Cloudflare Pages Function — recibe el POST del formulario de contacto en /api/contact
// Guarda cada lead en un namespace de Cloudflare KV, y opcionalmente reenvía por email con Resend.

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const company = (data.company || "").trim();
    const message = (data.message || "").trim();

    if (!name || !email || !message) {
      return json({ error: "Faltan campos obligatorios." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "El email no es válido." }, 400);
    }

    const id = crypto.randomUUID();
    const entry = {
      id,
      name,
      email,
      company,
      message,
      date: new Date().toISOString(),
    };

    // Guarda el lead en KV. Necesitás crear el namespace y bindearlo como LEADS_KV
    // (ver README.md — paso "Crear el namespace de KV").
    if (env.LEADS_KV) {
      await env.LEADS_KV.put(id, JSON.stringify(entry));
    }

    // Reenvío opcional por email con Resend (https://resend.com).
    // Configurá RESEND_API_KEY y CONTACT_EMAIL como secrets (ver README.md) para activar esto.
    if (env.RESEND_API_KEY && env.CONTACT_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Galius <onboarding@resend.dev>",
          to: [env.CONTACT_EMAIL],
          subject: `Nuevo contacto de ${name}${company ? " — " + company : ""}`,
          text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${company || "-"}\n\nMensaje:\n${message}`,
        }),
      });
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: "Error interno del servidor." }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
