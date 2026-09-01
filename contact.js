// Cloudflare Pages Function — corre en el mismo dominio que el sitio, en /api/contact
// Requiere un KV namespace bindeado como GALIUS_LEADS (ver README para configurarlo).

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "El cuerpo del pedido no es JSON válido." }, 400);
  }

  const { name, email, company, message } = body || {};

  if (!name || !email || !message) {
    return json({ ok: false, error: "Faltan campos obligatorios: nombre, email y mensaje." }, 400);
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return json({ ok: false, error: "El email no parece válido." }, 400);
  }

  const lead = {
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    company: company ? String(company).slice(0, 200) : "",
    message: String(message).slice(0, 4000),
    receivedAt: new Date().toISOString(),
  };

  // --- Guardar en Cloudflare KV ---
  if (env.GALIUS_LEADS) {
    const key = `lead:${lead.receivedAt}:${crypto.randomUUID()}`;
    try {
      await env.GALIUS_LEADS.put(key, JSON.stringify(lead));
    } catch (err) {
      console.error("Error guardando el lead en KV:", err);
      return json({ ok: false, error: "No pudimos guardar tu mensaje. Probá de nuevo en unos minutos." }, 500);
    }
  } else {
    // Sin KV bindeado (por ejemplo, corriendo local sin --kv) igual no rompemos:
    // el mensaje no queda guardado, pero la persona ve confirmación honesta si falla.
    console.warn("GALIUS_LEADS (KV) no está bindeado — el lead no se guardó en ningún lado.");
    return json({ ok: false, error: "El almacenamiento no está configurado todavía. Escribinos directo a contacto@galius.com.ar." }, 503);
  }

  // --- Email opcional vía Resend (https://resend.com) ---
  // Si no cargás RESEND_API_KEY, el lead igual queda guardado en KV — esto es puro extra.
  let emailSent = false;
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM || "Galius <onboarding@resend.dev>",
          to: env.CONTACT_EMAIL_TO || "contacto@galius.com.ar",
          reply_to: lead.email,
          subject: `Nuevo contacto: ${lead.name}`,
          text: `Nombre: ${lead.name}\nEmail: ${lead.email}\nEmpresa: ${lead.company || "-"}\n\nMensaje:\n${lead.message}`,
        }),
      });
      emailSent = res.ok;
      if (!res.ok) console.error("Resend devolvió un error:", await res.text());
    } catch (err) {
      console.error("Error llamando a Resend (el lead ya quedó guardado en KV):", err);
    }
  }

  return json({ ok: true, emailSent }, 201);
}

// GET /api/contact — útil para confirmar que la función está desplegada
export async function onRequestGet() {
  return json({ ok: true, endpoint: "contact", method: "POST para enviar un mensaje" });
}
