// SOBEL site behaviour: mobile menu, words that light up on scroll, rising photo cards,
// copy account number, contact form.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intro loading animation: spelling out SOBEL
  var curtain = document.getElementById('intro-curtain');
  if (curtain) {
    if (reduce) {
      curtain.classList.add('is-done');
      if (curtain.parentNode) curtain.parentNode.removeChild(curtain);
    } else {
      var dismissed = false;
      var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        curtain.classList.add('is-done');
        setTimeout(function () {
          if (curtain.parentNode) curtain.parentNode.removeChild(curtain);
        }, 350);
      };
      setTimeout(dismiss, 1500);
      curtain.addEventListener('click', dismiss);
      curtain.addEventListener('keydown', dismiss);
    }
  }

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var close = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
    };
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); toggle.focus(); }
    });
  }

  // Words that light up as you scroll (text stays readable to screen readers as one string)
  var glows = [];
  if (!reduce) {
    document.querySelectorAll('[data-glow]').forEach(function (el) {
      var text = el.textContent.trim().replace(/\s+/g, ' ');
      var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
      el.innerHTML = '<span class="visually-hidden">' + esc(text) + '</span><span aria-hidden="true">' +
        text.split(' ').map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ') + '</span>';
      glows.push({ el: el, words: Array.prototype.slice.call(el.querySelectorAll('.w')) });
    });
  }

  // Photo cards that rise at different speeds
  var risers = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-rise]'));

  if (glows.length || risers.length) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      glows.forEach(function (g) {
        var r = g.el.getBoundingClientRect();
        // 0 when the block's top reaches 85% of the screen, 1 when its bottom reaches 45%
        var p = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
        p = Math.max(0, Math.min(1, p));
        var lit = Math.round(p * g.words.length);
        g.words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
      });
      risers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute('data-rise')) || 0.15;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // Copy the account number
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var status = document.getElementById(btn.getAttribute('aria-describedby'));
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      var done = function () { if (status) status.textContent = 'Account number copied.'; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 2500); };
      var fail = function () { if (status) status.textContent = 'Could not copy. The number is ' + value + '.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, fail);
      else fail();
    });
  });

  // Contact form: opens the visitor's email app with the message ready to send
  var form = document.getElementById('contact-form');
  if (form) {
    var to = form.getAttribute('data-to');
    var status = document.getElementById('form-status');
    var check = function (input) {
      var err = document.getElementById(input.id + '-err');
      var ok = input.checkValidity();
      input.toggleAttribute('aria-invalid', !ok);
      if (err) {
        if (ok) { err.textContent = ''; input.removeAttribute('aria-describedby'); }
        else {
          err.textContent = input.validity.valueMissing ? 'Please fill this in.' : 'That email looks incomplete. Write it as name@example.com.';
          input.setAttribute('aria-describedby', err.id);
        }
      }
      return ok;
    };
    form.querySelectorAll('input[required], textarea[required]').forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) check(input); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required]'));
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) { status.textContent = ''; bad[0].focus(); return; }
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var phone = form.elements.phone.value.trim();
      var message = form.elements.message.value.trim();
      var body = message + '\n\n' + name + '\n' + email + (phone ? '\n' + phone : '');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Message from ' + name + ' via the SOBEL website') + '&body=' + encodeURIComponent(body);
      status.textContent = 'Your email app should open with your message ready. Press send there to reach us.';
    });
  }
})();
