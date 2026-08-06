/* =============================================================================
   EN FOCO STUDIO — LÓGICA DEL FORMULARIO DE CONTACTO
   =============================================================================
   Módulo compartido: lo usan tanto el servidor local (server/dev.js) como la
   función desplegada (netlify/functions/contact.js). Aquí no hay nada atado a
   un hosting concreto: entra un objeto con los datos y sale un objeto con el
   estado HTTP y la respuesta.

   LA CLAVE DE RESEND SOLO VIVE AQUÍ, EN EL SERVIDOR. Nunca se manda al
   navegador: si estuviera en el JavaScript de la página, cualquiera podría
   leerla y enviar correo en tu nombre.
   ========================================================================== */

import { Resend } from 'resend';

/* --- Textos, en los dos idiomas ---------------------------------------- */
const T = {
  es: {
    faltan: 'Faltan datos obligatorios.',
    emailMal: 'El email no parece válido.',
    telMal: 'El teléfono no parece válido.',
    largo: 'Alguno de los campos es demasiado largo.',
    spam: 'No hemos podido procesar el envío.',
    rapido: 'El formulario se ha enviado demasiado rápido. Inténtalo otra vez.',
    demasiados: 'Has enviado varias solicitudes seguidas. Prueba dentro de un rato.',
    fallo: 'No hemos podido enviar tu solicitud. Escríbenos directamente y lo resolvemos.',
    ok: 'Solicitud recibida.'
  },
  en: {
    faltan: 'Some required fields are missing.',
    emailMal: 'That email address does not look valid.',
    telMal: 'That phone number does not look valid.',
    largo: 'One of the fields is too long.',
    spam: 'We could not process this submission.',
    rapido: 'That was submitted too quickly. Please try again.',
    demasiados: 'You have sent several requests in a row. Please try again later.',
    fallo: 'We could not send your enquiry. Write to us directly and we will sort it out.',
    ok: 'Enquiry received.'
  }
};

/* --- Campos que aceptamos, con su etiqueta y su límite ------------------ */
const CAMPOS = [
  { id: 'nombre',       es: 'Nombre',              en: 'Name',              max: 120, obligatorio: true },
  { id: 'email',        es: 'Email',               en: 'Email',             max: 160, obligatorio: true },
  { id: 'telefono',     es: 'Teléfono o WhatsApp', en: 'Phone or WhatsApp', max: 40,  obligatorio: false },
  { id: 'ubicacion',    es: 'País y ciudad',       en: 'Country and city',  max: 120, obligatorio: true },
  { id: 'tipo',         es: 'Tipo de alojamiento', en: 'Property type',     max: 80,  obligatorio: true },
  { id: 'servicio',     es: 'Qué le interesa',     en: 'Interested in',     max: 80,  obligatorio: true },
  { id: 'anuncio',      es: 'Enlace al anuncio',   en: 'Listing link',      max: 400, obligatorio: false },
  { id: 'enlaceFotos',  es: 'Enlace a las fotos',  en: 'Photos link',       max: 400, obligatorio: false },
  { id: 'mensaje',      es: 'Mensaje',             en: 'Message',           max: 4000, obligatorio: false }
];

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const RE_TEL   = /^[+()\d\s.\-]{7,40}$/;

/* --- Antispam: memoria de envíos recientes por IP ----------------------- */
const recientes = new Map();
const VENTANA_MS = 60 * 60 * 1000;   // una hora
const MAX_POR_VENTANA = 5;           // envíos que llegan a salir
const MAX_INTENTOS = 25;             // golpes contra la puerta, salgan o no

/* Se cuentan dos cosas distintas a propósito. Un cliente real puede
   equivocarse varias veces escribiendo el teléfono; si cada error gastara
   cupo, le cerraríamos la puerta por torpe. Por eso los envíos que llegan a
   salir tienen un tope bajo, y los intentos en bruto uno alto que solo un
   script llega a tocar. */
