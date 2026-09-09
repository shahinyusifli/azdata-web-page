(function () {
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
    var href = link.getAttribute('href').split('/').pop().split('#')[0];
    if (href === path) {
      link.classList.add('active');
      var parent = link.closest('.nav-item');
      if (parent) parent.querySelector('button').classList.add('active');
    }
  });

  var announce = document.querySelector('.announce');
  if (announce) {
    var key = 'azdata-announce-dismissed';
    try { if (localStorage.getItem(key) === '1') announce.hidden = true; } catch (e) {}
    var close = announce.querySelector('.announce-close');
    if (close) close.addEventListener('click', function () {
      announce.hidden = true;
      try { localStorage.setItem(key, '1'); } catch (e) {}
    });
  }

  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var items = document.querySelectorAll('.nav-item');
  var isTouchLayout = function () { return window.matchMedia('(max-width: 900px)').matches; };
  items.forEach(function (item) {
    var btn = item.querySelector('button');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !item.classList.contains('open');
      items.forEach(function (other) { other.classList.remove('open'); other.querySelector('button').setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    item.addEventListener('mouseenter', function () { if (!isTouchLayout()) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } });
    item.addEventListener('mouseleave', function () { if (!isTouchLayout()) { item.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('click', function () {
    items.forEach(function (item) { item.classList.remove('open'); item.querySelector('button').setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') items.forEach(function (item) { item.classList.remove('open'); });
  });

  var revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in-view'); });
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var navEl = document.querySelector('header.nav');
  var progressEl = document.createElement('div');
  progressEl.className = 'scroll-progress';
  document.body.appendChild(progressEl);
  var ticking = false;
  function updateOnScroll() {
    var scrollY = window.scrollY || window.pageYOffset;
    if (navEl) navEl.classList.toggle('is-scrolled', scrollY > 8);
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    progressEl.style.width = (scrollable > 0 ? (scrollY / scrollable) * 100 : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(updateOnScroll); ticking = true; }
  }, { passive: true });
  updateOnScroll();

  if (!prefersReducedMotion) {
    document.querySelectorAll('.hero, .page-hero').forEach(function (hero) {
      hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (((e.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%');
        hero.style.setProperty('--my', (((e.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%');
      });
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;
    question.addEventListener('click', function () {
      var isOpen = item.getAttribute('data-open') === 'true';
      document.querySelectorAll('.faq-item[data-open="true"]').forEach(function (openItem) {
        if (openItem !== item) { openItem.setAttribute('data-open', 'false'); openItem.querySelector('.faq-answer').style.maxHeight = null; }
      });
      item.setAttribute('data-open', isOpen ? 'false' : 'true');
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  // Form backend: the Cloudflare Worker in /worker. Set this to the URL printed by `wrangler deploy`.
  var API_BASE = 'https://azdata-forms.azdata-forms.workers.dev';
  var MAX_FILE_BYTES = 5 * 1024 * 1024;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var note = form.querySelector('.form-note');
    var submitBtn = form.querySelector('[type="submit"]');
    var successText = form.getAttribute('data-success') || 'Thanks — we got it and will reply by email.';

    function say(text, ok) {
      if (!note) return;
      note.textContent = text;
      note.classList.toggle('success', !!ok);
      note.classList.toggle('error', !ok && !!text);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var missing = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (el) {
        return el.type === 'file' ? !el.files.length : !el.value.trim();
      });
      if (missing.length) { say('Please fill in the required fields.', false); missing[0].focus(); return; }

      var emailEl = form.querySelector('input[type="email"]');
      if (emailEl && !EMAIL_RE.test(emailEl.value.trim())) { say('Please enter a valid email address.', false); emailEl.focus(); return; }

      var tooBig = Array.prototype.some.call(form.querySelectorAll('input[type="file"]'), function (el) {
        return el.files.length && el.files[0].size > MAX_FILE_BYTES;
      });
      if (tooBig) { say('Please attach a file under 5 MB.', false); return; }

      if (API_BASE.indexOf('YOUR-SUBDOMAIN') !== -1) { say('This form is not connected yet — see worker/README.md.', false); return; }

      var fd = new FormData(form);
      fd.set('form', form.getAttribute('data-form'));
      fd.set('page', window.location.href);

      if (submitBtn) submitBtn.disabled = true;
      say('Sending…', true);

      fetch(API_BASE, { method: 'POST', body: fd })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.data.error || 'Request failed');
          form.reset();
          say(successText, true);
        })
        .catch(function (err) { say(err.message || 'Something went wrong — please try again.', false); })
        .then(function () { if (submitBtn) submitBtn.disabled = false; });
    });
  });

  var roleSelect = document.getElementById('apply-role');
  if (roleSelect) {
    document.querySelectorAll('a[data-role]').forEach(function (link) {
      link.addEventListener('click', function () {
        roleSelect.value = link.getAttribute('data-role');
        window.setTimeout(function () { var first = document.getElementById('apply-name'); if (first) first.focus(); }, 400);
      });
    });
  }
})();
