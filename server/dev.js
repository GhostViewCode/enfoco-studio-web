/* =============================================================================
   SERVIDOR LOCAL DE DESARROLLO
   =============================================================================
   Sirve la web estática y añade POST /api/contact. Solo para trabajar en local:
   en producción lo estático lo sirve el hosting y la API es una función
   (netlify/functions/contact.js).

   Arrancar con:   npm run dev
   ========================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { gestionarContacto } from './contacto.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT) || 5174;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.avif': 'image/avif', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

/* Nunca servir secretos ni dependencias, pase lo que pase */
const PROHIBIDO = [/(^|[\\/])\.env/i, /(^|[\\/])node_modules([\\/]|$)/i,
                   /(^|[\\/])server([\\/]|$)/i, /(^|[\\/])netlify([\\/]|$)/i, /(^|[\\/])\.git/i];

function leerCuerpo(req, limiteBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let datos = '', total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > limiteBytes) { reject(new Error('demasiado grande')); req.destroy(); return; }
      datos += c;
    });
    req.on('end', () => resolve(datos));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);

  /* ---- API del formulario ---- */
  if (url.pathname === '/api/contact') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
    }
    try {
      const crudo = await leerCuerpo(req);
      const cuerpo = JSON.parse(crudo || '{}');
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                 req.socket.remoteAddress || 'local';
      const { estado, datos } = await gestionarContacto({ cuerpo, ip });
      console.log(`[api] ${estado} · ${cuerpo.email || 'sin email'} · ${datos.error || 'enviado'}`);
      res.writeHead(estado, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(datos));
    } catch (e) {
      console.error('[api] error:', e.message);
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'Solicitud no válida' }));
    }
  }

  /* ---- Archivos estáticos ---- */
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const destino = path.normalize(path.join(RAIZ, rel));
  if (!destino.startsWith(RAIZ) || PROHIBIDO.some((r) => r.test(path.relative(RAIZ, destino)))) {
    res.writeHead(403).end('Prohibido');
    return;
  }
  fs.readFile(destino, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(buf);
  });
});

server.listen(PUERTO, () => {
  const faltan = ['RESEND_API_KEY', 'CONTACT_EMAIL'].filter((k) => !process.env[k]);
  console.log(`\n  En Foco Studio — servidor local`);
  console.log(`  http://localhost:${PUERTO}/es/`);
  console.log(`  http://localhost:${PUERTO}/en/`);
  console.log(faltan.length
    ? `  ⚠  faltan variables en .env: ${faltan.join(', ')}\n`
    : `  ✓  Resend configurado · avisos a ${process.env.CONTACT_EMAIL}\n`);
});
