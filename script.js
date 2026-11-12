(() => {
  'use strict';

  /* ---- Configurações ---- */
  const WHATSAPP = '5551999990000';
  const BRAND = 'FORJA Academia';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  $$('img').forEach(img => {
    const fail = () => img.classList.add('img-fail');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  const start = () => document.body.classList.add('is-loaded');
  if (document.readyState === 'complete') requestAnimationFrame(start);
  else window.addEventListener('load', () => requestAnimationFrame(start));
  setTimeout(start, 1800);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  $$('[data-stagger]').forEach(group => {
    [...group.children].forEach((el, i) => el.style.setProperty('--i', i));
  });
  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], [data-stagger], .img-reveal, .vagas').forEach(el => revealIO.observe(el));

  const countIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      obs.unobserve(el);
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || 0, 10);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const fmt = v => pre + v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (reduced) { el.textContent = fmt(end); return; }
      const dur = 1800, t0 = performance.now();
      const tick = t => {
        const p = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(end * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', e => e.matches && setMenu(false));

  const header = $('#header');
  let lastY = window.scrollY;

  const scrub = $('#scrub');
  let words = [];
  if (scrub) {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else {
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = part;
              frag.appendChild(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(scrub);
    words = $$('.w', scrub);
    if (reduced) scrub.classList.add('static');
  }

  const pEls = reduced ? [] : $$('[data-parallax]');
  const parallax = () => {
    const vh = window.innerHeight;
    pEls.forEach(el => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -150 || box.top > vh + 150) return;
      const offset = box.top + box.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(offset * -parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`;
    });
  };

  const toTop = $('#toTop');
  const toTopBar = $('#toTopBar');
  const progressBar = $('.progress span');
  const sticky = $('#stickyCta');
  const CIRC = 2 * Math.PI * 22;
  toTopBar.style.strokeDasharray = CIRC;
  toTopBar.style.strokeDashoffset = CIRC;

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    toTop.blur();
  });

  let ctaBlocked = 0;
  const blockIO = new IntersectionObserver(entries => {
    entries.forEach(e => { ctaBlocked += e.isIntersecting ? 1 : -1; });
    ctaBlocked = Math.max(0, ctaBlocked);
    document.body.classList.toggle('cta-hidden', ctaBlocked > 0);
    updateScroll();
  }, { threshold: .1 });
  $$('#contato, .final').forEach(el => blockIO.observe(el));

  function updateScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;

    progressBar.style.transform = `scaleX(${p})`;
    toTopBar.style.strokeDashoffset = CIRC * (1 - p);
    toTop.classList.toggle('is-visible', y > 600);

    const heroH = window.innerHeight * .8;
    sticky.classList.toggle('is-visible', y > heroH && ctaBlocked === 0);

    header.classList.toggle('is-scrolled', y > 40);
    const open = menu.classList.contains('is-open');
    header.classList.toggle('is-hidden', !open && y > lastY && y > 500);
    lastY = y;

    if (words.length && !reduced) {
      const r = scrub.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = clamp((vh * .85 - r.top) / (r.height + vh * .25), 0, 1);
      const upTo = Math.round(prog * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < upTo));
    }

    if (steps.length) {
      const mid = window.innerHeight * .55;
      let best = null, dist = Infinity;
      steps.forEach(s => {
        const b = s.getBoundingClientRect();
        const d = Math.abs(b.top + b.height / 2 - mid);
        if (d < dist) { dist = d; best = s; }
      });
      steps.forEach(s => s.classList.toggle('is-active', s === best));
    }
  }

  const steps = $$('.step');

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateScroll(); parallax(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScroll();
  parallax();

  const panels = $$('.panel');
  const activate = p => {
    if (p.classList.contains('is-active')) return;
    panels.forEach(x => x.classList.toggle('is-active', x === p));
  };
  panels.forEach(p => {
    p.addEventListener('click', () => activate(p));
    p.addEventListener('focus', () => activate(p));
    p.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(p); }
    });
    if (finePointer && window.innerWidth > 960) p.addEventListener('mouseenter', () => activate(p));
  });

  const quotes = $('#quotes');
  const step = () => ($('.quote', quotes)?.offsetWidth || 400) + 16;
  $('#prevQuote').addEventListener('click', () => quotes.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#nextQuote').addEventListener('click', () => {
    const atEnd = quotes.scrollLeft + quotes.clientWidth >= quotes.scrollWidth - 8;
    quotes.scrollTo({ left: atEnd ? 0 : quotes.scrollLeft + step(), behavior: 'smooth' });
  });
  quotes.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') $('#nextQuote').click();
    if (e.key === 'ArrowLeft') $('#prevQuote').click();
  });

  $$('.qa').forEach(item => {
    const btn = $('.qa__q', item);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      $$('.qa').forEach(o => {
        o.classList.remove('is-open');
        $('.qa__q', o).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const planSelect = $('#planSelect');
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
    planSelect.value = b.dataset.plan;
    $('#contato').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => $('#leadForm input[name="nome"]').focus({ preventScroll: true }), 700);
  }));

  const form = $('#leadForm');
  const setError = (input, bad) => input.closest('.field').classList.toggle('has-error', bad);

  $$('input', form).forEach(i => i.addEventListener('input', () => setError(i, false)));

  const phoneInput = form.elements.whats;
  phoneInput.addEventListener('input', () => {
    let v = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = v.replace(/^(\d{2})(\d{5}|\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    phoneInput.value = v;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.elements.nome;
    const whats = form.elements.whats;
    const badName = nome.value.trim().length < 2;
    const badPhone = whats.value.replace(/\D/g, '').length < 10;
    setError(nome, badName);
    setError(whats, badPhone);
    if (badName || badPhone) { (badName ? nome : whats).focus(); return; }

    const msg =
`Olá, ${BRAND}! Quero minha semana grátis.

Nome: ${nome.value.trim()}
WhatsApp: ${whats.value}
Objetivo: ${form.elements.objetivo.value}
Plano de interesse: ${form.elements.plano.value}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .22;
        const y = (e.clientY - r.top - r.height / 2) * .32;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }
})();