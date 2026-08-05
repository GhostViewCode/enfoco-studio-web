/* =============================================================================
   FUNCIÓN DE CONTACTO PARA NETLIFY
   =============================================================================
   Envoltorio finísimo alrededor de server/contacto.js. Toda la lógica está allí,
   así que el servidor local y el desplegado se comportan igual.

   Antes de publicar hay que poner las variables en el panel de Netlify:
     Site settings → Environment variables → RESEND_API_KEY y CONTACT_EMAIL
   (el archivo .env NO se sube; ver netlify.toml).
   ========================================================================== */

import { gestionarContacto } from '../../server/contacto.js';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Método no permitido' }, { status: 405 });
  }
  let cuerpo;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Solicitud no válida' }, { status: 400 });
  }
  const ip = req.headers.get('x-nf-client-connection-ip') ||
             (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
             'desconocida';

  const { estado, datos } = await gestionarContacto({ cuerpo, ip });
  return Response.json(datos, { status: estado });
};

export const config = { path: '/api/contact' };
