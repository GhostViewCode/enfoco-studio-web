/* =============================================================================
   EN FOCO STUDIO — JAVASCRIPT ÚNICO
   Vanilla, sin dependencias. Compartido por /es/ y /en/.
   El idioma se lee de <html lang>. Todos los textos largos están en el HTML;
   aquí solo viven las pocas cadenas que genera el propio JS (errores de
   formulario, etiquetas de los marcadores de posición).
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.ENFOCO || {};
  var LANG = (document.documentElement.lang || 'es').slice(0, 2);
  var ES = LANG === 'es';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Si GSAP y ScrollTrigger están cargados, la coreografía la lleva motion.js y
     aquí se desactivan las versiones caseras para que no compitan. Si por lo que
     sea GSAP no llegara a cargar, este archivo sigue animando la página solo. */
  var HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  if (HAS_GSAP) document.documentElement.classList.add('gsap-on');

  /* --- Cadenas generadas por JS ---------------------------------------- */
  var T = ES ? {
    required: 'Este campo es obligatorio.',
    email: 'Escribe un email válido.',
    phone: 'Escribe un teléfono válido (con prefijo del país).',
    select: 'Elige una opción.',
    files: function (n) { return n + (n === 1 ? ' foto seleccionada' : ' fotos seleccionadas'); },
    sending: 'Enviando…',
    sendError: 'No se ha podido enviar. Escríbenos a ' + (CFG.business ? CFG.business.email : ''),
    phBefore: 'Foto original del cliente',
    phAfter: 'Retoque de En Foco',
    phVideo: 'Vídeo — sustituir',
    phPhoto: 'Foto — sustituir'
  } : {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    phone: 'Enter a valid phone number (with country code).',
    select: 'Please pick an option.',
    files: function (n) { return n + (n === 1 ? ' photo selected' : ' photos selected'); },
    sending: 'Sending…',
    sendError: 'Something went wrong. Email us at ' + (CFG.business ? CFG.business.email : ''),
    phBefore: 'Owner’s original photo',
    phAfter: 'Edited by En Foco',
    phVideo: 'Video — replace',
    phPhoto: 'Photo — replace'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =========================================================================
     1. FORMATO DE NÚMEROS Y PRECIOS
     ====================================================================== */
  var locale = ES ? 'es-ES' : 'en-IE'; // en-IE usa € delante, formato anglosajón

  function money(v) {
    var dec = (v % 1 === 0) ? 0 : 2;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: dec, maximumFractionDigits: dec
      }).format(v);
    } catch (e) { return v + ' €'; }
  }
  function num(v, dec) {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0
      }).format(v);
    } catch (e) { return String(v); }
  }
  function get(path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? o : o[k]); }, CFG);
  }

  /* Inyecta valores del bloque de configuración en el HTML.
     Uso: <span data-cfg="prices.reel"></span>  ·  data-fmt="money|plain|dec1|dec2" */
  function injectConfig() {
    $$('[data-cfg]').forEach(function (el) {
      var v = get(el.getAttribute('data-cfg'));
      if (v === undefined || v === null) return;
      var f = el.getAttribute('data-fmt') || 'money';
      if (f === 'money') el.textContent = money(v);
      else if (f === 'dec1') el.textContent = num(v, 1);
      else if (f === 'dec2') el.textContent = num(v, 2);
      else el.textContent = num(v, 0);
    });
    // Enlaces de contacto
    var b = CFG.business || {};
    var waMsg = encodeURIComponent(ES ? (b.whatsappMsgES || '') : (b.whatsappMsgEN || ''));
    $$('[data-link]').forEach(function (el) {
      var k = el.getAttribute('data-link');
      if (k === 'whatsapp') el.href = 'https://wa.me/' + b.whatsapp + '?text=' + waMsg;
      else if (k === 'email') { el.href = 'mailto:' + b.email; if (el.dataset.fill === '1') el.textContent = b.email; }
      else if (k === 'phone') { el.href = 'tel:' + b.phone; if (el.dataset.fill === '1') el.textContent = b.phoneDisplay; }
      else if (k === 'instagram') el.href = b.instagram;
      else if (k === 'tiktok') el.href = b.tiktok;
      else if (k === 'linkedin') el.href = b.linkedin;
      else if (k === 'guide') el.href = (CFG.media ? (ES ? CFG.media.guidePdfES : CFG.media.guidePdfEN) : '#') || '#';
    });
    $$('[data-city]').forEach(function (el) { el.textContent = b.city || ''; });
    $$('[data-countries]').forEach(function (el) {
      var list = ES ? (CFG.countries || []) : (CFG.countriesEN || []);
      el.textContent = list.join(' · ');
    });
    $$('[data-hours]').forEach(function (el) { el.textContent = String(CFG.delivery ? CFG.delivery.testVideoHours : 48); });
  }

  /* =========================================================================
     2. MARCADORES DE POSICIÓN EN SVG
     Se generan aquí para que el HTML quede limpio y para no depender de
     archivos externos antes de tener material real.
     ====================================================================== */
  function room(opt) {
    var o = opt || {};
    var before = o.variant === 'before';
    var p = before
      ? { wall: '#4a4741', wall2: '#3d3a35', floor: '#332f2a', sofa: '#56514a', cush: '#615b53', win: '#8d897f', light: '#a9a49a', plant: '#4e5a49', frame: '#5c574f' }
      : { wall: '#efe9e0', wall2: '#e5ddd2', floor: '#cbb9a4', sofa: '#b9a893', cush: '#c1603f', win: '#fbf7f0', light: '#fff6e6', plant: '#7d8f6f', frame: '#8c7f70' };
    var tilt = before ? (o.tilt || -2.1) : 0;
    var vig = before ? 0.42 : 0.10;
    /* Los ids de los degradados van con prefijo "ph-" a propósito: sin él
       chocarían con los ids de las plantillas del portfolio (w1, w2, w3...)
       y getElementById devolvería el degradado en vez de la plantilla. */
    return '' +
      '<svg class="ph-fallback" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' +
      (before ? T.phBefore : T.phAfter) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<linearGradient id="ph-g' + o.id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + p.wall + '"/><stop offset="1" stop-color="' + p.wall2 + '"/></linearGradient>' +
        '<radialGradient id="ph-v' + o.id + '" cx="50%" cy="42%" r="72%">' +
          '<stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="' + vig + '"/></radialGradient>' +
        '<linearGradient id="ph-w' + o.id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + p.win + '"/><stop offset="1" stop-color="' + p.light + '"/></linearGradient>' +
      '</defs>' +
      '<rect width="600" height="400" fill="url(#ph-g' + o.id + ')"/>' +
      '<g transform="rotate(' + tilt + ' 300 200)">' +
        '<rect x="-30" y="268" width="660" height="160" fill="' + p.floor + '"/>' +
        '<rect x="60" y="66" width="150" height="150" rx="3" fill="url(#ph-w' + o.id + ')"/>' +
        '<line x1="135" y1="66" x2="135" y2="216" stroke="' + p.wall2 + '" stroke-width="4"/>' +
        '<line x1="60" y1="141" x2="210" y2="141" stroke="' + p.wall2 + '" stroke-width="4"/>' +
        (before ? '' : '<polygon points="210,90 330,268 210,268" fill="#fff" opacity=".14"/>') +
        '<rect x="300" y="92" width="86" height="64" rx="2" fill="none" stroke="' + p.frame + '" stroke-width="5"/>' +
        '<rect x="150" y="214" width="270" height="60" rx="10" fill="' + p.sofa + '"/>' +
        '<rect x="140" y="196" width="290" height="34" rx="12" fill="' + p.sofa + '"/>' +
        '<rect x="176" y="200" width="44" height="30" rx="7" fill="' + p.cush + '"/>' +
        '<rect x="238" y="200" width="44" height="30" rx="7" fill="' + p.cush + '" opacity=".65"/>' +
        '<rect x="168" y="274" width="12" height="22" fill="' + p.frame + '"/>' +
        '<rect x="392" y="274" width="12" height="22" fill="' + p.frame + '"/>' +
        '<rect x="452" y="236" width="56" height="38" rx="6" fill="' + p.plant + '"/>' +
        '<path d="M480 236c-16-26-6-52 4-64 8 16 16 40 6 64z" fill="' + p.plant + '"/>' +
        '<path d="M480 240c14-20 34-24 46-22-10 12-26 26-44 26z" fill="' + p.plant + '" opacity=".8"/>' +
        '<rect x="240" y="286" width="130" height="10" rx="5" fill="#000" opacity=".12"/>' +
      '</g>' +
      '<rect width="600" height="400" fill="url(#ph-v' + o.id + ')"/>' +
      (before ? '<rect width="600" height="400" fill="#2b2a26" opacity=".22"/>' : '') +
      '</svg>';
  }

  function vertical(opt) {
    var o = opt || {};
    var id = o.id;
    return '' +
      '<svg class="ph-fallback" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + T.phVideo + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="ph-vg' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#2A2621"/><stop offset="1" stop-color="#1F1C18"/></linearGradient></defs>' +
      '<rect width="400" height="500" fill="url(#ph-vg' + id + ')"/>' +
      '<rect x="0" y="300" width="400" height="200" fill="#252119"/>' +
      '<circle cx="300" cy="120" r="52" fill="#C1603F" opacity=".22"/>' +
      '<rect x="52" y="196" width="180" height="120" rx="8" fill="#3a352e"/>' +
      '<rect x="70" y="216" width="60" height="60" rx="4" fill="#4a443b"/>' +
      '<path d="M232 316L120 196l-68 120z" fill="#443e36"/>' +
      '<g stroke="#C1603F" stroke-width="2" fill="none">' +
      '<path d="M150 210h-24v24"/><path d="M250 210h24v24"/><path d="M150 302h-24v-24"/><path d="M250 302h24v-24"/></g>' +
      '<circle cx="200" cy="256" r="26" fill="#FAF8F5" opacity=".9"/>' +
      '<path d="M193 244l20 12-20 12z" fill="#151310"/>' +
      '</svg>';
  }

  function avatar(opt) {
    var o = opt || {};
    var tones = ['#C9BBAA', '#B7A692', '#D2C3B0', '#A89684', '#C4B5A2', '#BCAB98'];
    var bg = tones[(o.i || 0) % tones.length];
    return '' +
      '<svg class="ph-fallback" viewBox="0 0 80 80" role="img" aria-label="' + T.phPhoto + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="80" height="80" fill="' + bg + '"/>' +
      '<circle cx="40" cy="31" r="14" fill="#151310" opacity=".22"/>' +
      '<path d="M12 80c4-18 14-26 28-26s24 8 28 26z" fill="#151310" opacity=".22"/>' +
      '</svg>';
  }

  function team() {
    return '' +
      '<svg class="ph-fallback" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + T.phPhoto + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="400" height="500" fill="#E8E0D5"/>' +
      '<rect x="0" y="340" width="400" height="160" fill="#D9CEBF"/>' +
      '<circle cx="150" cy="230" r="52" fill="#151310" opacity=".18"/>' +
      '<path d="M62 400c10-56 42-80 88-80s78 24 88 80z" fill="#151310" opacity=".18"/>' +
      '<circle cx="278" cy="252" r="44" fill="#151310" opacity=".13"/>' +
      '<path d="M204 400c8-46 36-66 74-66s66 20 74 66z" fill="#151310" opacity=".13"/>' +
      '<g stroke="#C1603F" stroke-width="3" fill="none">' +
      '<path d="M60 90h-28v28"/><path d="M340 90h28v28"/><path d="M60 440h-28v-28"/><path d="M340 440h28v-28"/></g>' +
      '</svg>';
  }

  function renderPlaceholders() {
    var n = 0;
    $$('[data-ph]').forEach(function (el) {
      // Si ya hay una imagen o un vídeo real dentro, no se toca. La etiqueta
      // .ph-note ("sustituir") no cuenta como contenido: se conserva encima.
      if (el.querySelector('img,video,picture,svg')) return;
      var kind = el.getAttribute('data-ph');
      n++;
      var html = '';
      if (kind === 'before') html = room({ variant: 'before', id: n, tilt: el.getAttribute('data-tilt') });
      else if (kind === 'after') html = room({ variant: 'after', id: n });
      else if (kind === 'vertical') html = vertical({ id: n });
      else if (kind === 'avatar') html = avatar({ i: n });
      else if (kind === 'team') html = team();
      el.insertAdjacentHTML('afterbegin', html);
    });
  }

  /* =========================================================================
     3. ESCUADRAS DE ENFOQUE
     ====================================================================== */
  function injectCorners() {
    $$('[data-corners]').forEach(function (el) {
      if ($('.corners', el)) return;
      var d = document.createElement('div');
      d.className = 'corners';
      d.innerHTML = '<i></i><i></i><i></i><i></i>';
      el.appendChild(d);
      el.classList.add('has-corners');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    });
  }

  /* =========================================================================
     4. NAVEGACIÓN
     ====================================================================== */
  function nav() {
    var bar = $('.nav');
    var burger = $('.burger');
    var menu = $('#menu');
    if (bar) {
      var onScroll = function () { bar.classList.toggle('stuck', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (burger && menu) {
      var close = function () {
        menu.classList.remove('open');
        if (bar) bar.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      };
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        if (bar) bar.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('no-scroll', open);
      });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    // Marcado de sección activa
    var links = $$('.nav__links a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) map[s.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          if (map[en.target.id]) map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* =========================================================================
     5. ANIMACIONES DE ENTRADA + CONTADORES
     ====================================================================== */
  function reveal() {
    var items = $$('.rise, .mask');

    if (!('IntersectionObserver' in window) || REDUCED) {
      items.forEach(function (el) { el.classList.add('in'); });
      countersNow();
      return;
    }

    // Los contadores se quedan aquí en cualquier caso: no dependen del scrub
    var cio = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCounter(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });

    if (HAS_GSAP) return;   // las entradas las coreografía motion.js

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  function countersNow() { $$('[data-count]').forEach(function (el) { setCount(el, get(el.getAttribute('data-count'))); }); }

  function setCount(el, v) {
    var dec = el.getAttribute('data-dec') ? parseInt(el.getAttribute('data-dec'), 10) : 0;
    el.textContent = num(v, dec) + (el.getAttribute('data-suffix') || '');
  }

  function runCounter(el) {
    var target = get(el.getAttribute('data-count'));
    if (typeof target !== 'number') return;
    var dec = el.getAttribute('data-dec') ? parseInt(el.getAttribute('data-dec'), 10) : 0;
    var dur = 1400, t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = num(target * e, dec) + (el.getAttribute('data-suffix') || '');
      if (p < 1) requestAnimationFrame(frame); else setCount(el, target);
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================================
     6. COMPARADORES ANTES / DESPUÉS
     ====================================================================== */
  function beforeAfter() {
    $$('.ba').forEach(function (ba) {
      var range = $('.ba__range', ba);
      if (!range) return;
      var apply = function () {
        ba.style.setProperty('--pos', range.value + '%');
        ba.style.setProperty('--posn', range.value);   // sin unidad: lo usa el blur
      };
      range.addEventListener('input', apply);
      apply();
      // Arrastre directo sobre la imagen (además del input nativo, que da teclado)
      var drag = false;
      var move = function (clientX) {
        var r = ba.getBoundingClientRect();
        var pct = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
        range.value = pct; apply();
      };
      ba.addEventListener('pointerdown', function (e) { drag = true; move(e.clientX); });
      window.addEventListener('pointermove', function (e) { if (drag) move(e.clientX); });
      window.addEventListener('pointerup', function () { drag = false; });
    });
  }

  /* =========================================================================
     7. PESTAÑAS (servicios y precios)
     ====================================================================== */
  /* Hace visible lo que hay dentro de `root`. Hace falta porque los paneles
     ocultos no tienen caja: ni IntersectionObserver ni ScrollTrigger llegan a
     dispararse sobre ellos, así que sus tarjetas se quedaban en opacidad 0 para
     siempre y al cambiar de pestaña no aparecía nada. */
  function showIn(root) {
    var els = $$('.rise', root);
    if (!els.length) return;
    if (HAS_GSAP && !REDUCED) {
      window.gsap.to(els, {
        opacity: 1, y: 0, duration: .7, ease: 'power3.out',
        stagger: .06, overwrite: true
      });
      window.ScrollTrigger.refresh();
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }
  }

  function tabs() {
    $$('[data-tabs]').forEach(function (group) {
      var btns = $$('.tab', group);
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) {
            var on = b === btn;
            b.setAttribute('aria-selected', String(on));
            var panel = document.getElementById(b.getAttribute('aria-controls'));
            if (panel) {
              panel.hidden = !on;
              if (on) showIn(panel);
            }
          });
        });
        btn.addEventListener('keydown', function (e) {
          var i = btns.indexOf(btn), next = null;
          if (e.key === 'ArrowRight') next = btns[(i + 1) % btns.length];
          if (e.key === 'ArrowLeft') next = btns[(i - 1 + btns.length) % btns.length];
          if (next) { e.preventDefault(); next.focus(); next.click(); }
        });
      });
    });
  }

  /* =========================================================================
     8. CONMUTADOR MENSUAL / ANUAL
     ====================================================================== */
  function billing() {
    var sw = $('#billing-switch');
    if (!sw) return;
    var labM = $('#bill-m'), labY = $('#bill-y');
    var set = function (annual) {
      sw.setAttribute('aria-checked', String(annual));
      if (labM) labM.classList.toggle('on', !annual);
      if (labY) labY.classList.toggle('on', annual);
      $$('[data-plan]').forEach(function (el) {
        var plan = get('plans.' + el.getAttribute('data-plan'));
        if (!plan) return;
        var v = annual ? plan.annual : plan.monthly;
        var amount = $('.js-amount', el);
        if (amount) amount.textContent = money(v);
        var note = $('.js-billnote', el);
        if (note) note.textContent = note.getAttribute(annual ? 'data-year' : 'data-month');
        var total = $('.js-total', el);
        if (total) { total.textContent = money(plan.annualTotal); total.parentElement.hidden = !annual; }
      });
    };
    sw.addEventListener('click', function () { set(sw.getAttribute('aria-checked') !== 'true'); });
    set(false);
  }

  /* =========================================================================
     9. MODALES (servicios y trabajos)
     ====================================================================== */
  function modals() {
    var modal = $('#modal');
    if (!modal) return;
    var box = $('.modal__body', modal);
    var last = null;

    function open(html) {
      box.innerHTML = html;
      renderPlaceholders();
      wireMailLinks(box);
      modal.classList.add('open');
      document.body.classList.add('no-scroll');
      last = document.activeElement;
      var x = $('.modal__x', modal); if (x) x.focus();
    }
    /* devolverFoco: al cerrar con Escape o con el aspa hay que devolver el foco
       al botón que abrió el modal. Pero si se cierra porque el visitante ha
       pulsado un enlace interno, NO: devolver el foco arrastraría la página de
       vuelta arriba justo cuando queremos que baje al formulario. */
    function close(devolverFoco) {
      modal.classList.remove('open');
      document.body.classList.remove('no-scroll');
      box.innerHTML = '';
      if (devolverFoco !== false && last) last.focus();
    }

    /* Cualquier enlace interno de dentro del modal lo cierra antes de saltar.
       Si no, la página se desplazaba por detrás con la ventana todavía abierta. */
    box.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var destino = document.querySelector(a.getAttribute('href'));
      close(false);
      if (destino) {
        e.preventDefault();
        // en el siguiente fotograma, ya sin el bloqueo de scroll del modal
        requestAnimationFrame(function () {
          destino.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', a.getAttribute('href'));
        });
      }
    });
    $('.modal__bg', modal).addEventListener('click', close);
    $('.modal__x', modal).addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

    // Atrapa el foco dentro del modal
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])', modal)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });

    // Cualquier elemento con [data-modal="idDePlantilla"] abre esa plantilla
    $$('[data-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var tpl = document.getElementById(trigger.getAttribute('data-modal'));
        if (tpl) open(tpl.innerHTML);
      });
    });
  }

  /* =========================================================================
     10. FILTROS DEL PORTFOLIO
     ====================================================================== */
  function filters() {
    var groups = $$('[data-filter-group]');
    if (!groups.length) return;
    var state = {};
    groups.forEach(function (g) { state[g.getAttribute('data-filter-group')] = 'all'; });

    function apply() {
      $$('.work').forEach(function (w) {
        var ok = Object.keys(state).every(function (k) {
          return state[k] === 'all' || w.getAttribute('data-' + k) === state[k];
        });
        w.hidden = !ok;
      });
    }
    groups.forEach(function (g) {
      var key = g.getAttribute('data-filter-group');
      $$('.tab', g).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $$('.tab', g).forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
          state[key] = btn.getAttribute('data-value');
          apply();
        });
      });
    });
  }

  /* =========================================================================
     11. ACORDEÓN FAQ
     ====================================================================== */
  function faq() {
    $$('.faq__q').forEach(function (q) {
      var a = document.getElementById(q.getAttribute('aria-controls'));
      if (!a) return;
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', String(!open));
        a.style.height = open ? '0px' : a.firstElementChild.offsetHeight + 'px';
      });
    });
    window.addEventListener('resize', function () {
      $$('.faq__q[aria-expanded="true"]').forEach(function (q) {
        var a = document.getElementById(q.getAttribute('aria-controls'));
        if (a) a.style.height = a.firstElementChild.offsetHeight + 'px';
      });
    });
  }

  /* =========================================================================
     12. FORMULARIO
     ====================================================================== */
  function form() {
    var f = $('#lead-form');
    if (!f) return;

    /* Zona de subida / enlace */
    var drop = $('.drop', f);
    var input = drop ? $('input[type=file]', drop) : null;
    var out = drop ? $('.drop__files', drop) : null;
    if (input && out) {
      input.addEventListener('change', function () {
        out.textContent = input.files.length ? T.files(input.files.length) : '';
      });
      ['dragenter', 'dragover'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
      });
      drop.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          out.textContent = T.files(input.files.length);
        }
      });
    }

    function invalid(field, msg) {
      var wrap = field.closest('.field');
      wrap.classList.add('invalid');
      var e = $('.err', wrap);
      if (e) e.textContent = msg;
    }
    function clear(field) { field.closest('.field').classList.remove('invalid'); }

    /* Dos comprobaciones distintas y separadas a propósito:
       · que estén los campos obligatorios;
       · que lo que hayan escrito tenga sentido, sea obligatorio o no.
       El teléfono es opcional, pero si lo escriben mal queremos avisar aquí y
       no después de un viaje al servidor. */
    function validate() {
      var ok = true, first = null;
      var falla = function (el, msg) { invalid(el, msg); ok = false; first = first || el; };

      $$('input,select,textarea', f).forEach(function (el) {
        if (el.type === 'hidden' || el.type === 'file' || el.name === 'web') return;
        clear(el);
        var v = (el.value || '').trim();
        if (!v) {
          if (el.hasAttribute('required')) falla(el, el.tagName === 'SELECT' ? T.select : T.required);
          return;
        }
        if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) falla(el, T.email);
        if (el.type === 'tel' && !/^[+()\d\s.-]{7,}$/.test(v)) falla(el, T.phone);
      });
      if (first) first.focus();
      return ok;
    }

    $$('input,select,textarea', f).forEach(function (el) {
      el.addEventListener('input', function () { clear(el); });
      el.addEventListener('change', function () { clear(el); });
    });

    /* Antispam sin molestar a nadie: se guarda cuándo se cargó el formulario.
       Un robot lo rellena y lo manda en milisegundos; una persona tarda. */
    var abiertoEn = Date.now();

    /* Lee un campo tolerando que el nombre cambie entre idiomas */
    var v = function () {
      for (var i = 0; i < arguments.length; i++) {
        var el = f.querySelector('[name="' + arguments[i] + '"]');
        if (el && el.value.trim()) return el.value.trim();
      }
      return '';
    };

    /* Pasa los archivos elegidos a base64 para poder adjuntarlos. Solo si pesan
       poco: por encima de ~3 MB se dejan fuera y se le pide al cliente que los
       mande respondiendo al correo de confirmación. Meter treinta fotos por aquí
       reventaría el límite de cualquier función de servidor. */
    var TOPE_ADJUNTOS = 3 * 1024 * 1024;
    function prepararAdjuntos(archivos) {
      if (!archivos || !archivos.length) return Promise.resolve([]);
      var total = 0;
      for (var i = 0; i < archivos.length; i++) total += archivos[i].size;
      if (total > TOPE_ADJUNTOS || archivos.length > 10) return Promise.resolve([]);
      return Promise.all(Array.prototype.map.call(archivos, function (file) {
        return new Promise(function (resolve) {
          var lector = new FileReader();
          lector.onload = function () {
            resolve({ nombre: file.name, contenido: String(lector.result).split(',')[1] });
          };
          lector.onerror = function () { resolve(null); };
          lector.readAsDataURL(file);
        });
      })).then(function (l) { return l.filter(Boolean); });
    }

    /* Los campos se llaman distinto en cada idioma, y el servidor responde
       siempre con el nombre en español. Esta tabla traduce para poder señalar
       el campo correcto también en la web en inglés. */
    var EQUIVALENTES = {
      nombre: 'name', telefono: 'phone', ubicacion: 'location', tipo: 'property_type',
      servicio: 'service', anuncio: 'listing_url', enlaceFotos: 'photos_link', mensaje: 'message'
    };

    /* Nunca enseñamos al visitante algo que no sea texto. Si por lo que fuera
       llegara un objeto en vez de un mensaje, se descarta y se usa el aviso
       genérico: más vale una frase útil que un "[object Object]". */
    function comoTexto(x, deRespaldo) {
      return (typeof x === 'string' && x.trim()) ? x : deRespaldo;
    }

    function mostrarError(mensaje, campo) {
      mensaje = comoTexto(mensaje, T.sendError);
      var caja = $('#form-error');
      if (caja) { caja.textContent = mensaje; caja.hidden = false; }
      if (typeof campo === 'string' && campo) {
        var el = f.querySelector('[name="' + campo + '"]') ||
                 (EQUIVALENTES[campo] ? f.querySelector('[name="' + EQUIVALENTES[campo] + '"]') : null);
        if (el) { invalid(el, mensaje); el.focus(); return; }
      }
      if (caja) caja.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var caja = $('#form-error');
      if (caja) caja.hidden = true;
      if (!validate()) return;

      var btn = $('button[type=submit]', f);
      var original = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = T.sending; }

      var restaurar = function () {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
      };
      var done = function () {
        f.classList.add('done');
        var sent = $('#sent');
        if (!sent) return;
        sent.classList.add('on');
        sent.setAttribute('tabindex', '-1');
        sent.focus();
      };

      var entrada = f.querySelector('input[type=file]');
      var lista = entrada ? entrada.files : null;

      prepararAdjuntos(lista).then(function (adjuntos) {
        var cuerpo = {
          idioma: ES ? 'es' : 'en',
          nombre: v('nombre', 'name'),
          email: v('email'),
          telefono: v('telefono', 'phone'),
          ubicacion: v('ubicacion', 'location'),
          tipo: v('tipo', 'property_type'),
          servicio: v('servicio', 'service'),
          anuncio: v('anuncio', 'listing_url'),
          enlaceFotos: v('enlace_fotos', 'photos_link'),
          mensaje: v('mensaje', 'message'),
          numArchivos: lista ? lista.length : 0,
          adjuntos: adjuntos,
          // campo trampa y marca de tiempo: los dos frenan robots
          web: v('web'),
          tiempo: Date.now() - abiertoEn
        };

        return fetch((CFG.form && CFG.form.endpoint) || '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(cuerpo)
        }).then(function (r) {
          return r.json().catch(function () { return {}; })
            .then(function (datos) { return { ok: r.ok, datos: datos }; });
        }).then(function (res) {
          /* Solo se enseña "recibido" si el servidor confirma que el correo
             salió. Nunca damos por bueno un envío que no lo está. */
          if (res.ok && res.datos.ok) { done(); return; }
          restaurar();
          mostrarError(res.datos.error || T.sendError, res.datos.campo);
        });
      }).catch(function () {
        restaurar();
        mostrarError(T.sendError);
      });
    });
  }

  /* =========================================================================
     12b. ELECCIÓN DE PACK / SERVICIO
     Dos caminos desde cualquier pack, plan o servicio:
       · data-pick="…"          → lleva al formulario ya con la etiqueta puesta
       · data-email-subject="…" → abre el correo con asunto y cuerpo escritos
     La dirección sale de config.js, así que solo se cambia en un sitio.
     ====================================================================== */
  /* Escribe el href mailto de los botones de correo dentro de `root`.
     Se llama al arrancar y también al abrir un modal, porque ese contenido
     se inyecta después y no existía cuando arrancó la página. */
  function wireMailLinks(root) {
    var email = (CFG.business && CFG.business.email) || '';
    $$('[data-email-subject]', root || document).forEach(function (el) {
      var what = el.getAttribute('data-email-subject');
      var subject = ES ? ('Me interesa: ' + what) : ('I am interested in: ' + what);
      var body = ES
        ? 'Hola,\n\nMe interesa: ' + what + '\n\n'
          + 'Tipo de alojamiento: \n'
          + 'Dónde está: \n'
          + 'Enlace del anuncio: \n'
          + '¿Tienes fotos ya? Sí / No\n\n'
          + 'Gracias.'
        : 'Hi,\n\nI am interested in: ' + what + '\n\n'
          + 'Property type: \n'
          + 'Where it is: \n'
          + 'Listing link: \n'
          + 'Do you already have photos? Yes / No\n\n'
          + 'Thanks.';
      el.setAttribute('href',
        'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
    });
  }

  function picks() {
    wireMailLinks(document);

    var sel = $('#f-service');
    if (!sel) return;
    var note = $('#pick-note');

    // Delegación en el documento: así funciona igual para los botones de la
    // página y para los que aparecen dentro de un modal.
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-pick]');
      if (!el) return;
      var what = el.getAttribute('data-pick');
      var opt = Array.prototype.filter.call(sel.options, function (o) {
        return o.value === what || o.text === what;
      })[0];
      if (opt) {
        sel.value = opt.value;
        var wrap = sel.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      }
      if (note) {
        note.textContent = (ES ? 'Has elegido: ' : 'You picked: ') + what;
        note.hidden = false;
      }
    });
  }

  /* =========================================================================
     13. VÍDEO DEL HERO + BOTÓN DE WHATSAPP
     ====================================================================== */
  function heroVideo() {
    var v = $('#hero-video');
    if (!v || !CFG.media) return;
    if (CFG.media.heroPoster) v.poster = CFG.media.heroPoster;
    if (!CFG.media.heroVideo) { v.remove(); return; }   // sin vídeo: se ve el fondo de respaldo
    v.src = CFG.media.heroVideo;
    v.load();
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if (!REDUCED) play();
  }

  /* Vídeo del caso destacado. Si no hay vídeo configurado se retira el botón
     de reproducir para no dejar un control que no hace nada. */
  function caseVideo() {
    var btn = $('.case__play');
    if (!btn) return;
    var url = CFG.media && CFG.media.caseVideo;
    if (!url) { btn.remove(); return; }

    var box = btn.parentElement;
    var v = null;

    btn.addEventListener('click', function () {
      if (!v) {
        v = document.createElement('video');
        v.src = url;
        v.controls = true;
        v.playsInline = true;
        // En bucle a propósito: es un clip corto y, sin esto, al acabar se
        // queda congelado en el último fotograma y parece que se ha roto.
        v.loop = true;
        v.preload = 'auto';
        // La foto ya retocada hace de portada mientras el vídeo carga
        var poster = $('img', box);
        if (poster) v.poster = poster.getAttribute('src');
        v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:4';
        box.appendChild(v);
        var note = $('.ph-note', box); if (note) note.remove();
      }
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* el usuario puede darle a los controles */ });
      // El botón se esconde, pero no se destruye: al pausar vuelve a aparecer
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      v.addEventListener('pause', function () {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      });
      v.addEventListener('play', function () {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
      });
    });
  }

  function waButton() {
    var wa = $('.wa');
    if (!wa) return;
    var on = function () { wa.classList.toggle('on', window.scrollY > 500); };
    on();
    window.addEventListener('scroll', on, { passive: true });
  }

  /* =========================================================================
     14. MOVIMIENTO
     Todo lo de aquí escribe únicamente transform y opacity, se apoya en
     requestAnimationFrame y se apaga entero con prefers-reduced-motion.
     ====================================================================== */

  /* Un solo bucle de scroll para todos los efectos: leer el scroll una vez por
     frame evita el thrashing de layout que provocan varios listeners sueltos. */
  var scrollJobs = [];
  function onScrollFrame(fn) { scrollJobs.push(fn); }
  function startScrollLoop() {
    if (!scrollJobs.length) return;
    var ticking = false;
    var run = function () {
      var y = window.scrollY || window.pageYOffset;
      for (var i = 0; i < scrollJobs.length; i++) scrollJobs[i](y);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(run); }
    }, { passive: true });
    window.addEventListener('resize', run, { passive: true });
    run();
  }

  /* Barra de progreso de lectura */
  function progress() {
    var bar = $('.progress');
    if (!bar || REDUCED || HAS_GSAP) return;
    onScrollFrame(function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(y / max, 1) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    });
  }

  /* Revelado palabra a palabra de los titulares de sección.
     Se parte el texto en <span class="w"><i>palabra</i></span> conservando los
     espacios, así que el titular sigue leyéndose igual sin JS ni para un lector
     de pantalla (el texto no cambia, solo se envuelve). */
  function splitHeadings() {
    var targets = $$('[data-split]');
    if (!targets.length) return;
    if (REDUCED) { targets.forEach(function (el) { el.classList.add('in'); }); return; }

    targets.forEach(function (el) {
      if (el.querySelector('.w')) return;
      var i = 0;
      var walk = function (node) {
        var kids = Array.prototype.slice.call(node.childNodes);
        kids.forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = n.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement('span');
              w.className = 'w';
              var inner = document.createElement('i');
              inner.textContent = p;
              inner.style.setProperty('--i', i++);
              w.appendChild(inner);
              frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && !n.classList.contains('w')) {
            walk(n);
          }
        });
      };
      walk(el);
      el.classList.add('words');
    });

    // El troceado en palabras se hace siempre aquí; quien lo anima es motion.js
    if (HAS_GSAP) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Parallax: el elemento se desplaza una fracción de lo que se desplaza la
     página mientras está en pantalla. data-par="0.12" controla la intensidad. */
  function parallax() {
    var items = $$('[data-par]');
    if (!items.length || REDUCED || HAS_GSAP) return;
    items.forEach(function (el) { el.classList.add('par'); });
    onScrollFrame(function () {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var amount = parseFloat(el.getAttribute('data-par')) || 0.1;
        // -1 arriba del todo, +1 abajo del todo
        var rel = ((r.top + r.height / 2) - vh / 2) / (vh / 2);
        el.style.setProperty('--py', (rel * amount * -100).toFixed(1) + 'px');
      });
    });
  }

  /* Botones magnéticos: el botón se inclina hacia el cursor. Solo con ratón. */
  function magnetic() {
    if (REDUCED || !window.matchMedia('(pointer:fine)').matches) return;
    $$('[data-mag]').forEach(function (el) {
      el.classList.add('mag');

      /* Con GSAP disponible se delega en él: así el desplazamiento magnético y
         la escala del pulsado conviven en la misma matriz de transformación.
         Escribiendo style.transform a mano, el último en llegar borraba al otro. */
      if (HAS_GSAP) {
        var mover = function (e) {
          var r = el.getBoundingClientRect();
          window.gsap.to(el, {
            x: ((e.clientX - r.left) / r.width - 0.5) * 16,
            y: ((e.clientY - r.top) / r.height - 0.5) * 11,
            duration: .45, ease: 'power3.out', overwrite: 'auto'
          });
        };
        var volver = function () {
          window.gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, .5)', overwrite: 'auto' });
        };
        el.addEventListener('pointermove', mover);
        el.addEventListener('pointerleave', volver);
        return;
      }

      var raf = null, tx = 0, ty = 0;
      var apply = function () {
        el.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
        raf = null;
      };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 10;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  }

  /* Cursor de enfoque: las escuadras de la marca siguen al puntero y se abren
     sobre cualquier elemento interactivo. Solo con ratón, nunca en táctil. */
  function focusCursor() {
    if (REDUCED || !window.matchMedia('(pointer:fine)').matches) return;
    var c = document.createElement('div');
    c.className = 'fcursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<i></i><i></i><i></i><i></i>';
    document.body.appendChild(c);

    var x = 0, y = 0, cx = 0, cy = 0, raf = null;
    var loop = function () {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      raf = (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      c.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    window.addEventListener('pointerleave', function () { c.classList.remove('on'); });

    var hot = 'a,button,input,select,textarea,.ba,[data-modal]';
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest(hot)) c.classList.add('lock');
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest(hot)) c.classList.remove('lock');
    });
  }

  /* Las escuadras de marca se encienden solas al entrar la sección en pantalla */
  function cornersOnView() {
    var items = $$('[data-corners-auto] .corners');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('on'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('on');
        obs.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Escalonado automático: a los hijos directos de una rejilla marcada se les
     asigna el retardo de entrada, para no escribirlo a mano tarjeta a tarjeta. */
  function autoStagger() {
    $$('[data-stagger]').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        if (!child.classList.contains('rise')) child.classList.add('rise');
        child.style.transitionDelay = (Math.min(i, 6) * 80) + 'ms';
      });
    });
  }

  /* =========================================================================
     15. ARRANQUE
     ====================================================================== */
  function init() {
    injectConfig();
    renderPlaceholders();
    injectCorners();
    nav();
    beforeAfter();
    tabs();
    billing();
    modals();
    filters();
    faq();
    form();
    picks();
    heroVideo();
    caseVideo();
    waButton();

    // Movimiento
    autoStagger();
    splitHeadings();
    cornersOnView();
    magnetic();
    focusCursor();
    progress();
    parallax();
    reveal();
    startScrollLoop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
