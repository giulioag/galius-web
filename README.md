# Galius — proyecto listo para Cloudflare Pages

## Qué incluye

- `index.html` — el sitio completo (frontend), con un formulario de contacto funcional.
- `functions/api/contact.js` — backend (Cloudflare Pages Function) que recibe el formulario.
- `wrangler.toml` — configuración de Cloudflare.

No hay build step: es HTML + CSS + JS plano, más una función serverless. No necesitás Node, React ni nada para desplegarlo — solo la CLI de Cloudflare.

---

## Paso a paso para publicarlo

### 1. Instalar la CLI de Cloudflare (Wrangler)

```bash
npm install -g wrangler
```

### 2. Iniciar sesión con tu cuenta de Cloudflare

```bash
wrangler login
```

Se abre el navegador para que autorices la CLI contra tu cuenta.

### 3. Crear el namespace de KV (donde se guardan los contactos que llegan por el formulario)

```bash
wrangler kv namespace create LEADS_KV
```

Esto te devuelve algo como:

```
{ binding = "LEADS_KV", id = "abcd1234..." }
```

Copiá ese `id` y pegalo en `wrangler.toml`, reemplazando `REEMPLAZAR_CON_TU_ID_DE_KV`.

### 4. (Opcional) Activar el envío de los contactos por email

Si querés que cada envío del formulario también te llegue por mail, necesitás una cuenta en [Resend](https://resend.com) (tiene plan gratuito) y tu API key. Después corré:

```bash
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put CONTACT_EMAIL
```

Te va a pedir que pegues el valor de cada uno (la API key de Resend, y el email adonde querés que lleguen los contactos). Si no configurás esto, el formulario igual funciona y guarda todo en KV — simplemente no te llega notificación por mail.

### 5. Desplegar

Desde la carpeta del proyecto:

```bash
wrangler pages deploy . --project-name=galius-web
```

Te va a dar una URL tipo `https://galius-web.pages.dev` — ya está online.

### 6. Conectar tu dominio (galius.com.ar)

En el [dashboard de Cloudflare Pages](https://dash.cloudflare.com) → tu proyecto → **Custom domains** → agregá `galius.com.ar`. Si tu dominio ya está en Cloudflare, se conecta en minutos; si está en otro proveedor, te va a pedir apuntar los DNS ahí.

---

## Cómo ver los contactos que llegan

Mientras no configures el email automático (paso 4), podés ver los leads guardados en KV con:

```bash
wrangler kv key list --namespace-id=TU_ID_DE_KV
wrangler kv key get <id-del-lead> --namespace-id=TU_ID_DE_KV
```

O armamos juntos, cuando quieras, una página simple de administración para verlos desde el navegador en vez de la terminal.

## Actualizar el sitio después de este primer deploy

Cualquier cambio futuro al HTML o a la función, se sube con el mismo comando del paso 5 — no hace falta repetir el resto.
