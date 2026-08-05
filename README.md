# En Foco Studio — web

Web estática, bilingüe (ES/EN), sin dependencias ni proceso de compilación.
Se abre con doble clic y se publica subiendo la carpeta tal cual.

---

## 1. Estructura

```
/
├─ index.html              Redirige al idioma del navegador (/es/ o /en/). No se indexa.
├─ robots.txt
├─ sitemap.xml
├─ design-dna.json         Perfil de estilo visual del que parte el diseño. Solo referencia.
│
├─ assets/
│  ├─ config.js            ← ÚNICO archivo que necesitas tocar para precios, cifras y contacto
│  ├─ style.css            Todo el diseño
│  └─ app.js               Toda la interacción (vanilla JS, sin librerías)
│
├─ es/
│  ├─ index.html           Página completa en español
│  ├─ aviso-legal.html
│  ├─ privacidad.html
│  └─ cookies.html
│
└─ en/
   ├─ index.html           Página completa en inglés
   ├─ legal-notice.html
   ├─ privacy.html
   └─ cookies.html
```

**Dónde está cada cosa:**

| Quiero cambiar… | Voy a… |
|---|---|
| Un precio, una cifra, el WhatsApp, el email, las redes | `assets/config.js` (se aplica a los dos idiomas a la vez) |
| Un texto de venta en español | `es/index.html` |
| Un texto de venta en inglés | `en/index.html` |
| Colores, tipografías, espaciados | El bloque `:root` al principio de `assets/style.css` |
| Comportamiento (pestañas, comparador, formulario) | `assets/app.js` |

Los textos de venta viven en el HTML de cada idioma a propósito: así Google los
lee sin ejecutar JavaScript y el inglés puede estar redactado, no traducido.

---

## 2. Verla en local

Doble clic en `es/index.html` funciona para echar un vistazo, pero para que todo
se comporte igual que en producción conviene levantar un servidor:

```bash
npx -y serve -l 5173 .
```

Y abrir `http://localhost:5173/es/`.

---

## 3. Publicarla en Vercel

El dominio del proyecto es **enfoco.site**, y ya está escrito en los `canonical`,
los `hreflang`, el `sitemap.xml`, el `robots.txt` y los datos estructurados. Si
algún día cambias de dominio, búscalo y reemplázalo en esos sitios.

**No es una web puramente estática.** El formulario necesita una función de
servidor, así que hay que desplegar el repositorio entero, no arrastrar una
carpeta.

