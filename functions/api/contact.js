// Adaptador para Cloudflare Pages: reutiliza el mismo backend de src/worker.js
import worker from "../../src/worker.js";
export const onRequest = ({ request, env }) => worker.fetch(request, env);