function apunta(ip, saco) {
  const ahora = Date.now();
  const registro = recientes.get(ip) || { enviados: [], intentos: [] };
  registro.enviados = registro.enviados.filter((t) => ahora - t < VENTANA_MS);
  registro.intentos = registro.intentos.filter((t) => ahora - t < VENTANA_MS);
  registro[saco].push(ahora);
  recientes.set(ip, registro);
  // limpieza para que el mapa no crezca sin fin
  if (recientes.size > 5000) {
    for (const [k, v] of recientes) {
      if (!v.enviados.length && !v.intentos.length) recientes.delete(k);
    }
  }
  return registro;
}

function limitar(ip) {
  const r = apunta(ip, 'intentos');
  return r.intentos.length <= MAX_INTENTOS && r.enviados.length < MAX_POR_VENTANA;
}

/* Escapa para HTML. Si alguna vez llegara aquí algo que no es texto, se
   convierte a JSON legible en vez de al inútil "[object Object]". */
function escapar(s) {
  const txt = (s === null || s === undefined) ? ''
    : (typeof s === 'object' ? JSON.stringify(s) : String(s));
  return txt.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* --- Correo de aviso para el estudio ------------------------------------ */
function correoParaElEstudio(datos, idioma, meta) {
  const filas = CAMPOS
    .filter((c) => datos[c.id])
    .map((c) => `
      <tr>
        <td style="padding:10px 16px 10px 0;color:#7A7167;font:500 11px/1.4 ui-monospace,monospace;
                   letter-spacing:.12em;text-transform:uppercase;vertical-align:top;white-space:nowrap">
          ${escapar(c[idioma] || c.es)}
        </td>
        <td style="padding:10px 0;color:#151310;font:400 15px/1.5 -apple-system,Segoe UI,sans-serif;
                   border-bottom:1px solid #E6E1D9">
          ${escapar(datos[c.id]).replace(/\n/g, '<br>')}
        </td>
      </tr>`)
    .join('');

  const html = `
<div style="background:#FAF8F5;padding:32px 16px;font-family:-apple-system,Segoe UI,sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;
              box-shadow:0 1px 0 rgba(21,19,16,.08)">
    <div style="background:#151310;padding:22px 28px">
      <p style="margin:0;color:#C1603F;font:500 11px/1.4 ui-monospace,monospace;letter-spacing:.16em;
                text-transform:uppercase">En Foco Studio</p>
      <p style="margin:6px 0 0;color:#FAF8F5;font:400 22px/1.2 Georgia,serif">Nueva solicitud desde la web</p>
    </div>
    <div style="padding:8px 28px 24px">
      <table style="width:100%;border-collapse:collapse">${filas}</table>
      ${datos.archivos ? `
      <p style="margin:20px 0 0;padding:12px 14px;background:#FBF0EA;border-radius:8px;
                color:#8A4A31;font:400 13px/1.55 -apple-system,Segoe UI,sans-serif">
        Ha seleccionado ${escapar(datos.archivos)}. ${datos.adjuntas
          ? 'Van adjuntas a este correo.'
          : 'Pesaban demasiado para adjuntarlas: le hemos pedido que las mande respondiendo al correo de confirmación.'}
      </p>` : ''}
      <p style="margin:20px 0 0;color:#9A9086;font:400 12px/1.5 -apple-system,Segoe UI,sans-serif">
        Idioma de la web: ${idioma === 'en' ? 'inglés' : 'español'} · ${escapar(meta.fecha)}<br>
        Responde a este correo y le llega directamente a ${escapar(datos.email)}.
      </p>
    </div>
  </div>
</div>`;

  const texto = CAMPOS.filter((c) => datos[c.id])
    .map((c) => `${c[idioma] || c.es}: ${datos[c.id]}`).join('\n');

  return { html, texto };
}

/* --- Correo de confirmación para quien escribe -------------------------- */
function correoParaElCliente(datos, idioma, contacto) {
  const es = idioma !== 'en';
  const titulo = es ? 'Hemos recibido tu solicitud' : 'We have got your enquiry';
  const cuerpo = es
    ? `Hola ${escapar(datos.nombre.split(' ')[0])}:<br><br>
       Gracias por escribirnos. Tenemos tu solicitud sobre <strong>${escapar(datos.servicio)}</strong>
       y te contestamos una persona, no un autorespondedor, en menos de 24 horas laborables.<br><br>
       <strong>Si todavía no nos has mandado las fotos</strong>, responde directamente a este correo
       y adjúntalas, o pásanos un enlace de Drive o WeTransfer. Con eso ya podemos ponernos.`
    : `Hi ${escapar(datos.nombre.split(' ')[0])},<br><br>
       Thanks for getting in touch. We have your enquiry about <strong>${escapar(datos.servicio)}</strong>
       and a person — not an autoresponder — will reply within 24 working hours.<br><br>
       <strong>If you have not sent us your photos yet</strong>, just reply to this email and attach
       them, or paste a Drive or WeTransfer link. That is all we need to get started.`;
  const recordatorio = es
    ? 'Si el vídeo de prueba no te convence, no pagas.'
    : "If the test video doesn't convince you, you don't pay.";

  /* Dos cifras del sector mientras espera respuesta. Son de terceros y llevan
     su fuente al lado: prometer un porcentaje propio sería mentir, y en un
     correo comercial además es publicidad engañosa. */
  const cifras = es ? [
    ['71 %', 'de los viajeros dicen que el vídeo influyó en sus decisiones de viaje; con imágenes fijas, solo el 24 %.', 'Expedia Group · The Science of Wanderlust · 2025'],
    ['+19 %', 'más reservas de media al año en los anuncios con fotografía profesional, y un 21 % más de ingresos.', 'Airbnb · 14.700 anuncios comparados · 2024–2025']
  ] : [
    ['71%', 'of travellers say video influenced their travel decisions; for static images, only 24%.', 'Expedia Group · The Science of Wanderlust · 2025'],
    ['+19%', 'more bookings on average over the following year for listings with professional photography, and 21% higher earnings.', 'Airbnb · 14,700 listings compared · 2024–2025']
  ];

  const filasDatos = cifras.map(([n, texto, fuente]) => `
    <tr>
      <td style="padding:14px 16px 14px 0;vertical-align:top;white-space:nowrap">
        <span style="color:#C1603F;font:400 26px/1 Georgia,serif">${escapar(n)}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #E6E1D9">
        <span style="color:#151310;font:400 14px/1.55 -apple-system,Segoe UI,sans-serif">${escapar(texto)}</span><br>
        <span style="color:#9A9086;font:400 11px/1.5 ui-monospace,monospace;letter-spacing:.06em;
                     text-transform:uppercase">${escapar(fuente)}</span>
      </td>
    </tr>`).join('');

  const bloqueDatos = `
    <p style="margin:26px 0 0;color:#7A7167;font:500 11px/1.4 ui-monospace,monospace;
              letter-spacing:.14em;text-transform:uppercase">
      ${es ? 'Mientras tanto' : 'In the meantime'}
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:6px">${filasDatos}</table>
    <p style="margin:12px 0 0;color:#9A9086;font:400 12px/1.55 -apple-system,Segoe UI,sans-serif">
      ${es
        ? 'Son datos del sector publicados por las propias plataformas, no resultados nuestros.'
        : 'These are industry figures published by the platforms themselves, not our own results.'}
    </p>`;

  const html = `
<div style="background:#FAF8F5;padding:32px 16px;font-family:-apple-system,Segoe UI,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#151310;padding:26px 28px">
      <p style="margin:0;color:#C1603F;font:500 11px/1.4 ui-monospace,monospace;letter-spacing:.16em;
                text-transform:uppercase">En Foco Studio</p>
      <p style="margin:8px 0 0;color:#FAF8F5;font:400 26px/1.15 Georgia,serif">${titulo}</p>
    </div>
    <div style="padding:26px 28px">
      <p style="margin:0;color:#151310;font:400 15px/1.65 -apple-system,Segoe UI,sans-serif">${cuerpo}</p>
      <p style="margin:22px 0 0;padding:12px 14px;background:#FBF0EA;border-radius:8px;
                color:#8A4A31;font:500 13px/1.5 -apple-system,Segoe UI,sans-serif">${recordatorio}</p>
      ${bloqueDatos}
      <p style="margin:24px 0 0;color:#7A7167;font:400 13px/1.6 -apple-system,Segoe UI,sans-serif">
        En Foco Studio · Mallorca<br>
        <a href="mailto:${escapar(contacto.email)}" style="color:#C1603F">${escapar(contacto.email)}</a>
      </p>
    </div>
  </div>
</div>`;

  const texto = html.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return { html, texto, titulo };
}

/* =============================================================================
   PUNTO DE ENTRADA
   entrada = { cuerpo: {...}, ip: '1.2.3.4' }
   salida  = { estado: 200, datos: {...} }
   ========================================================================== */
export async function gestionarContacto({ cuerpo = {}, ip = 'desconocida', env = process.env }) {
  const idioma = cuerpo.idioma === 'en' ? 'en' : 'es';
  const t = T[idioma];
  const no = (estado, mensaje, campo) => ({ estado, datos: { ok: false, error: mensaje, campo } });

  /* 1. ANTISPAM ---------------------------------------------------------- */
  // 1a. Campo trampa: es invisible para las personas, los robots lo rellenan
  if (cuerpo.web && String(cuerpo.web).trim() !== '') return no(400, t.spam);

  // 1b. Trampa de tiempo: nadie rellena nueve campos en menos de 3 segundos
  const transcurrido = Number(cuerpo.tiempo) || 0;
  if (transcurrido > 0 && transcurrido < 3000) return no(400, t.rapido);

  // 1c. Límite por IP
  if (!limitar(ip)) return no(429, t.demasiados);

  /* 2. VALIDACIÓN -------------------------------------------------------- */
  const datos = {};
  for (const c of CAMPOS) {
    const valor = typeof cuerpo[c.id] === 'string' ? cuerpo[c.id].trim() : '';
    if (c.obligatorio && !valor) return no(400, t.faltan, c.id);
    if (valor.length > c.max) return no(400, t.largo, c.id);
    datos[c.id] = valor;
  }
  if (!RE_EMAIL.test(datos.email)) return no(400, t.emailMal, 'email');
  // El teléfono es opcional: solo se comprueba el formato si han escrito algo.
  if (datos.telefono && !RE_TEL.test(datos.telefono)) return no(400, t.telMal, 'telefono');

  // 1d. Heurística de contenido: un mensaje plagado de enlaces es spam
  const enlaces = (datos.mensaje.match(/https?:\/\//g) || []).length;
  if (enlaces > 3) return no(400, t.spam, 'mensaje');

  /* 3. ADJUNTOS ---------------------------------------------------------- */
  // Llegan en base64 desde el navegador, y solo si pesan poco: mandar 30 fotos
  // por aquí reventaría el límite de cualquier función de servidor.
  const adjuntos = Array.isArray(cuerpo.adjuntos) ? cuerpo.adjuntos.slice(0, 10) : [];
  const attachments = adjuntos
    .filter((a) => a && a.nombre && a.contenido)
    .map((a) => ({ filename: String(a.nombre).slice(0, 120), content: a.contenido }));
  if (cuerpo.numArchivos) {
    datos.archivos = idioma === 'en'
      ? `${cuerpo.numArchivos} photo(s)`
      : `${cuerpo.numArchivos} foto(s)`;
    datos.adjuntas = attachments.length > 0;
  }

  /* 4. ENVÍO ------------------------------------------------------------- */
  const clave = env.RESEND_API_KEY;
  const destino = env.CONTACT_EMAIL;
  const remitente = env.MAIL_FROM || `En Foco Studio <${destino}>`;
  if (!clave || !destino) {
    console.error('[contacto] Faltan RESEND_API_KEY o CONTACT_EMAIL en el entorno.');
    return no(500, t.fallo);
  }

  const resend = new Resend(clave);
  const meta = { fecha: new Date().toLocaleString(idioma === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid' }) };
  const aviso = correoParaElEstudio(datos, idioma, meta);
  const confirmacion = correoParaElCliente(datos, idioma, { email: destino });

  /* Remitente de emergencia. Si el dominio propio todavía no está verificado en
     Resend, el envío fallaría y perderíamos un cliente. Antes que eso, se
     reintenta desde el dominio compartido de Resend. Es menos bonito y puede
     acabar en spam, pero la solicitud llega. En cuanto verifiques enfoco.site
     este camino deja de usarse solo. */
  const RESERVA = 'En Foco Studio <onboarding@resend.dev>';
  const sinVerificar = (m) => /not verified|domain is not/i.test(m || '');

  /* Remitente del AVISO INTERNO. Tiene que ser distinto de la dirección que lo
     recibe: un correo que llega de fuera diciendo venir de tu propia dirección
     es el patrón clásico de suplantación, y Google Workspace lo manda a spam o
     lo retiene aunque esté bien firmado. Con una dirección distinta del mismo
     dominio (no hace falta que exista buzón: Resend firma cualquier dirección
     del dominio verificado) el problema desaparece y el «responder» sigue
     yendo al cliente. La confirmación al cliente sí sale de studio@, que es la
     cara visible del estudio. */
  const dominioDelDestino = String(destino).split('@')[1] || '';
  const avisoDesde = env.NOTIFY_FROM ||
    (dominioDelDestino ? `En Foco · Web <web@${dominioDelDestino}>` : remitente);

  async function enviar(opciones, desde) {
    const origen = desde || remitente;
    let r = await resend.emails.send({ ...opciones, from: origen });
    if (r.error && sinVerificar(r.error.message) && origen !== RESERVA) {
      console.warn('[contacto] Dominio sin verificar; reintentando desde', RESERVA);
      r = await resend.emails.send({ ...opciones, from: RESERVA });
    }
    return r;
  }

  try {
    // 4a. El aviso al estudio es el que NO puede fallar
    const r1 = await enviar({
      to: [destino],
      replyTo: datos.email,           // responder va directo al cliente
      subject: `Solicitud web · ${datos.nombre} · ${datos.servicio}`,
      html: aviso.html,
      text: aviso.texto,
      ...(attachments.length ? { attachments } : {})
    }, avisoDesde);
    if (r1.error) throw new Error(r1.error.message || JSON.stringify(r1.error));
    apunta(ip, 'enviados');   // solo cuenta cupo lo que llega a salir

    // 4b. La confirmación al cliente es deseable, pero si falla no invalidamos
    //     el envío: para el negocio, lo importante es que la solicitud llegue.
    let avisoConfirmacion = null;
    try {
      const r2 = await enviar({
        to: [datos.email],
        replyTo: destino,
        subject: confirmacion.titulo,
        html: confirmacion.html,
        text: confirmacion.texto
      });
      if (r2.error) avisoConfirmacion = r2.error.message || 'no enviada';
    } catch (e) {
      avisoConfirmacion = e.message;
    }
    if (avisoConfirmacion) console.warn('[contacto] Confirmación no enviada:', avisoConfirmacion);

    return { estado: 200, datos: { ok: true, mensaje: t.ok, id: r1.data && r1.data.id, confirmacion: !avisoConfirmacion } };
  } catch (e) {
    console.error('[contacto] Fallo al enviar:', e.message);
    return no(502, t.fallo);
  }
}

export const _internos = { CAMPOS, correoParaElEstudio, correoParaElCliente };
