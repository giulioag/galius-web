# Galius — versión Cloudflare (frontend + backend en un solo lugar)

Este proyecto está armado específicamente para **Cloudflare Pages**: el
sitio y la API del formulario de contacto se despliegan juntos, en el mismo
dominio, sin necesidad de un hosting aparte para el backend.

```
galius-cf/
├── frontend/              # El sitio: esto es lo que Cloudflare sirve como estático
│   ├── index.html
│   ├── vision.html
│   ├── contacto.html
│   └── assets/logo.svg
└── functions/              # Cloudflare Pages Functions = tu "backend"
    └── api/
        ├── contact.js      # POST /api/contact — recibe el formulario
        └── health.js       # GET  /api/health  — para chequear que está vivo
```

`functions/` tiene que quedar **al mismo nivel que `frontend/`**, no adentro.
Cloudflare lo detecta solo — no hace falta configurar nada especial para que
ande, más allá de conectar el repo.

## Cómo funciona el backend acá

No es un servidor Node corriendo todo el tiempo (como Express) — son
funciones que Cloudflare ejecuta bajo demanda, cada vez que alguien pega a
`/api/contact`. Los mensajes se guardan en **Cloudflare KV** (una base
key-value), no en un archivo, porque en este entorno no hay disco
persistente.

## Configurar el KV namespace (una sola vez, en el dashboard)

1. Cloudflare Dashboard → **Workers y Pages** → **KV** → crear un namespace,
   por ejemplo `galius-leads`.
2. Entrá al proyecto de Pages (después de haberlo desplegado la primera vez)
   → **Settings** → **Functions** → **KV namespace bindings**.
3. Agregá un binding: variable `GALIUS_LEADS` → apuntando al namespace que
   creaste. Hacelo tanto para "Production" como para "Preview".
4. Volvé a desplegar (un nuevo commit alcanza) para que tome el binding.

Sin este paso, el formulario responde con un error claro pidiendo escribir
directo a `contacto@galius.com.ar` — no falla en silencio.

## Mandar el mensaje también por email (opcional)

Por default, el mensaje solo queda guardado en KV — lo revisás desde el
dashboard de Cloudflare (KV → tu namespace → ver las keys `lead:...`).

Si además querés que te llegue por mail, usá [Resend](https://resend.com)
(tiene plan gratuito, y funciona con `fetch`, que es lo único que corre en
Cloudflare Functions — no vale usar librerías tipo `nodemailer`, que
necesitan Node de verdad):

1. Creá una cuenta en Resend y una API key.
2. En el proyecto de Pages → **Settings** → **Environment variables**,
   agregá `RESEND_API_KEY` con esa key, y `CONTACT_EMAIL_TO` con
   `contacto@galius.com.ar`.
3. Volvé a desplegar.

## Probarlo local antes de subirlo

```bash
npm install
npx wrangler pages dev frontend --kv GALIUS_LEADS
```

Esto levanta el sitio completo (frontend + functions) en
`http://localhost:8788`, con un KV local de prueba. Anda todo — lo probé así
antes de entregarte esto.

## Desplegar

**Opción A — conectar el repo de GitHub (recomendado):**
Cloudflare Dashboard → Workers y Pages → Create → Pages → Connect to Git →
elegís el repo → **Build output directory: `frontend`** → Deploy. Cloudflare
detecta `functions/` solo.

**Opción B — desde la terminal, sin GitHub:**
```bash
npx wrangler pages deploy frontend --project-name=galius
```

## Dominio propio (galius.com.ar)

Una vez desplegado, Cloudflare Pages → tu proyecto → **Custom domains** →
agregás `galius.com.ar`. Si el dominio ya está en tu cuenta de Cloudflare,
el DNS se configura solo.

## Estado actual

El sitio y el formulario de contacto son reales y quedaron probados
funcionando de punta a punta. El dashboard que se ve en la home sigue siendo
una maqueta de cómo se va a ver el producto — la conexión a datos reales de
planta (sensores, PLCs) es la próxima etapa, después de validar el
diagnóstico manual con los primeros clientes piloto.
