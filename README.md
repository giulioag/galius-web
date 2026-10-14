# Galius web — Cloudflare Worker (frontend + backend en un solo deploy)

- `public/` — el sitio (HTML/CSS/JS, favicon, robots, headers de seguridad)
- `src/worker.js` — backend: recibe el formulario en `/api/contact`
- `wrangler.jsonc` — configuración de Cloudflare

## Publicar (necesitás Node 20+ y una cuenta de Cloudflare)

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Al terminar te da una URL `https://galius-web.<tu-cuenta>.workers.dev`. Frontend y backend quedan online juntos.

El almacenamiento de contactos (KV `LEADS_KV`) se crea solo en el primer deploy. Si tu versión de Wrangler no lo hace, corré `npx wrangler kv namespace create LEADS_KV` y pegá el `id` que devuelve en `wrangler.jsonc`, dentro de `kv_namespaces`.

## Dominio galius.com.ar

Dashboard de Cloudflare → Workers & Pages → `galius-web` → Settings → Domains & Routes → Add → Custom domain. El dominio tiene que estar usando los DNS de Cloudflare.

## Contactos

Se guardan en KV:

```bash
npx wrangler kv key list --binding LEADS_KV --prefix lead:
npx wrangler kv key get --binding LEADS_KV "<nombre-de-la-clave>"
```

## Aviso por email (opcional)

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_EMAIL
```

Con el remitente de prueba `onboarding@resend.dev`, Resend solo entrega al email dueño de la cuenta de Resend. Para enviar a otra casilla hay que verificar un dominio en Resend y cambiar el `from` en `src/worker.js`.

## Probar en tu computadora

```bash
npm run dev
```

Abre el sitio y el backend en http://localhost:8787, con un KV simulado.
