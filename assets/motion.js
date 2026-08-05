/* =============================================================================
   EN FOCO STUDIO — COREOGRAFÍA CON GSAP + SCROLLTRIGGER
   =============================================================================
   Este archivo SOLO anima. Toda la funcionalidad (pestañas, formulario, modales,
   comparadores…) sigue en app.js, que cede el control del movimiento cuando
   detecta GSAP y marca <html class="gsap-on">.

   Tres reglas que conviene no romper:
     1. Solo transform, opacity y variables CSS. Nada que provoque reflow.
     2. Todo dentro de gsap.matchMedia(), para que se desmonte solo al cambiar
        de tamaño o si el visitante activa "reducir movimiento".
     3. En móvil se recorta lo caro: nada de pin ni de parallax pesado.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var mm = gsap.matchMedia();
  var ESCRITORIO = '(prefers-reduced-motion: no-preference) and (min-width: 901px)';
  var MOVIL      = '(prefers-reduced-motion: no-preference) and (max-width: 900px)';
  var CUALQUIERA = '(prefers-reduced-motion: no-preference)';

  /* ---------------------------------------------------------------------------
     1. ENTRADA DEL HERO
     Una sola línea de tiempo al cargar: el panel sube, el titular se descubre
     línea a línea y los botones aparecen al final. Después, al hacer scroll,
     todo el bloque se va con un ligero desenfoque de profundidad.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var panel = $('.hero__panel');
    if (!panel) return;

    /* Todo con fromTo y el final escrito a mano. Con .from(), GSAP devuelve el
       elemento a su estado "natural", que aquí es el del CSS —opacidad 0 y
       desplazado— y el hero se quedaba invisible al terminar la animación. */
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(panel, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
      /* `y: 0` además de `yPercent: 0` no es redundante: el CSS parte de
         translateY(105%) y GSAP lo convierte a píxeles al leerlo. Si solo se
         anula el porcentaje, queda un resto en píxeles y el texto se ve cortado
         por arriba dentro de la máscara. */
      .fromTo($$('.hero .mask > span'),
        { yPercent: 108, y: 0 },
        { yPercent: 0, y: 0, duration: 1.15, stagger: 0.09, ease: 'expo.out' }, 0.15)
      .fromTo($('.hero__label'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .7 }, 0.35)
      .fromTo($('.hero__sub'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .8 }, 0.6)
      .fromTo($$('.hero__cta .btn'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, stagger: .1 }, 0.75)
      .fromTo($('.hero__promise'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .7 }, 0.95);

    /* Salida por scroll: el panel se aleja y el vídeo se acerca.
       Va con fromTo e immediateRender:false por un motivo concreto: si se usa
       `to`, GSAP fija el estado inicial en el primer render, que ocurre mientras
       la línea de tiempo de entrada todavía está corriendo. Guardaba entonces
       "opacidad 0, y 34" como punto de partida y, al volver arriba del todo, el
       hero rebobinaba hasta ahí y desaparecía. */
    gsap.fromTo(panel,
      { y: 0, opacity: 1 },
      { y: -60, opacity: .25, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.hero', start: 'bottom bottom', end: 'bottom top', scrub: .6 } });

    gsap.fromTo('.hero__media',
      { scale: 1 },
      { scale: 1.12, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
  });

  /* ---------------------------------------------------------------------------
     2. ENTRADAS GENERALES
     Sustituye al sistema de clases .rise/.in de app.js. ScrollTrigger.batch
     agrupa los elementos que entran a la vez y los escalona, que es lo que hace
     que un bloque se sienta compuesto y no una suma de piezas sueltas.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    ScrollTrigger.batch('.rise', {
      start: 'top 88%',
      once: true,
      onEnter: function (lote) {
        gsap.to(lote, {
          opacity: 1, y: 0, duration: .95, ease: 'power3.out',
          stagger: { each: .08, from: 'start' },
          overwrite: true
        });
      }
    });

    /* Red de seguridad. ScrollTrigger.batch puede saltarse elementos si el
       scroll va muy rápido —un salto de ancla desde el menú, por ejemplo— y en
       una web comercial que un bloque se quede invisible es inaceptable. Esto
       repasa al terminar cada scroll y revela lo que haya quedado atrás. */
    var repasar = function () {
      var pendientes = $$('.rise').filter(function (el) {
        if (el.closest('[hidden]')) return false;
        if (gsap.getProperty(el, 'opacity') >= 1) return false;
        return el.getBoundingClientRect().top < window.innerHeight * 0.95;
      });
      if (pendientes.length) {
        gsap.to(pendientes, { opacity: 1, y: 0, duration: .5, ease: 'power2.out', overwrite: true });
      }
    };
    ScrollTrigger.addEventListener('scrollEnd', repasar);
    gsap.delayedCall(1.2, repasar);

    // Titulares troceados en palabras por app.js
    $$('[data-split]').forEach(function (h) {
      var palabras = $$('.w > i', h);
      if (!palabras.length) return;
      // Mismo motivo que en el hero: hay que anular el resto en píxeles
      gsap.to(palabras, {
        yPercent: 0, y: 0, duration: 1.05, ease: 'expo.out', stagger: .035,
        scrollTrigger: { trigger: h, start: 'top 86%', once: true }
      });
    });

    // Máscaras sueltas que no sean las del hero, que tienen su propia entrada
    $$('.mask > span').forEach(function (s) {
      if (s.closest('.hero')) return;
      gsap.to(s, {
        yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: s.parentElement, start: 'top 88%', once: true }
      });
    });
  });

  /* ---------------------------------------------------------------------------
     3. BARRA DE PROGRESO DE LECTURA
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var barra = $('.progress');
    if (!barra) return;
    gsap.to(barra, {
      scaleX: 1, ease: 'none', transformOrigin: '0 50%',
      scrollTrigger: { start: 0, end: 'max', scrub: .25 }
    });
  });

  /* ---------------------------------------------------------------------------
     4. MARQUESINA REACTIVA
     El bucle base va solo; la velocidad y el sentido los marca el scroll. Al
     bajar acelera hacia la izquierda, al subir se da la vuelta. Es el detalle
     que más "vivo" hace el conjunto y cuesta muy poco.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var pista = $('.marquee__track');
    if (!pista) return;

    var bucle = gsap.to(pista, {
      xPercent: -50, ease: 'none', duration: 26, repeat: -1
    });
    var sentido = 1;
    var st = ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        var s = v < 0 ? -1 : 1;
        if (s !== sentido) { sentido = s; gsap.to(bucle, { timeScale: s, duration: .35 }); }
        // Un empujón proporcional a la velocidad, con tope para que no se dispare
        var extra = gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 900);
        gsap.to(bucle, { timeScale: sentido * extra, duration: .25, overwrite: true });
        gsap.to(bucle, { timeScale: sentido, duration: 1.4, delay: .25, overwrite: 'auto' });
      }
    });

    return function () { bucle.kill(); st.kill(); };
  });

  /* ---------------------------------------------------------------------------
     5. COMPARADORES ANTES / DESPUÉS
     Al entrar en pantalla se barren solos de derecha a izquierda y se paran en
     el centro. Enseña de un vistazo que la imagen es interactiva, que es el
     problema número uno de este componente: mucha gente no lo toca nunca.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    $$('.ba').forEach(function (ba) {
      var rango = $('.ba__range', ba);
      if (!rango) return;
      var proxy = { p: 100 };
      var pintar = function () {
        ba.style.setProperty('--pos', proxy.p + '%');
        ba.style.setProperty('--posn', proxy.p);
        rango.value = proxy.p;
      };
      pintar();
      gsap.to(proxy, {
        p: 50, duration: 1.6, ease: 'power2.inOut', onUpdate: pintar,
        scrollTrigger: { trigger: ba, start: 'top 78%', once: true }
      });
    });
  });

  /* ---------------------------------------------------------------------------
     6. PARALLAX (solo escritorio: en móvil no aporta y cuesta fotogramas)
     ------------------------------------------------------------------------ */
  mm.add(ESCRITORIO, function () {
    $$('[data-par]').forEach(function (el) {
      var fuerza = parseFloat(el.getAttribute('data-par')) || .12;
      gsap.fromTo(el,
        { yPercent: -fuerza * 50 },
        { yPercent: fuerza * 50, ease: 'none',
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: .5 } });
    });

    // Las fotos de los comparadores respiran un poco al pasar
    $$('.ba__layer img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.06 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.ba'), start: 'top bottom', end: 'bottom top', scrub: .8 }
      });
    });
  });

  /* ---------------------------------------------------------------------------
     7. LA FRASE FUERTE, ANCLADA
     "Sin visitas. Sin cuadrar agendas." se queda fija mientras se escala y
     cambia de peso visual. Es el momento de respiro de la página.
     ------------------------------------------------------------------------ */
  mm.add(ESCRITORIO, function () {
    var frase = $('.steps__note');
    if (!frase) return;
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: frase, start: 'center 62%', end: '+=420',
        pin: true, pinSpacing: true, scrub: .8
      }
    });
    tl.fromTo(frase, { scale: .94, opacity: .55 }, { scale: 1, opacity: 1, ease: 'power2.out' })
      .to(frase, { scale: 1.02, opacity: .9, ease: 'power2.in' });
  });

  /* ---------------------------------------------------------------------------
     8. BARRA DE CIFRAS
     Los cuatro datos entran escalonados y los separadores se dibujan de arriba
     abajo. Ojo: aquí NO se tocan las tarjetas de precios ni de servicios, porque
     viven dentro de pestañas ocultas y ScrollTrigger no puede medir lo que no
     tiene caja. De esas se encarga showIn() en app.js al cambiar de pestaña.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var barra = $('.stats__grid');
    if (!barra) return;
    gsap.fromTo(barra.children,
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: .85, ease: 'power3.out', stagger: .1,
        scrollTrigger: { trigger: barra, start: 'top 88%', once: true } });
    gsap.fromTo($$('.stats__n', barra),
      { scale: .9 },
      { scale: 1, duration: 1, ease: 'back.out(1.6)', stagger: .1,
        scrollTrigger: { trigger: barra, start: 'top 88%', once: true } });
  });

  /* ---------------------------------------------------------------------------
     9. LÍNEA DE TIEMPO DE "CÓMO FUNCIONA"
     La línea superior se dibuja con el scroll y cada paso entra tras ella.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var pasos = $('.steps');
    if (!pasos) return;
    gsap.fromTo(pasos, { '--linea': '0%' }, {
      '--linea': '100%', ease: 'none',
      scrollTrigger: { trigger: pasos, start: 'top 80%', end: 'bottom 70%', scrub: .6 }
    });
    gsap.fromTo($$('.steps__item', pasos),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: .8, ease: 'power3.out', stagger: .12,
        scrollTrigger: { trigger: pasos, start: 'top 78%', once: true } });
  });

  /* ---------------------------------------------------------------------------
     10. NAVEGACIÓN QUE SE APARTA
     Baja el scroll y la barra se retira; sube y vuelve. Regala altura de
     pantalla en móvil, que es donde más falta hace.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var barra = $('.nav');
    if (!barra) return;
    var oculta = false;
    var st = ScrollTrigger.create({
      start: 'top -120',
      end: 'max',
      onUpdate: function (self) {
        if (document.body.classList.contains('no-scroll')) return;
        var abajo = self.direction === 1;
        if (abajo && !oculta) { oculta = true; gsap.to(barra, { yPercent: -100, duration: .45, ease: 'power2.inOut' }); }
        else if (!abajo && oculta) { oculta = false; gsap.to(barra, { yPercent: 0, duration: .4, ease: 'power2.out' }); }
      },
      onLeaveBack: function () { oculta = false; gsap.to(barra, { yPercent: 0, duration: .3 }); }
    });
    return function () { st.kill(); gsap.set(barra, { yPercent: 0 }); };
  });

  /* ---------------------------------------------------------------------------
     11. SECCIÓN OSCURA: ENTRADA EN CORTINA
     El bloque de Trabajos y el CTA final suben ligeramente sobre lo anterior,
     que es el corte duro del sistema de referencia llevado al movimiento.
     ------------------------------------------------------------------------ */
  mm.add(ESCRITORIO, function () {
    $$('.sec.on-dark').forEach(function (sec) {
      gsap.fromTo(sec,
        { clipPath: 'inset(6% 0% 0% 0% round 26px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 62%', scrub: .5 } });
    });
  });

  /* ---------------------------------------------------------------------------
     12. MICROINTERACCIONES DE BOTONES
     El CSS ya se encarga del hover. Esto añade la respuesta física al pulsar y
     el rebote al soltar, que es lo que hace que un botón se sienta "de verdad".
     Nada de esto oculta nada: solo escala y sombra.
     ------------------------------------------------------------------------ */
  mm.add(CUALQUIERA, function () {
    var pulsables = $$('.btn, .tab, .plan__mail, .case__play');
    var manejadores = [];

    pulsables.forEach(function (el) {
      var abajo = function () { gsap.to(el, { scale: .965, duration: .12, ease: 'power2.out', overwrite: 'auto' }); };
      var arriba = function () { gsap.to(el, { scale: 1, duration: .5, ease: 'elastic.out(1, .55)', overwrite: 'auto' }); };
      el.addEventListener('pointerdown', abajo);
      el.addEventListener('pointerup', arriba);
      el.addEventListener('pointerleave', arriba);
      el.addEventListener('pointercancel', arriba);
      manejadores.push([el, abajo, arriba]);
    });

    // El botón principal del hero respira una vez cuando termina la entrada,
    // para que el ojo vaya a él sin necesidad de gritar con el color.
    var principal = $('.hero__cta .btn');
    if (principal) {
      gsap.fromTo(principal,
        { boxShadow: '0 0 0 0 rgba(193,96,63,.55)' },
        { boxShadow: '0 0 0 16px rgba(193,96,63,0)', duration: 1.4, delay: 2.1, ease: 'power2.out' });
    }

    return function () {
      manejadores.forEach(function (m) {
        m[0].removeEventListener('pointerdown', m[1]);
        m[0].removeEventListener('pointerup', m[2]);
        m[0].removeEventListener('pointerleave', m[2]);
        m[0].removeEventListener('pointercancel', m[2]);
        gsap.set(m[0], { clearProps: 'scale' });
      });
    };
  });

  /* ---------------------------------------------------------------------------
     13. AJUSTES FINALES
     ------------------------------------------------------------------------ */
  // Las fuentes cambian las alturas: recalcular cuando terminen de cargar
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  // Al abrir un modal cambia el alto del documento
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
