export async function onRequestGet(context) {
  const hasKV = Boolean(context.env.GALIUS_LEADS);
  return new Response(
    JSON.stringify({
      ok: true,
      service: "galius-pages-functions",
      kvConfigured: hasKV,
      time: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
