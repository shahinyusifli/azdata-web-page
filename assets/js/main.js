(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
    var href = link.getAttribute('href').split('/').pop();
    if (href === path || (href === 'index.html' && path === '')) {
      link.classList.add('active');
    }
  });

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

  var revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in-view'); });
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var navEl = document.querySelector('header.nav');
  var progressEl = document.createElement('div');
  progressEl.className = 'scroll-progress';
  document.body.appendChild(progressEl);

  var heroArt = document.querySelector('.hero .blueprint');
  var ticking = false;

  function updateOnScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (navEl) navEl.classList.toggle('is-scrolled', scrollY > 8);

    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    var pct = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
    progressEl.style.width = pct + '%';

    if (heroArt && !prefersReducedMotion) {
      var shift = Math.min(scrollY * 0.08, 28);
      heroArt.style.transform = 'translateY(' + shift + 'px)';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }, { passive: true });
  updateOnScroll();

  var heroEl = document.querySelector('.hero');
  if (heroEl && !prefersReducedMotion) {
    heroEl.addEventListener('mousemove', function (e) {
      var rect = heroEl.getBoundingClientRect();
      var mx = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%';
      var my = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%';
      heroEl.style.setProperty('--mx', mx);
      heroEl.style.setProperty('--my', my);
    });
  }

  if (!prefersReducedMotion) {
    document.querySelectorAll('a[data-transition]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
        e.preventDefault();
        document.body.classList.add('is-leaving');
        window.setTimeout(function () {
          window.location.href = href;
        }, 260);
      });
    });
  }

  document.querySelectorAll('.testimonials').forEach(function (widget) {
    var track = widget.querySelector('.testimonial-track');
    var slides = widget.querySelectorAll('.testimonial-slide');
    var dotsWrap = widget.querySelector('.testimonial-dots');
    var prevBtn = widget.querySelector('.testimonial-arrow.prev');
    var nextBtn = widget.querySelector('.testimonial-arrow.next');
    if (!track || slides.length < 2) return;

    var index = 0;
    var dots = [];

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testimonial-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function render() {
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
      resetAutoplay();
    }

    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });

    var autoplay;
    function resetAutoplay() {
      window.clearInterval(autoplay);
      if (prefersReducedMotion) return;
      autoplay = window.setInterval(function () { goTo(index + 1); }, 6000);
    }

    widget.addEventListener('mouseenter', function () { window.clearInterval(autoplay); });
    widget.addEventListener('mouseleave', resetAutoplay);

    render();
    resetAutoplay();
  });

  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form-note');
      var name = form.elements['name'].value.trim();
      var email = form.elements['email'].value.trim();
      var message = form.elements['message'].value.trim();

      if (!name || !email || !message) {
        note.textContent = 'Please fill in every field before sending.';
        note.classList.remove('success');
        return;
      }

      var subject = encodeURIComponent('New project inquiry from ' + name);
      var body = encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      note.textContent = 'Opening your email client…';
      note.classList.add('success');
      window.location.href = 'mailto:hello@azdata.app?subject=' + subject + '&body=' + body;
    });
  }
})();
