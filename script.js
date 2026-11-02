/* =========================================================
   Bulhões e Ferreira Advogados — interações e movimento
   ========================================================= */
(function () {
  'use strict';

  // Número do WhatsApp no formato internacional, apenas dígitos
  var WHATSAPP = '5521983446461';

  // Respeita "reduzir movimento" do sistema; ?motion=full na URL força o movimento completo
  var reduceMotion = new URLSearchParams(location.search).get('motion') !== 'full' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('reduced', reduceMotion);
  var hasIO = 'IntersectionObserver' in window;

  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-btn');
  var overlay = document.getElementById('menu-overlay');
  var home = document.getElementById('home');
  var pages = document.querySelectorAll('.page[data-view]');
  var readBar = document.querySelector('.read-bar span');
  var sideIndex = document.querySelector('.side-index');
  var sideLinks = sideIndex.querySelectorAll('a');
  var navLinks = document.querySelectorAll('.main-nav a');
  var themed = document.querySelectorAll('[data-theme]');
  var curtains = document.querySelectorAll('.curtain');
  var heroPhoto = document.querySelector('.hero-photo');
  var heroImg = heroPhoto.querySelector('img');
  var drifting = document.querySelectorAll('[data-speed]');

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- WhatsApp ---------- */
  document.querySelectorAll('[data-wa-area]').forEach(function (el) {
    var area = el.getAttribute('data-wa-area');
    var text = 'Olá, gostaria de solicitar atendimento jurídico' + (area ? ' sobre ' + area : '') + '.';
    el.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
    el.target = '_blank';
    el.rel = 'noopener';
  });

  /* ---------- Divisão de textos para animação ---------- */
  // Envolve cada palavra (inclusive dentro de <em>) em uma máscara
  function splitWords(root) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            var wi = document.createElement('span');
            w.className = 'w';
            wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(root);
  }
  document.querySelectorAll('.split').forEach(splitWords);

  // Manifesto: cada palavra acende conforme a leitura
  var manifesto = document.querySelector('.manifesto');
  var mWords = [];
  if (manifesto) {
    var words = manifesto.textContent.trim().split(/\s+/);
    manifesto.textContent = '';
    words.forEach(function (word, idx) {
      var s = document.createElement('span');
      s.className = 'mw' + (/^(clareza|sigilo|responsabilidade)/i.test(word) ? ' gold' : '');
      s.textContent = word;
      manifesto.appendChild(s);
      if (idx < words.length - 1) manifesto.appendChild(document.createTextNode(' '));
      mWords.push(s);
    });
  }
  var mLit = -1;

  // Assinatura do rodapé: letra por letra
  var mark = document.querySelector('.footer-mark');
  if (mark) {
    var txt = mark.textContent;
    mark.textContent = '';
    txt.split('').forEach(function (ch, idx) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', idx);
      s.textContent = ch === ' ' ? ' ' : ch;
      mark.appendChild(s);
    });
  }

  // Atraso escalonado para itens irmãos que sobem juntos
  document.querySelectorAll('[data-anim="rise"]').forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.getAttribute('data-anim') === 'rise'; });
    el.style.setProperty('--d', (siblings.indexOf(el) * 0.09) + 's');
  });

  /* ---------- Revelação ao entrar na tela ---------- */
  var revealTargets = document.querySelectorAll('.split, [data-anim], .index, .footer-mark, .hero-photo');
  if (hasIO) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealTargets.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }
  // Telas de toque não têm hover: o que acende ao passar o mouse acende ao chegar no meio da tela
  if (hasIO && window.matchMedia('(hover: none)').matches) {
    var litObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-lit', entry.isIntersecting); });
    }, { rootMargin: '-38% 0px -38% 0px' });
    document.querySelectorAll('.person, .partner, .bulletin-row').forEach(function (el) { litObs.observe(el); });
  }

  // Depois que a foto dos sócios termina de revelar, a aproximação passa a seguir a rolagem
  setTimeout(function () { heroPhoto.classList.add('is-zooming'); requestUpdate(); }, 2600);

  /* ---------- Áreas: sumário com numeral fixo ---------- */
  var items = document.querySelectorAll('.index-item');
  var numerals = document.querySelectorAll('.numeral');
  var caption = document.getElementById('numeral-caption');
  var currentN = 0;

  function showNumeral(n) {
    if (n === currentN) return;
    numerals.forEach(function (el) {
      var k = Number(el.dataset.n);
      el.classList.toggle('is-out', k === currentN);
      el.classList.toggle('is-on', k === n);
    });
    currentN = n;
    caption.textContent = items[n].querySelector('.index-name').textContent;
  }
  function openIndex() {
    var open = document.querySelector('.index-item.is-open');
    return open ? Number(open.dataset.n) : 0;
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.index-btn');
    var n = Number(item.dataset.n);
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      items.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.index-btn').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
      showNumeral(n);
    });
    item.addEventListener('mouseenter', function () { showNumeral(n); });
    btn.addEventListener('focus', function () { showNumeral(n); });
  });
  document.querySelector('.index').addEventListener('mouseleave', function () { showNumeral(openIndex()); });

  // "Usar no formulário": pré-seleciona a área
  var areaSelect = document.getElementById('f-area');
  document.querySelectorAll('[data-form-area]').forEach(function (link) {
    link.addEventListener('click', function () { areaSelect.value = link.getAttribute('data-form-area'); });
  });

  /* ---------- Menu sobreposto ---------- */
  var closeTimer;
  function setMenu(open) {
    clearTimeout(closeTimer);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      overlay.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { overlay.classList.add('is-open'); }); });
      overlay.querySelector('a').focus({ preventScroll: true });
    } else {
      overlay.classList.remove('is-open');
      closeTimer = setTimeout(function () { overlay.hidden = true; }, 600);
    }
    update();
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  overlay.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 1140px)').addEventListener('change', function () { setMenu(false); });

  /* ---------- Movimento ligado à rolagem ---------- */
  var docket = document.querySelector('.docket');
  var entries = document.querySelectorAll('.docket-entry');

  function sectionAt(y) {
    var found = null;
    themed.forEach(function (el) {
      if (el.offsetParent === null && el.tagName !== 'FOOTER') return;
      var r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) found = el;
    });
    return found;
  }

  function update() {
    var vh = window.innerHeight;
    var y = window.scrollY;
    var onHome = !home.hidden;
    var menuOpen = document.body.classList.contains('menu-open');

    // Barra de leitura e header
    var max = document.documentElement.scrollHeight - vh;
    readBar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    header.classList.toggle('is-condensed', y > 40);
    var under = sectionAt(header.offsetHeight / 2);
    header.classList.toggle('is-dark', menuOpen || (onHome && !!under && under.getAttribute('data-theme') === 'escuro'));

    if (!onHome) { sideIndex.classList.remove('is-visible'); return; }

    // Índice lateral
    var mid = sectionAt(vh * 0.5);
    sideIndex.classList.toggle('is-visible', y > vh * 0.6);
    sideIndex.classList.toggle('on-dark', !!mid && mid.getAttribute('data-theme') === 'escuro');
    var midId = mid ? mid.id : '';
    sideLinks.forEach(function (a) { a.classList.toggle('is-active', a.dataset.for === midId); });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + midId); });

    // Cortina das seções escuras
    curtains.forEach(function (sec) {
      var top = sec.getBoundingClientRect().top;
      var p = clamp((vh - top) / (vh * 0.9), 0, 1);
      var e = p * p * (3 - 2 * p);
      sec.style.setProperty('--cx', ((1 - e) * Math.min(window.innerWidth * 0.05, 56)).toFixed(2) + 'px');
      sec.style.setProperty('--cr', ((1 - e) * 56).toFixed(2) + 'px');
    });

    // Movimentos contínuos: só com movimento completo
    if (!reduceMotion) {
      // Foto dos sócios: aproxima levemente conforme a rolagem
      if (heroPhoto.classList.contains('is-zooming') && y < vh * 1.5) {
        heroImg.style.setProperty('--zoom', (1 + clamp(y / vh, 0, 1) * 0.08).toFixed(4));
      }
      // Galeria da UFRJ: colunas deslizam em velocidades diferentes
      drifting.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.speed);
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }

    // Manifesto: acende palavra por palavra
    if (manifesto) {
      var mr = manifesto.getBoundingClientRect();
      var mp = clamp((vh * 0.9 - mr.top) / (mr.height + vh * 0.45), 0, 1);
      var lit = Math.round(mp * mWords.length);
      if (lit !== mLit) {
        mWords.forEach(function (w, k) { w.classList.toggle('on', k < lit); });
        mLit = lit;
      }
    }

    // Andamento: linha que se preenche e selos que são carimbados
    var dr = docket.getBoundingClientRect();
    docket.style.setProperty('--fill', clamp((vh * 0.6 - dr.top) / dr.height, 0, 1).toFixed(3));
    entries.forEach(function (en) { en.classList.toggle('is-on', en.getBoundingClientRect().top < vh * 0.6); });
  }

  var ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  /* ---------- Boletim: imagem que acompanha o cursor ---------- */
  var hoverBox = document.querySelector('.hover-img');
  var hoverImg = hoverBox.querySelector('img');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  if (!reduceMotion) {
    var pos = { x: 0, y: 0 }, target = { x: 0, y: 0 }, scale = .6, running = false;
    var loop = function () {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      scale += ((hoverBox.classList.contains('is-on') ? 1 : .6) - scale) * 0.12;
      var rot = clamp((target.x - pos.x) * 0.04, -8, 8);
      hoverBox.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0) translate(-50%,-50%) rotate(' + rot + 'deg) scale(' + scale.toFixed(3) + ')';
      if (running) requestAnimationFrame(loop);
    };
    document.querySelectorAll('.bulletin-row').forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        if (!finePointer.matches) return;
        hoverImg.src = row.dataset.img;
        if (!running) { pos.x = target.x = e.clientX; pos.y = target.y = e.clientY; running = true; requestAnimationFrame(loop); }
        hoverBox.classList.add('is-on');
      });
      row.addEventListener('mousemove', function (e) { target.x = e.clientX; target.y = e.clientY; });
      row.addEventListener('mouseleave', function () {
        hoverBox.classList.remove('is-on');
        setTimeout(function () { if (!hoverBox.classList.contains('is-on')) running = false; }, 400);
      });
    });
  }

  /* ---------- Páginas internas simuladas (#/rota) ---------- */
  var baseTitle = document.title;
  function route() {
    var hash = decodeURIComponent(location.hash);
    if (hash.indexOf('#/') === 0) {
      var target = document.querySelector('.page[data-view="' + hash.slice(2) + '"]');
      if (target) {
        home.hidden = true;
        pages.forEach(function (p) { p.hidden = p !== target; });
        var h1 = target.querySelector('h1');
        document.title = h1.textContent + ' | Bulhões e Ferreira Advogados';
        window.scrollTo(0, 0);
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
        update();
        return;
      }
    }
    var wasHidden = home.hidden;
    home.hidden = false;
    pages.forEach(function (p) { p.hidden = true; });
    document.title = baseTitle;
    if (wasHidden) {
      var anchor = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      if (anchor) anchor.scrollIntoView();
      else window.scrollTo(0, 0);
    }
    update();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- Formulário de contato ---------- */
  var form = document.getElementById('form-contato');
  var success = document.getElementById('form-sucesso');

  // Máscara simples de telefone brasileiro
  var tel = document.getElementById('f-tel');
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    tel.value = out;
  });

  var rules = {
    nome: function (v) { return v.trim().length >= 3 || 'Informe seu nome completo.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido.'; },
    telefone: function (v) {
      var n = v.replace(/\D/g, '').length;
      return (n === 10 || n === 11) || 'Informe um telefone com DDD.';
    },
    area: function (v) { return v !== '' || 'Selecione a área de interesse.'; },
    mensagem: function (v) { return v.trim().length >= 20 || 'Descreva sua questão em pelo menos 20 caracteres.'; },
    lgpd: function (v, el) { return el.checked || 'É necessário concordar com a Política de Privacidade para enviar.'; }
  };

  function errorEl(field) { return document.getElementById(field.getAttribute('aria-describedby')); }
  function validate(field) {
    var result = rules[field.name](field.value, field);
    if (result === true) {
      field.removeAttribute('aria-invalid');
      errorEl(field).textContent = '';
      return true;
    }
    field.setAttribute('aria-invalid', 'true');
    errorEl(field).textContent = result;
    return false;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    field.addEventListener('blur', function () { if (field.dataset.touched) validate(field); });
    field.addEventListener('input', function () {
      field.dataset.touched = '1';
      if (field.getAttribute('aria-invalid')) validate(field);
    });
    field.addEventListener('change', function () { field.dataset.touched = '1'; validate(field); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!validate(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    // Envio simulado. Integre aqui o seu back-end ou serviço de formulários.
    var btn = form.querySelector('[type="submit"]');
    var label = btn.querySelector('span');
    btn.disabled = true;
    label.textContent = 'Enviando…';
    setTimeout(function () {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      form.reset();
      btn.disabled = false;
      label.textContent = 'Enviar mensagem';
    }, 700);
  });

  document.getElementById('form-nova').addEventListener('click', function () {
    success.hidden = true;
    form.hidden = false;
    Object.keys(rules).forEach(function (name) { delete form.elements[name].dataset.touched; });
    form.elements.nome.focus();
  });

  /* ---------- Ano no rodapé ---------- */
  document.getElementById('ano').textContent = new Date().getFullYear();
})();
