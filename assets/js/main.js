/* =========================================================
   Undangan Pernikahan — Yogi & Ratna
   Vanilla JS, tanpa dependensi.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     KONFIGURASI — ubah bagian ini saja untuk menyesuaikan
     --------------------------------------------------------- */
  var CONFIG = {
    // Waktu akad (WIB = UTC+7). Format: YYYY-MM-DDTHH:mm:ss+07:00
    eventDate: '2025-10-12T08:00:00+07:00',
    // Nama tamu default bila tidak ada parameter ?to= di URL
    defaultGuest: 'Tamu Undangan',
    // Kunci penyimpanan ucapan di browser
    storageKey: 'wedding_wishes_yogi_ratna',
    // Ucapan bawaan yang tampil saat pertama kali dibuka
    seedWishes: [
      { name: 'Siti Nurhaliza', message: 'Selamat menempuh hidup baru, semoga selalu bahagia. Aamiin 🤲', attend: 'Hadir', ts: Date.now() - 2 * 3600e3 },
      { name: 'Budi Santoso',   message: 'Baraliaklah, semoga menjadi keluarga sakinah mawaddah warahmah.', attend: 'Hadir', ts: Date.now() - 5 * 3600e3 },
      { name: 'Ani Fitriani',   message: 'Ikut berbahagia, lancar sampai hari H ya!', attend: 'Tidak Hadir', ts: Date.now() - 7 * 3600e3 }
    ]
  };

  /* --------------------------- Util --------------------------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var pad = function (n) { return n < 10 ? '0' + n : String(n); };

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Penyimpanan aman: localStorage bisa diblokir (mode privat). */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    }
  };

  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* ---------------------------------------------------------
     1. NAMA TAMU DARI URL  (?to=Nama%20Tamu  atau  ?kepada=)
     --------------------------------------------------------- */
  (function guestName() {
    var params = new URLSearchParams(window.location.search);
    var name = params.get('to') || params.get('kepada') || params.get('nama');
    var el = $('#guestName');
    if (el && name) {
      el.textContent = name.replace(/[<>]/g, '').slice(0, 60);
    } else if (el) {
      el.textContent = CONFIG.defaultGuest;
    }
  })();

  /* ---------------------------------------------------------
     2. MUSIK LATAR
     --------------------------------------------------------- */
  var audio = $('#bgm');
  var musicBtn = $('#musicToggle');
  var musicLabel = $('#musicLabel');
  var audioOk = true;

  function setMusicState(playing) {
    if (!musicBtn) return;
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (musicLabel) musicLabel.textContent = playing ? 'Jeda Musik' : 'Putar Musik';
  }

  function playMusic() {
    if (!audio || !audioOk) return;
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () { setMusicState(true); })
       .catch(function () { setMusicState(false); });
    } else {
      setMusicState(true);
    }
  }

  if (audio) {
    // Berkas musik belum ada / gagal dimuat → tombol tetap ada tapi tidak error.
    audio.addEventListener('error', function () {
      audioOk = false;
      setMusicState(false);
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (!audio) return;
      if (audio.paused) {
        if (!audioOk) { toast('Musik belum tersedia. Letakkan berkas di assets/audio/music.mp3'); return; }
        playMusic();
      } else {
        audio.pause();
        setMusicState(false);
      }
    });
  }

  /* ---------------------------------------------------------
     3. BUKA UNDANGAN
     --------------------------------------------------------- */
  var cover = $('#cover');
  var main = $('#main');
  var nav = $('#nav');
  var btnOpen = $('#btnOpen');

  function openInvitation() {
    if (!cover || !main) return;

    main.classList.add('is-shown');
    document.body.classList.remove('is-locked');
    cover.classList.add('is-open');

    if (nav) nav.classList.add('is-visible');
    if (musicBtn) musicBtn.classList.add('music--float');

    // Musik hanya boleh dimulai lewat interaksi pengguna — di sinilah tempatnya.
    playMusic();

    window.scrollTo(0, 0);
    setTimeout(function () {
      cover.classList.add('is-gone');
      revealAll();
      var home = $('#home');
      if (home) {
        home.setAttribute('tabindex', '-1');
        home.focus({ preventScroll: true });
      }
    }, 1000);
  }

  if (btnOpen) btnOpen.addEventListener('click', openInvitation);

  /* ---------------------------------------------------------
     4. HITUNG MUNDUR
     --------------------------------------------------------- */
  (function countdown() {
    var wrap = $('#countdown');
    var done = $('#countdownDone');
    if (!wrap) return;

    var target = new Date(CONFIG.eventDate).getTime();
    if (isNaN(target)) return;

    var fields = {
      days: $('[data-cd="days"]', wrap),
      hours: $('[data-cd="hours"]', wrap),
      minutes: $('[data-cd="minutes"]', wrap),
      seconds: $('[data-cd="seconds"]', wrap)
    };

    function tick() {
      var diff = target - Date.now();

      if (diff <= 0) {
        Object.keys(fields).forEach(function (k) { if (fields[k]) fields[k].textContent = '00'; });
        if (done) done.hidden = false;
        clearInterval(timer);
        return;
      }

      var s = Math.floor(diff / 1000);
      if (fields.days)    fields.days.textContent    = pad(Math.floor(s / 86400));
      if (fields.hours)   fields.hours.textContent   = pad(Math.floor(s % 86400 / 3600));
      if (fields.minutes) fields.minutes.textContent = pad(Math.floor(s % 3600 / 60));
      if (fields.seconds) fields.seconds.textContent = pad(s % 60);
    }

    tick();
    var timer = setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------
     5. ANIMASI SAAT DI-SCROLL
     --------------------------------------------------------- */
  var revealEls = $$('.reveal');

  function revealAll() {
    revealEls.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.92) el.classList.add('is-in');
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------
     6. NAV AKTIF MENGIKUTI SECTION
     --------------------------------------------------------- */
  (function navSpy() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { threshold: 0.2, rootMargin: '-20% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  })();

  /* ---------------------------------------------------------
     7. TOMBOL KEMBALI KE ATAS
     --------------------------------------------------------- */
  (function backToTop() {
    var btn = $('#btnTop');
    if (!btn) return;

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        btn.classList.toggle('is-visible', window.scrollY > 500);
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------------------------------------------------------
     8. GALERI + LIGHTBOX
     --------------------------------------------------------- */
  (function gallery() {
    var track = $('#galleryTrack');
    var box = $('#lightbox');
    var img = $('#lbImg');
    var caption = $('#lbCaption');
    if (!track || !box || !img) return;

    var items = $$('.gallery__item', track);
    var photos = items.map(function (btn) {
      var im = $('img', btn);
      return { src: im ? im.getAttribute('src') : '', alt: im ? im.getAttribute('alt') : '' };
    });
    var current = 0;
    var lastFocus = null;

    function show(i) {
      current = (i + photos.length) % photos.length;
      img.setAttribute('src', photos[current].src);
      img.setAttribute('alt', photos[current].alt);
      if (caption) caption.textContent = 'Foto ' + (current + 1) + ' dari ' + photos.length;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('is-locked');
      $('#lbClose').focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(i); });
    });

    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { show(current - 1); });
    $('#lbNext').addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });

    // Geser dengan sentuhan
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    }, { passive: true });

    // Panah geser daftar foto
    function scrollByCard(dir) {
      var card = items[0];
      var step = card ? card.getBoundingClientRect().width + 14 : 220;
      track.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
    }
    var prev = $('#galPrev'), next = $('#galNext');
    if (prev) prev.addEventListener('click', function () { scrollByCard(-1); });
    if (next) next.addEventListener('click', function () { scrollByCard(1); });
  })();

  /* ---------------------------------------------------------
     9. RSVP + UCAPAN & DOA
     --------------------------------------------------------- */
  (function rsvp() {
    var form = $('#rsvpForm');
    var list = $('#wishList');
    var counter = $('#wishCount');
    var note = $('#formNote');
    if (!form || !list) return;

    var wishes = store.get(CONFIG.storageKey, null);
    if (!Array.isArray(wishes)) wishes = CONFIG.seedWishes.slice();

    function timeAgo(ts) {
      var s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return 'baru saja';
      var m = Math.floor(s / 60);
      if (m < 60) return m + ' menit lalu';
      var h = Math.floor(m / 60);
      if (h < 24) return h + ' jam lalu';
      var d = Math.floor(h / 24);
      if (d < 30) return d + ' hari lalu';
      return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function initials(name) {
      var parts = String(name).trim().split(/\s+/).slice(0, 2);
      return parts.map(function (p) { return p.charAt(0).toUpperCase(); }).join('') || '?';
    }

    function render() {
      list.innerHTML = wishes.map(function (w) {
        var hadir = w.attend === 'Hadir';
        return '<li class="wish">' +
          '<span class="wish__avatar" aria-hidden="true">' + escapeHTML(initials(w.name)) + '</span>' +
          '<div class="wish__body">' +
            '<div class="wish__head">' +
              '<span class="wish__name">' + escapeHTML(w.name) + '</span>' +
              '<span class="wish__time">' + timeAgo(w.ts) + '</span>' +
            '</div>' +
            '<p class="wish__text">' + escapeHTML(w.message) + '</p>' +
            '<span class="wish__badge' + (hadir ? ' wish__badge--hadir' : '') + '">' + escapeHTML(w.attend || '-') + '</span>' +
          '</div>' +
        '</li>';
      }).join('');

      if (counter) {
        var hadirCount = wishes.filter(function (w) { return w.attend === 'Hadir'; }).length;
        counter.textContent = wishes.length + ' ucapan · ' + hadirCount + ' konfirmasi hadir';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements.name.value.trim();
      var message = form.elements.message.value.trim();
      var attend = (form.querySelector('input[name="attend"]:checked') || {}).value || 'Hadir';
      var count = form.elements.count.value;

      if (name.length < 2) {
        if (note) { note.textContent = 'Mohon isi nama lengkap Anda.'; note.classList.add('is-error'); }
        form.elements.name.focus();
        return;
      }

      wishes.unshift({
        name: name,
        message: message || 'Selamat menempuh hidup baru!',
        attend: attend,
        count: count,
        ts: Date.now()
      });

      var saved = store.set(CONFIG.storageKey, wishes);
      render();
      form.reset();

      if (note) {
        note.classList.remove('is-error');
        note.textContent = saved
          ? 'Terima kasih, ' + name + '. Konfirmasi Anda sudah kami terima.'
          : 'Terima kasih, ' + name + '. (Catatan: browser memblokir penyimpanan, ucapan hilang saat halaman dimuat ulang.)';
      }
      toast('Konfirmasi terkirim. Terima kasih!');
      list.scrollTop = 0;
    });

    render();
  })();

  /* ---------------------------------------------------------
     10. SALIN NOMOR REKENING
     --------------------------------------------------------- */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        toast(ok ? 'Nomor rekening disalin' : 'Gagal menyalin, silakan salin manual');
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value)
          .then(function () { toast('Nomor rekening disalin'); })
          .catch(fallback);
      } else {
        fallback();
      }
    });
  });

  /* ---------------------------------------------------------
     11. SCROLL HALUS UNTUK NAV (offset nav atas)
     --------------------------------------------------------- */
  $$('.nav__link').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = window.innerWidth <= 640 ? 12 : 78;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

})();
