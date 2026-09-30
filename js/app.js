$(document).foundation()


if (window.jQuery) {
  window.jQuery(document).foundation();
}

(function () {
  'use strict';

  
  if (typeof Element.prototype.animate !== 'function') return;

  var reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function M(px) { return reducirMovimiento ? 0 : px; }
  function E(factor) { return reducirMovimiento ? 1 : factor; }

  var EASE_SUAVE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

 

  function qsa(selector, contexto) {
    return Array.prototype.slice.call((contexto || document).querySelectorAll(selector));
  }


  function aparecer(elementos, opciones) {
    var o = opciones || {};
    var y = o.y === undefined ? 20 : o.y;
    elementos.forEach(function (el, i) {
      el.animate(
        [
          { opacity: 0, transform: 'translateY(' + M(y) + 'px)' },
          { opacity: 1, transform: 'none' }
        ],
        {
          duration: o.duracion || 600,
          delay: (o.base || 0) + i * (o.paso || 0),
          easing: EASE_SUAVE,
          fill: 'backwards'
        }
      );
    });
  }

 
  function tween(el, clave, hasta, ms, aplicar) {
    var nombre = '_tween_' + clave;
    var estado = el[nombre] || (el[nombre] = { v: 0, raf: 0 });
    cancelAnimationFrame(estado.raf);
    var desde = estado.v;
    var inicio = null;

    function paso(t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / ms, 1);
      var suave = 1 - Math.pow(1 - p, 3); // easeOutCubic
      estado.v = desde + (hasta - desde) * suave;
      aplicar(estado.v);
      if (p < 1) estado.raf = requestAnimationFrame(paso);
    }
    estado.raf = requestAnimationFrame(paso);
  }

  function alEntrar(elemento, funcion, umbral) {
    if (!('IntersectionObserver' in window)) { funcion(); return; }
    var observador = new IntersectionObserver(function (entradas, obs) {
      if (entradas[0].isIntersecting) {
        obs.disconnect();
        funcion();
      }
    }, { threshold: umbral || 0.15 });
    observador.observe(elemento);
  }

  
  function revelarAlEntrar(seccion, grupos, umbral) {
    if (!seccion) return;
    grupos.forEach(function (g) {
      g.els.forEach(function (el) { el.style.opacity = '0'; });
    });
    alEntrar(seccion, function () {
      grupos.forEach(function (g) {
        g.els.forEach(function (el) { el.style.opacity = ''; });
        aparecer(g.els, g);
      });
    }, umbral);
  }

 
  function efectoHover(elemento, transicion, estilosEntrar, extra) {
    var extraEventos = extra || {};
    elemento.style.transition = transicion;

    function entrar() {
      Object.keys(estilosEntrar).forEach(function (k) { elemento.style[k] = estilosEntrar[k]; });
    }
    function salir() {
      Object.keys(estilosEntrar).forEach(function (k) { elemento.style[k] = ''; });
    }

    (extraEventos.entrar || ['mouseenter', 'focus']).forEach(function (ev) {
      elemento.addEventListener(ev, entrar);
    });
    (extraEventos.salir || ['mouseleave', 'blur']).forEach(function (ev) {
      elemento.addEventListener(ev, salir);
    });
  }


  if (!reducirMovimiento) {
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  
   //  MENÚ
   
  var cabecera = document.querySelector('header');
  var itemsMenu = qsa('#main-menu .menu > li');
  var textoMenu = qsa('#main-menu .menu-text');
  var barraMovil = qsa('.title-bar');
  var enlacesMenu = qsa('#main-menu .menu > li > a:not(.button)');

  
  function animarMenu() {
    aparecer(barraMovil, { y: -8, duracion: 450 });
    aparecer(textoMenu, { y: -8, duracion: 500, base: 100 });
    aparecer(itemsMenu, { y: -8, duracion: 500, base: 180, paso: 70 });
  }
  animarMenu();

  var enlaceActivo = null;

  function subrayar(enlace, destino) {
    tween(enlace, 'u', destino, 250, function (v) {
      enlace.style.setProperty('--u', v);
    });
  }

  enlacesMenu.forEach(function (enlace) {
    enlace.style.transition = 'transform 0.2s ease';

    ['mouseenter', 'focus'].forEach(function (ev) {
      enlace.addEventListener(ev, function () {
        subrayar(enlace, 1);
        enlace.style.transform = 'translateY(' + M(-1) + 'px)';
      });
    });
    ['mouseleave', 'blur'].forEach(function (ev) {
      enlace.addEventListener(ev, function () {
        subrayar(enlace, enlace === enlaceActivo ? 1 : 0);
        enlace.style.transform = '';
      });
    });
  });

  var seccionesMenu = [];
  enlacesMenu.forEach(function (enlace) {
    var id = enlace.getAttribute('href');
    if (id && id.length > 1) {
      var seccion = document.querySelector(id);
      if (seccion) seccionesMenu.push({ enlace: enlace, seccion: seccion });
    }
  });

  if ('IntersectionObserver' in window && seccionesMenu.length) {
    var observadorMenu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var coincidencia = seccionesMenu.find(function (s) { return s.seccion === entrada.target; });
        if (!coincidencia || coincidencia.enlace === enlaceActivo) return;

        var anterior = enlaceActivo;
        enlaceActivo = coincidencia.enlace;
        if (anterior) subrayar(anterior, 0);
        subrayar(enlaceActivo, 1);
      });
    }, { rootMargin: '-40% 0px -50% 0px' }); // línea de lectura hacia el centro

    seccionesMenu.forEach(function (s) { observadorMenu.observe(s.seccion); });
  }

  if (cabecera) {
    var conSombra = false;
    var actualizarSombra = function () {
      var debeTener = window.scrollY > 8;
      if (debeTener === conSombra) return;
      conSombra = debeTener;
      tween(cabecera, 'sombra', debeTener ? 1 : 0, 300, function (v) {
        cabecera.style.boxShadow = v > 0.01
          ? '0 6px ' + (24 * v) + 'px rgba(31, 61, 52, ' + (0.12 * v) + ')'
          : '';
      });
    };
    window.addEventListener('scroll', actualizarSombra, { passive: true });
    actualizarSombra();
  }

  if (window.jQuery) {
    window.jQuery('#main-menu').on('toggled.zf.responsiveToggle', function () {
      if (!window.jQuery(this).is(':visible')) return;
      aparecer(itemsMenu, { y: -6, duracion: 350, paso: 50 });
    });
  }


})();