1. En [vercel.com](https://vercel.com) → *Add New* → *Project* → importa el
   repositorio de GitHub.
2. Framework preset: **Other**. Build command y output directory: **vacíos**.
   No hay compilación; `vercel.json` ya lleva la configuración.
3. En *Settings → Environment Variables* añade las tres, para *Production* y
   *Preview*:

   | Variable | Valor |
   |---|---|
   | `RESEND_API_KEY` | tu clave de Resend |
   | `CONTACT_EMAIL` | `studio@enfoco.site` |
   | `MAIL_FROM` | `En Foco Studio <studio@enfoco.site>` |

4. *Settings → Domains* → añade `enfoco.site` y sigue los DNS que te indique.
5. **Prueba el formulario en el dominio real** antes de darlo por hecho. Es el
   único punto donde un fallo silencioso te cuesta clientes sin que te enteres.

`api/contact.js` se convierte solo en `https://enfoco.site/api/contact`, que es
justo la dirección a la que el formulario ya envía. No hay que configurar rutas.

> El proyecto conserva también `netlify.toml` y `netlify/functions/`. No estorban
> y sirven si algún día quieres mover el alojamiento. Si no los vas a usar, se
> pueden borrar sin tocar nada más.

---

## 4. El formulario y el correo (Resend)

El formulario envía de verdad. Cuando alguien lo rellena salen **dos correos**:

1. **A ti**, a `studio@enfoco.site`, con los nueve campos en una tabla y las fotos
   adjuntas. El «responder» va directo al cliente, así que contestas sin copiar
   nada a mano.
2. **A quien lo ha rellenado**, confirmándole que ha llegado y qué pasa ahora.

### Por dónde pasa

```
formulario (assets/app.js)
   └─ POST /api/contact  ── JSON con los campos + fotos en base64
        └─ server/contacto.js   ← toda la lógica: validación, antispam, envío
             ├─ en local        : server/dev.js
             ├─ en Vercel       : api/contact.js
             └─ en Netlify      : netlify/functions/contact.js
```

`server/contacto.js` es el único sitio donde vive la lógica. Los otros dos archivos
solo le pasan la petición, así que **lo que pruebas en local es exactamente lo que
corre publicado**.

### La clave nunca está en la web

`RESEND_API_KEY` se lee de variables de entorno en el servidor. No aparece en
ningún archivo que se descargue el visitante. Quien tenga esa clave puede mandar
correo en tu nombre, así que:

- `.env` está en `.gitignore`, en `.vercelignore` y bloqueado en `netlify.toml`.
  No se sube al repositorio ni llega al servidor de despliegue.
- Si algún día subes la carpeta a mano por FTP, **borra `.env` antes**.
- En producción las variables se ponen en el panel del hosting
  (Vercel → *Settings* → *Environment Variables*), no en un archivo.

Variables que usa:

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` | La clave de Resend |
| `CONTACT_EMAIL` | Dónde te llegan los avisos |
| `MAIL_FROM` | Desde qué dirección salen los correos |
| `PORT` | Solo para el servidor local |

### El dominio tiene que estar verificado

Para que los correos salgan desde `studio@enfoco.site`, Resend necesita comprobar
que el dominio es tuyo. Entra en [resend.com/domains](https://resend.com/domains),
añade `enfoco.site` y copia los registros DNS que te dé (SPF, DKIM y DMARC) en el
panel de tu proveedor de dominio. Tarda entre unos minutos y unas horas.

Mientras no lo esté, el código **no se cae**: detecta el fallo y reenvía desde
`onboarding@resend.dev`, el dominio compartido de Resend. La solicitud te llega
igual, pero con dos pegas — se ve un remitente que no es el tuyo, y ese dominio
compartido solo puede escribir a la dirección con la que creaste la cuenta, así
que **la confirmación al cliente no le llegará**. Es una red de seguridad para no
perder clientes, no un destino. Verifica el dominio.

### Probarlo

```bash
npm install
npm run test:email
```

Manda un envío real a tu propia dirección sin abrir el navegador y te dice si ha
salido. Para probarlo con la web entera delante:

```bash
npm run dev
```

### Antispam

Cuatro filtros, ninguno molesta a un cliente real:

- **Campo trampa.** Un campo invisible para las personas que los robots rellenan.
- **Reloj.** Un formulario enviado en menos de tres segundos no lo ha escrito nadie.
- **Cupo por IP.** Cinco envíos por hora. Los intentos con errores de escritura
  cuentan aparte y con un tope mucho más alto, para no castigar a quien se equivoca
  al teclear el teléfono.
- **Exceso de enlaces.** Más de tres enlaces en el mensaje es publicidad.

### Sobre las fotos

Los adjuntos se cortan en **3 MB en total o 10 archivos**. Si el visitante sube
más, el envío sale igual pero sin adjuntos: no se pierde el cliente por unas fotos.
Para eso está el campo «pega un enlace de Drive o WeTransfer», que además es lo que
usa la mayoría cuando manda treinta fotos.

---

## 5. Vídeo del hero

En `assets/config.js`:

```js
media: {
  heroVideo:  '../assets/video/hero.mp4',
  heroPoster: '../assets/video/hero.jpg',
}
```

Crea la carpeta `assets/video/` y mete ahí los archivos. Recomendaciones:

- MP4 H.264, **sin pista de audio**, 1920×1080
- 10–15 segundos en bucle, **menos de 6 MB** (comprímelo en handbrake.fr)
- `hero.jpg` es el primer fotograma, para que se vea algo mientras carga

### Importante: los MP4 tienen que ir en «faststart»

Un MP4 guarda su índice en un átomo llamado `moov`. Si queda al final del archivo,
el navegador tiene que descargarse el vídeo casi entero antes de poder empezar a
reproducir, y parece que está roto. Le pasaba al vídeo del caso destacado: el índice
estaba detrás de 9,29 MB de datos.

Al exportar, marca la casilla **«web optimized» / «faststart»**. Si tu editor no la
tiene, se arregla después con una sola orden:

```bash
ffmpeg -i entrada.mp4 -c copy -movflags +faststart salida.mp4
```

Para comprobar si un archivo ya lo cumple, `moov` debe aparecer **antes** que `mdat`
al inspeccionar el contenedor.

Si dejas `heroVideo` vacío, se muestra un fondo ilustrado de respaldo que ya viene
incluido. La web no se rompe.

---

## 6. Marcadores de posición

Todas las imágenes son ilustraciones SVG generadas por `app.js`. Se ven bien, pero
hay que sustituirlas. Búscalas por el atributo `data-ph`:

| Atributo | Qué es | Dónde |
|---|---|---|
| `data-ph="before"` / `data-ph="after"` | Los comparadores antes/después | Bloque del problema, servicios, caso destacado |

**Estado actual:** los cuatro comparadores son ya fotos reales por los dos lados: los
tres del bloque del problema (estudio, entrada y baño, terraza) y el del caso destacado
(salón y comedor). El caso destacado tiene además su vídeo real, que solo se descarga al
pulsar reproducir. Los únicos marcadores que quedan son los seis avatares de las reseñas,
que hay que sustituir junto con los textos.

Los seis archivos están ya comprimidos y suman **2,7 MB** (antes eran 8,3 MB).

**Pendiente con estas imágenes:**

1. **El par 1 no encaja de proporción.** El «antes» está exportado en 16:9 (2560×1438) y
   su «después» en 4:3 (1448×1086). Como el contenedor recorta cada uno por un lado
   distinto, las dos mitades no casan en la costura. Los pares 2 y 3 sí coinciden
   exactamente (1,335 vs 1,334 y 1,499 vs 1,499), así que la solución es reexportar el
   «antes» del par 1 con el mismo encuadre y proporción que su versión retocada.
2. **Opcional:** los tres «después» siguen siendo PNG de 500–660 KB. Pasarlos a JPEG de
   calidad 85 o a WebP los dejaría en 150–250 KB sin diferencia visible, y el bloque
   entero bajaría de 2,7 MB a menos de 1 MB.

| `data-ph="vertical"` | Miniaturas de vídeo vertical | Portfolio y fichas de servicio |
| `data-ph="avatar"` | Fotos de las reseñas | Opiniones |
| ~~`data-ph="team"`~~ | Retirado: «Quiénes somos» va solo con texto | — |

Para sustituir uno, mete un `<img>` dentro del elemento y `app.js` dejará de generar
el marcador automáticamente:

```html
<div class="ba__before" data-ph="before">
  <img src="../assets/img/salon-antes.jpg" alt="Salón antes del retoque" loading="lazy">
</div>
```

---

## 6 bis. El movimiento de la página

La coreografía la lleva **GSAP 3.15 + ScrollTrigger**, en `assets/motion.js`.
Las librerías están servidas desde el propio dominio (`assets/vendor/`), no desde
un CDN: así no se añade ningún tercero y la política de cookies sigue valiendo tal
cual. Pesan 115 KB entre las dos y van con `defer`, así que no bloquean el pintado.

GSAP se distribuye bajo su licencia estándar «sin cargo», que cubre sitios donde no
se cobra al visitante por acceder. Este lo es. Si algún día montas un producto de
pago con ella, revisa las condiciones en gsap.com.

`assets/app.js` conserva toda la funcionalidad (pestañas, formulario, modales,
comparadores) **y un sistema de animación de respaldo**: si GSAP no llegara a
cargar, la página se sigue animando sola con IntersectionObserver. El relevo se
decide con la clase `gsap-on` que `app.js` pone en `<html>`.

Lo que hace `motion.js`, por bloques: entrada del hero, entradas generales con
escalonado, barra de progreso, marquesina que reacciona a la velocidad del scroll,
barrido automático de los comparadores antes/después, parallax, la frase «Sin
visitas» anclada mientras se escala, barra de cifras, línea de tiempo que se dibuja,
navegación que se aparta al bajar y entrada en cortina de las secciones oscuras.

Lo caro (anclajes y parallax) solo se monta en escritorio, mediante `gsap.matchMedia()`.
En móvil se queda en 31 disparadores frente a los 110 de escritorio.

Además se sigue configurando desde el HTML con atributos:

| Atributo | Qué hace |
|---|---|
| `data-split` | El titular entra palabra a palabra, con máscara y escalonado |
| `data-stagger` | Los hijos de esa rejilla entran uno detrás de otro, sin escribir retardos a mano |
| `data-par="0.14"` | Parallax suave. El número es la intensidad |
| `data-mag` | Botón magnético: se inclina hacia el cursor. Solo con ratón |
| `data-corners-auto` | Las escuadras de la marca se dibujan al entrar en pantalla |

Además, sin necesidad de atributos: barra de progreso de lectura bajo la navegación,
marquesina infinita con los lemas, y un **cursor de enfoque** (las cuatro escuadras del
logo siguen al puntero y se abren sobre lo que se puede pulsar). Los dos últimos solo
aparecen con ratón; en móvil no existen.

Cuatro reglas que conviene no romper si añades más:

1. Solo `transform`, `opacity` y variables CSS. Nada que provoque recálculo de layout.
2. Todo dentro de `gsap.matchMedia()`, que desmonta y vuelve a montar solo al cambiar
   de tamaño o si el visitante activa «reducir movimiento».
3. Usa `fromTo` con el estado final escrito, **nunca `from` a secas**. El CSS parte de
   `opacity:0` para evitar parpadeos, y `from` devuelve el elemento a ese estado: la
   animación termina dejándolo invisible. Es el fallo más fácil de cometer aquí.
4. Si el CSS parte de un porcentaje (`translateY(105%)`), pon a cero **`y` y `yPercent`**.
   GSAP convierte el porcentaje a píxeles al leerlo y, si solo anulas uno, queda un resto.

Hay una red de seguridad en `motion.js`: al terminar cada scroll repasa si algún bloque
se quedó sin revelar (pasa con saltos de ancla muy rápidos) y lo muestra. Con eso, ningún
contenido puede quedarse invisible por un fallo de animación.

Para bajar el nivel de movimiento: quita los atributos del HTML. Para subirlo, añádelos.

---

## 7. Accesibilidad y rendimiento

Ya está resuelto:

- HTML semántico, `alt` en todas las imágenes, enlace de salto al contenido
- Navegación completa por teclado, incluidas pestañas con flechas y foco atrapado en los modales
- Contraste comprobado sobre fondo hueso y sobre fondo oscuro
- `prefers-reduced-motion` respetado: se desactivan animaciones, desenfoque y contadores
- Sin librerías externas. Solo se cargan tres fuentes desde Google Fonts, con `preconnect`

**Si quieres eliminar hasta Google Fonts** (más rápido y sin conexión a terceros):
descarga Fraunces, Inter e IBM Plex Mono desde fonts.google.com, colócalas en
`assets/fonts/`, sustituye el `<link>` de cada HTML por `@font-face` en `style.css`
y añade `font-display:swap`.

---

## 8. Qué tienes que preparar antes de publicarla

Por orden de importancia:

1. **Tres o cuatro parejas antes/después reales.** Es la prueba de todo el negocio.
   Sin esto la web no vende. Pide permiso por escrito a los propietarios.
2. **El póster del vídeo del hero.** El vídeo ya está puesto (`assets/video/hero.mp4`,
   0,7 MB, en bucle y sin audio). Falta el primer fotograma en JPG para
   `config.js → media.heroPoster`: sin él, durante la carga se ve un instante la
   ilustración de respaldo. También falta el vídeo del caso destacado.
3. **Reseñas reales.** Las seis que hay son de ejemplo y están marcadas con comentarios
   en el código. Publicar reseñas inventadas es publicidad engañosa: bórralas o
   sustitúyelas, y quita también el bloque `aggregateRating` del JSON-LD si aún no
   tienes reseñas verificables.
4. **El nombre y la ciudad del caso destacado.** El texto ya describe lo que se ve en
   las fotos, pero el título es genérico. Ponle el nombre real del alojamiento, con
   permiso del propietario. Las tres casillas de resultados son ahora hechos del
   trabajo, no cifras de rendimiento: en cuanto tengas una captura del panel de un
   cliente que demuestre un resultado, cambia una de las tres por ese dato.
5. **Foto real del equipo** para el bloque "Sobre nosotros".
6. **Tus cifras reales** en `config.js` → `stats`. No las infles.
7. **El email y las redes** en `config.js`. Ciudad (Mallorca), teléfono y WhatsApp
   (+34 602 01 32 69) ya están puestos.
8. **La guía de fotos en PDF**, en español y en inglés, subida y enlazada en
   `config.js` → `media.guidePdfES` / `guidePdfEN`. Se menciona en cuatro sitios de la web.
9. **Las tres páginas legales completadas** y revisadas por tu asesoría. Todo lo que
   está entre `[corchetes]` hay que rellenarlo.
10. **El dominio** sustituido en todos los archivos (punto 3) y el sitemap enviado en
    Google Search Console, para las dos versiones de idioma.
11. **Dos imágenes Open Graph** de 1200×630 px: `assets/og-es.jpg` y `assets/og-en.jpg`.
12. **El dominio `enfoco.site` verificado en Resend** (punto 4) y las variables de
    entorno puestas en el panel del hosting. Sin esto los correos salen desde una
    dirección que no es la tuya y el cliente no recibe confirmación.

Un detalle legal que conviene no saltarse: si añades Google Analytics, píxel de Meta
o vídeos incrustados de YouTube, **tendrás que poner un banner de consentimiento de
cookies**. Tal y como se entrega, la web no instala ninguna cookie y por eso no lo lleva.

---

## 9. Dos cosas que hay que comprobar sí o sí

**Qué acepta cada plataforma hoy.** Booking y Vrbo permiten subir vídeo a la ficha
del alojamiento. Airbnb ha permitido y retirado el vídeo en anuncios varias veces, y
no siempre para todos los anfitriones. Entra en tu propio panel de cada plataforma y
comprueba qué admite antes de publicar. Hay dos sitios en la web marcados con
`### VERIFICAR ###` que dependen de esa respuesta: la pregunta «¿Dónde puedo publicar
el vídeo?» de la FAQ y la ficha «Dónde se publica cada vídeo» de servicios. Prometer
algo que la plataforma no permite es la vía más rápida a una devolución.

**Los volúmenes de la suscripción.** Están en `assets/config.js` → `plans`, como
`photos` y `videos`. Ahora mismo el Plan Temporada incluye hasta 30 fotos y 10 vídeos
al mes por 199 €. A tus propias tarifas, esas 30 fotos ya son 105 € y esos 10 vídeos
pasan de 900 €: en el peor mes entregas más de 1.000 € de trabajo por 199 €. En la web
están redactados como topes («hasta X»), no como entrega garantizada, precisamente para
que puedas defenderlo. Aun así, revisa esos dos números en cuanto tengas tres o cuatro
suscriptores reales y veas cuánto consumen de verdad.
