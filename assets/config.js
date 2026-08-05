/* =============================================================================
   EN FOCO STUDIO — BLOQUE DE CONFIGURACIÓN ÚNICO
   =============================================================================
   Este es el ÚNICO sitio donde tienes que tocar precios, cifras, contacto y
   enlaces. Lo cargan las dos versiones del sitio (/es/ y /en/), así que un
   cambio aquí se aplica automáticamente a español e inglés.

   Los textos de venta NO están aquí a propósito: viven directamente en el HTML
   de cada idioma (es/index.html y en/index.html) para que Google los lea sin
   ejecutar JavaScript. Cada texto largo está marcado con comentarios.

   Todo lo marcado con  ### SUSTITUIR ###  es contenido de ejemplo.
   ========================================================================== */

window.ENFOCO = {

  /* --- 1. NEGOCIO Y CONTACTO ------------------------------------------- */
  business: {
    name: 'En Foco Studio',
    shortName: 'En Foco',
    city: 'Mallorca',
    country: 'España',
    countryEN: 'Spain',
    email: 'studio@enfoco.site',       // a esta dirección llegan los botones de "escribir por email"
    phone: '+34602013269',               // formato internacional sin espacios
    phoneDisplay: '+34 602 01 32 69',
    whatsapp: '34602013269',             // sin + ni espacios
    whatsappMsgES: 'Hola, quiero un vídeo de prueba gratis para mi alojamiento.',
    whatsappMsgEN: 'Hi, I would like a free test video for my rental.',
    instagram: 'https://instagram.com/enfocostudio',   // ### SUSTITUIR ###
    tiktok: 'https://tiktok.com/@enfocostudio',        // ### SUSTITUIR ###
    linkedin: 'https://linkedin.com/company/enfocostudio', // ### SUSTITUIR ###
    domain: 'https://enfoco.site'   // sin barra final
  },

  /* --- 2. BARRA DE CONFIANZA (contadores animados) ---------------------
     ### SUSTITUIR ### por cifras reales. No infles nada: si llevas 3 meses,
     pon lo que llevas. Un número pequeño y verdadero convierte mejor que uno
     grande que no puedes demostrar.                                        */
  stats: {
    properties: 120,        // alojamientos transformados
    videos: 340,            // vídeos entregados
    countries: 9,           // países
    rating: 4.9,            // valoración media (sobre 5)
    reviewCount: 47         // nº de reseñas (se usa en los datos estructurados)
  },

  /* --- 3. PLAZOS -------------------------------------------------------- */
  delivery: {
    testVideoHours: 48,     // horas hasta el vídeo de prueba
    retouchDays: 3,         // días de entrega del retoque
    videoDays: 5            // días de entrega de vídeo completo
  },

  /* --- 4. PRECIOS: SERVICIOS SUELTOS ----------------------------------
     Los valores son números; el símbolo € y el formato los pone la web.   */
  prices: {

    /* Imagen */
    retouchPhoto:        5,      // retoque profesional por foto
    retouchPhotoBulk:    3.5,    // por foto a partir de 20 fotos
    retouchBatch15:      60,     // lote de 15 fotos retocadas
    objectRemoval:       8,      // eliminación de objetos/cables/desorden por foto
    skyChange:           5,      // cambio de cielo por foto
    homeStaging:        25,      // home staging virtual por foto
    reframe:            25,      // reencuadre para todas las plataformas, por anuncio

    /* Vídeo del anuncio — EL PRODUCTO PRINCIPAL */
    tour:              150,      // vídeo tour completo del alojamiento, 60–90 s
    videoShort:         90,      // vídeo corto de presentación, 20–30 s
    videoPack3:        220,      // pack de 3 vídeos de espacios o amenities

    /* Vídeo para redes sociales — extra secundario, no es el foco del negocio */
    reel:               90,      // reel vertical 30–45 s
    reelPack3:         220,      // pack de 3 reels
    clipPack8:         180,      // pack de 8 clips sueltos para un mes

    /* Otros */
    copywriting:        70,      // redacción del anuncio ES + EN
    floorplan2d:        40       // plano 2D de distribución
  },

  /* --- 5. PRECIOS: PACKS (pago único) ----------------------------------
     alacarte = lo que costaría exactamente lo mismo contratado suelto.
     Si cambias el contenido de un pack, recalcula este número o quítalo.   */
  packs: {
    essential: { price: 129, alacarte: 150 },   // 15 fotos (60) + vídeo corto (90)
    complete:  { price: 349, alacarte: 552 },   // 25 fotos (87,50) + tour (150) + 3 vídeos (220) + reencuadre (25) + textos (70)
    brand:     { price: 590, alacarte: 847 }    // lo anterior + staging 3 fotos (75) + plano (40) + 8 clips (180)
  },

  /* --- 6. PRECIOS: SUSCRIPCIÓN MENSUAL --------------------------------
     annual = precio por mes cuando se paga el año entero (2 meses gratis).
     Fórmula: mensual × 10 / 12. Si cambias el mensual, recalcula el anual.

     photos / videos = TOPES MÁXIMOS incluidos cada mes. Están redactados en la
     web como "hasta X" a propósito: son un límite, no una entrega garantizada.

     ATENCIÓN AL MARGEN: los precios están puestos para competir con el videomaker
     de real estate, que cobra entre 250 € y 600 € por una sola sesión. Pero los
     topes siguen siendo los de antes: 30 fotos a tarifa de volumen ya son 105 € y
     10 vídeos sueltos pasan de 900 €. Con el Temporada a 149 €, el mes en que un
     cliente agote su tope pierdes dinero. Si hay que ajustar algo, ajusta ESTOS
     DOS NÚMEROS, no el precio.                                              */
  plans: {
    host:    { monthly:  79, annual:  65.83, annualTotal:  790, photos: 15, videos:  4 },
    season:  { monthly: 149, annual: 124.17, annualTotal: 1490, photos: 30, videos: 10 },
    manager: { monthly:  45, annual:  37.50, annualTotal:  450, photos: 10, videos:  3, minUnits: 5 }
  },
  annualDiscountPct: 17,     // se muestra junto al conmutador

  /* --- 7. MEDIA ---------------------------------------------------------
     Deja el valor vacío ('') y la web muestra un marcador de posición
     generado en SVG. En cuanto pongas una ruta real, se usa esa.
     Recomendado: MP4 H.264, sin audio, < 6 MB, 1920×1080, 10–15 s en bucle. */
  media: {
    heroVideo:  '../assets/video/hero.mp4',
    heroPoster: '',                       // ### PENDIENTE ### primer fotograma en JPG, para que
                                          // no se vea el fondo de respaldo mientras carga el vídeo
    caseVideo:  '../assets/video/caso.mp4', // se carga solo al pulsar "reproducir"
    teamPhoto:  '',                       // sin uso: el bloque "quiénes somos" va sin foto
    guidePdfES: '#',                      // ### SUSTITUIR ### PDF de la guía de fotos en español
    guidePdfEN: '#'                       // ### SUSTITUIR ### PDF de la guía de fotos en inglés
  },

  /* --- 8. FORMULARIO ----------------------------------------------------
     Déjalo vacío. El formulario envía a /api/contact, que es la función del
     propio proyecto (api/contact.js en Vercel, server/dev.js en local) y la
     que habla con Resend. Solo hay que rellenar `endpoint` si algún día
     quieres desviar los envíos a un servicio externo.
     Todo explicado en README.md, sección 4.                                 */
  form: {
    endpoint: '',
    method: 'POST'
  },

  /* --- 9. PAÍSES EN LOS QUE TRABAJAMOS ---------------------------------
     Se usan en el pie y en los datos estructurados de área de servicio.     */
  countries: ['España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Países Bajos', 'Grecia', 'Croacia', 'Chequia'],
  countriesEN: ['Spain', 'Portugal', 'France', 'Italy', 'Germany', 'Netherlands', 'Greece', 'Croatia', 'Czechia']
};
