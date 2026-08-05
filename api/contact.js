/* =============================================================================
   FUNCIÓN DE CONTACTO PARA VERCEL
   =============================================================================
   Vercel convierte cada archivo de /api en una función. Este archivo pasa a
   ser https://tu-dominio.com/api/contact, que es exactamente la dirección a
   la que el formulario ya envía.

   Igual que el de Netlify, es un envoltorio finísimo: toda la lógica vive en
   server/contacto.js, así que lo que pruebas en local es lo que corre
   publicado.

   ANTES DE PUBLICAR hay que poner las variables en el panel de Vercel:
     Project → Settings → Environment Variables
       RESEND_API_KEY   la clave de Resend
       CONTACT_EMAIL    studio@enfoco.site
       MAIL_FROM        En Foco Studio <studio@enfoco.site>
   El archivo .env NO se sube al repositorio (está en .gitignore).
   ========================================================================== */

import { gestionarContacto } from '../server/contacto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  /* Vercel suele entregar el JSON ya interpretado en req.body, pero no siempre:
     depende de la cabecera que mande el navegador. Se contemplan los tres
     casos para que un envío nunca se pierda por un detalle de formato. */
  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = null; }
  }
  if (!cuerpo || typeof cuerpo !== 'object') {
    try {
      const trozos = [];
      for await (const t of req) trozos.push(t);
      cuerpo = JSON.parse(Buffer.concat(trozos).toString('utf8'));
    } catch {
      return res.status(400).json({ ok: false, error: 'Solicitud no válida' });
    }
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             req.socket?.remoteAddress || 'desconocida';

  const { estado, datos } = await gestionarContacto({ cuerpo, ip });
  return res.status(estado).json(datos);
}
