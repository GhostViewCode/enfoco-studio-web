/* =============================================================================
   PRUEBA DE ENVÍO
   =============================================================================
   Ejecuta la misma lógica que usa el formulario, sin navegador. Sirve para
   comprobar que la clave de Resend funciona y que el dominio está verificado.

   Uso:  npm run test:email
   ========================================================================== */

import 'dotenv/config';
import { gestionarContacto } from './contacto.js';

const prueba = {
  idioma: 'es',
  nombre: 'Prueba Técnica',
  email: process.env.CONTACT_EMAIL,       // se envía a la propia dirección
  telefono: '+34 602 01 32 69',
  ubicacion: 'España, Mallorca',
  tipo: 'Piso o apartamento turístico',
  servicio: 'Vídeo de prueba gratis',
  anuncio: 'https://airbnb.com/rooms/ejemplo',
  enlaceFotos: 'https://drive.google.com/ejemplo',
  mensaje: 'Envío de prueba lanzado desde npm run test:email. Si lees esto, el formulario funciona.',
  tiempo: 9000,
  web: ''
};

console.log('\n  Enviando prueba a ' + process.env.CONTACT_EMAIL + ' …\n');
const r = await gestionarContacto({ cuerpo: prueba, ip: 'prueba-local' });
console.log('  estado HTTP : ' + r.estado);
console.log('  respuesta   : ' + JSON.stringify(r.datos));
console.log(r.estado === 200
  ? '\n  ✓ Enviado. Revisa la bandeja de ' + process.env.CONTACT_EMAIL + '\n'
  : '\n  ✗ No se envió. Lee el mensaje de arriba.\n');
process.exit(r.estado === 200 ? 0 : 1);
