// Backend de Galius: corre en Cloudflare Workers. Solo atiende /api/*; el resto lo sirve el frontend (public/).
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api/contact") return json({ error: "No encontrado." }, 404);
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);

    const hasEmail = Boolean(env.RESEND_API_KEY && env.CONTACT_EMAIL);
    if (!env.LEADS_KV && !hasEmail) {
      console.error("Formulario sin destino: falta LEADS_KV o RESEND_API_KEY + CONTACT_EMAIL");
      return json({ error: "El formulario no está disponible por el momento." }, 503);
    }

    let data;
    try { data = await request.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }
    if (data.website) return json({ ok: true }); // honeypot: los bots lo completan, las personas no

    const clean = (v, max) => String(v || "").trim().slice(0, max);
    const name = clean(data.name, 120), email = clean(data.email, 200);
    const company = clean(data.company, 160), message = clean(data.message, 3000);
    if (!name || !email || !message) return json({ error: "Faltan campos obligatorios." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "El email no es válido." }, 400);

    if (env.LEADS_KV) { // límite simple: 1 envío por minuto por IP
      const rl = `rl:${request.headers.get("CF-Connecting-IP") || "unknown"}`;
      if (await env.LEADS_KV.get(rl)) return json({ error: "Esperá un minuto antes de enviar otro mensaje." }, 429);
      await env.LEADS_KV.put(rl, "1", { expirationTtl: 60 });
    }

    const date = new Date().toISOString();
    const lead = { name, email, company, message, date };
    let saved = false;

    if (env.LEADS_KV) {
      await env.LEADS_KV.put(`lead:${date}:${crypto.randomUUID()}`, JSON.stringify(lead));
      saved = true;
    }
    if (hasEmail) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Galius <onboarding@resend.dev>",
            to: [env.CONTACT_EMAIL],
            reply_to: email,
            subject: `Nuevo contacto: ${name}${company ? " (" + company + ")" : ""}`,
            text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${company || "-"}\n\n${message}`,
          }),
        });
        if (r.ok) saved = true; else console.error("Resend error", r.status, await r.text());
      } catch (e) { console.error("Resend fetch falló", e); }
    }
    return saved ? json({ ok: true }) : json({ error: "No pudimos registrar tu mensaje. Probá de nuevo." }, 502);
  },
};
