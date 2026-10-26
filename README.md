# Galius web — Cloudflare Worker (frontend + backend en un solo deploy)

- `public/` — el sitio (HTML/CSS/JS, favicon, robots, headers de seguridad)
- `src/worker.js` — backend: recibe el formulario en `/api/contact`
- `wrangler.jsonc` — configuración de Cloudflare

## Si ya tenés un proyecto de Cloudflare Pages conectado a GitHub

Este repo funciona con ese proyecto. Un solo ajuste, una sola vez, en el dashboard (Workers & Pages → tu proyecto → Settings):

1. **Build configuration**: Build command vacío, **Build output directory: `public`**. Si subiste la carpeta `galius-site` entera a GitHub, poné también **Root directory: `galius-site`**.
2. **Bindings → KV namespace**: creá un KV (Storage & Databases → KV → Create) y agregalo con el nombre de variable **`LEADS_KV`**. Sin esto, el formulario responde error a propósito.
3. **Variables and secrets** (opcional, para el aviso por email): `RESEND_API_KEY` y `CONTACT_EMAIL`.
4. Hacé un push, o en Deployments tocá "Retry deployment". Desde ahí cada push se publica solo.

Pages ignora `wrangler.jsonc`: la configuración de ese proyecto vive en el dashboard. El backend lo toma de `functions/api/contact.js`, que reutiliza `src/worker.js`.

---

## Publicar con Workers, sin Pages (necesitás Node 20+ y una cuenta de Cloudflare)

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
