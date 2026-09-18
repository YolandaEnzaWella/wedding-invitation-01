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
    //
    // INI SATU-SATUNYA TEMPAT MENGUBAH TANGGAL. Semua tanggal yang tampil di
    // halaman — termasuk nama harinya — dihitung dari sini, jadi tidak mungkin
    // tertulis "Minggu" padahal tanggalnya jatuh di hari Senin. Yang perlu
    // disunting manual hanyalah <title> dan tag meta di index.html, karena
    // keduanya dibaca sebelum JavaScript sempat berjalan.
    eventDate: '2026-10-12T08:00:00+07:00',
    // Nama tamu default bila tidak ada parameter ?to= di URL
    defaultGuest: 'Tamu Undangan',
    // Kunci penyimpanan ucapan di browser (dipakai saat Firebase belum diisi)
    storageKey: 'wedding_wishes_yogi_ratna',
    // Jeda minimal antar pengiriman dari satu perangkat, dalam detik
    cooldown: 20,
    // Jumlah ucapan terbaru yang ditampilkan
    wishLimit: 200,
    // Versi SDK Firebase yang dimuat dari CDN resmi Google
    firebaseVersion: '10.13.0',
    // Berapa detik menunggu Firestore sebelum beralih ke penyimpanan lokal
    firestoreTimeout: 8,
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
     1b. TANGGAL DI HALAMAN, DIHITUNG DARI CONFIG
     --------------------------------------------------------- */
  (function tanggal() {
    var d = new Date(CONFIG.eventDate);
    if (isNaN(d)) return;

    // Acara berlangsung di WIB. Kalau tanggal dirangkai memakai zona waktu
    // perangkat tamu, tamu di zona lain bisa melihat tanggal yang meleset
    // sehari — karena itu semuanya dipaksa ke Asia/Jakarta.
    var zona = { timeZone: 'Asia/Jakarta' };
    function format(opsi) {
      var o = { timeZone: zona.timeZone };
      for (var k in opsi) o[k] = opsi[k];
      try {
        return new Intl.DateTimeFormat('id-ID', o).format(d);
      } catch (e) {
        return null;
      }
    }

    var bentuk = {
      // 12 . 10 . 2026
      titik: function () {
        var p = format({ day: '2-digit', month: '2-digit', year: 'numeric' });
        return p ? p.replace(/[/\-.]/g, ' . ') : null;
      },
      // 12 Oktober 2026
      panjang: function () {
        return format({ day: 'numeric', month: 'long', year: 'numeric' });
      },
      // Senin, 12 Oktober 2026
      lengkap: function () {
        return format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
    };

    $$('[data-tanggal]').forEach(function (el) {
      var fn = bentuk[el.getAttribute('data-tanggal')];
      if (!fn) return;
      var teks = fn();
      // Bila Intl gagal, teks bawaan di HTML dibiarkan apa adanya.
      if (teks) el.textContent = teks;
    });
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

    // Angka hanya dianimasikan saat nilainya benar-benar berubah. Kalau kelas
    // animasi dipasang tiap detik ke keempat kotak, jam dan hari ikut berkedip
    // padahal isinya sama — dan kedipan yang tak ada sebabnya justru terbaca
    // sebagai gangguan, bukan gerak.
    function setAngka(el, nilai) {
      if (!el || el.textContent === nilai) return;
      el.textContent = nilai;
      el.classList.remove('is-tick');
      // Paksa reflow agar animasi bisa diputar ulang dari awal.
      void el.offsetWidth;
      el.classList.add('is-tick');
    }

    function tick() {
      var diff = target - Date.now();

      if (diff <= 0) {
        Object.keys(fields).forEach(function (k) { if (fields[k]) fields[k].textContent = '00'; });
        if (done) done.hidden = false;
        wrap.classList.add('is-selesai');
        clearInterval(timer);
        return;
      }

      var s = Math.floor(diff / 1000);
      setAngka(fields.days,    pad(Math.floor(s / 86400)));
      setAngka(fields.hours,   pad(Math.floor(s % 86400 / 3600)));
      setAngka(fields.minutes, pad(Math.floor(s % 3600 / 60)));
      setAngka(fields.seconds, pad(s % 60));
    }

    tick();
    var timer = setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------
     5. ANIMASI SAAT DI-SCROLL
     --------------------------------------------------------- */
  var revealEls = $$('.reveal, [data-anim]');

  // Jeda bertingkat. Nilai atribut data-stagger adalah jarak antar elemen
  // dalam milidetik; anak langsung yang ber-data-anim mendapat kelipatannya.
  $$('[data-stagger]').forEach(function (induk) {
    var langkah = parseInt(induk.getAttribute('data-stagger'), 10);
    if (!langkah) langkah = 90;
    $$('[data-anim]', induk).forEach(function (el, i) {
      el.style.setProperty('--d', (i * langkah) + 'ms');
    });
  });

  function tampilkan(el) { el.classList.add('is-in'); }

  function sudahLewatiGaris(el) {
    var r = el.getBoundingClientRect();

    // Elemen di dalam .main yang belum ditampilkan melaporkan kotak serba nol.
    // Tanpa penjagaan ini, pemeriksaan di bawah bernilai benar untuk SEMUA
    // elemen sejak halaman dimuat — seluruh animasi masuk habis terpakai
    // sebelum tamu sempat menekan tombol buka, dan yang tersisa hanyalah
    // animasi cover yang memakai @keyframes, bukan transition.
    if (r.width === 0 && r.height === 0) return false;

    // 0,82 bukan 0,95: elemen baru dinyatakan masuk setelah benar-benar
    // berada di dalam layar, bukan saat masih menyerempet tepi bawah.
    // Dengan ambang yang terlalu dekat ke tepi, animasinya sudah selesai
    // sebelum tamu sempat melihat elemennya.
    return r.top < window.innerHeight * 0.82;
  }

  function revealAll() {
    revealEls.forEach(function (el) {
      if (sudahLewatiGaris(el)) tampilkan(el);
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tampilkan(entry.target);
        // Sekali muncul, selesai. Tanpa unobserve, elemen akan beranimasi
        // ulang tiap kali tamu menggulir naik-turun melewatinya.
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -18% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    // Jaring pengaman untuk elemen yang terlewat pengamat. Gambar dan huruf
    // web baru selesai dimuat setelah pengamat dipasang, dan pergeseran tata
    // letak yang ditimbulkannya bisa membuat sebuah elemen tidak pernah
    // tercatat melintasi ambang — elemen itu lalu tersangkut tak terlihat
    // selamanya. Pemeriksaan posisi langsung tidak punya kelemahan itu.
    var terakhir = 0;
    window.addEventListener('scroll', function () {
      var kini = Date.now();
      if (kini - terakhir < 120) return;   // laju dibatasi lewat stempel waktu
      terakhir = kini;
      revealAll();
    }, { passive: true });

    // Sekali lagi setelah semua aset tuntas, untuk isi yang sudah terlihat
    // sejak awal tetapi posisinya bergeser saat gambar mendapat ukurannya.
    window.addEventListener('load', revealAll);
  } else {
    revealEls.forEach(tampilkan);
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

    /* ---- Galeri berjalan sendiri dan berulang ----
       Daftarnya digandakan supaya ada isi yang menyusul ketika salinan
       pertama sudah bergeser habis; tanpa itu akan muncul ruang kosong
       panjang setiap kali putaran hendak mengulang. */
    (function jalankanGaleri() {
      // Perbandingan sisi dipasang dari atribut width/height gambarnya, supaya
      // lebar tiap foto sudah pasti sejak awal. Tanpa ini lebarnya baru
      // diketahui setelah gambar selesai diunduh — dan panjang putaran yang
      // dihitung sebelum itu akan jauh terlalu pendek.
      items.forEach(function (btn) {
        var im = btn.querySelector('img');
        if (!im) return;
        var w = parseFloat(im.getAttribute('width'));
        var h = parseFloat(im.getAttribute('height'));
        if (w > 0 && h > 0) btn.style.aspectRatio = w + ' / ' + h;
      });

      var salinan = items.map(function (btn) {
        return btn.parentNode.cloneNode(true);
      });

      salinan.forEach(function (li) {
        // Salinan hanyalah pengisi mata. Disembunyikan dari pembaca layar dan
        // dikeluarkan dari urutan tab supaya tamu tidak menyusuri sembilan
        // foto yang sama dua kali.
        li.setAttribute('aria-hidden', 'true');
        var b = li.querySelector('.gallery__item');
        if (b) b.tabIndex = -1;
        track.appendChild(li);
      });

      var wadah = track.parentNode;   // .gallery__scroller
      if (!track.animate) return;     // browser lama: deret diam saja, tetap bisa diklik

      // Jarak sampai salinan kedua berada tepat di posisi awal salinan
      // pertama. Bukan separuh lebar jalur: `gap` menyisipkan satu celah
      // tambahan di sambungan kedua salinan, jadi setengah celah harus
      // ikut dihitung — kalau tidak, tiap putaran meleset sedikit dan
      // lama-lama sambungannya terlihat meloncat.
      var LAJU = 26;        // piksel per detik
      var periode = 0, durasi = 0;

      function ukurPeriode() {
        var gaya = window.getComputedStyle(track);
        var celah = parseFloat(gaya.columnGap || gaya.gap) || 14;
        // Jarak sampai salinan kedua berada tepat di posisi awal salinan
        // pertama. Bukan separuh lebar jalur: `gap` menyisipkan satu celah
        // tambahan di sambungan kedua salinan, jadi setengah celah ikut
        // dihitung — kalau tidak, tiap putaran meleset dan lama-lama
        // sambungannya terlihat meloncat.
        return (track.scrollWidth + celah) / 2;
      }

      periode = ukurPeriode();
      durasi = (periode / LAJU) * 1000;

      // Dijalankan lewat Web Animations API, bukan penambahan posisi tiap
      // frame. Animasi transform diserahkan ke compositor sehingga tetap
      // halus, sementara currentTime-nya bisa digeser bebas — itulah yang
      // membuat deret ini sekaligus bisa ditarik jari.
      var jalan = track.animate(
        [{ transform: 'translateX(0px)' }, { transform: 'translateX(' + (-periode) + 'px)' }],
        { duration: durasi, iterations: Infinity, easing: 'linear' }
      );

      // Ukuran bisa berubah setelah gambar tuntas diunduh atau layar diputar.
      // Panjang putaran ikut disesuaikan tanpa menyentak: kemajuan putarannya
      // dipertahankan sebagai pecahan, bukan sebagai milidetik.
      function sesuaikan() {
        var baru = ukurPeriode();
        if (!baru || Math.abs(baru - periode) < 1) return;
        var pecahan = durasi ? ((jalan.currentTime || 0) % durasi) / durasi : 0;
        periode = baru;
        durasi = (periode / LAJU) * 1000;
        jalan.effect.setKeyframes([
          { transform: 'translateX(0px)' },
          { transform: 'translateX(' + (-periode) + 'px)' }
        ]);
        jalan.effect.updateTiming({ duration: durasi });
        jalan.currentTime = pecahan * durasi;
      }

      window.addEventListener('load', sesuaikan);
      window.addEventListener('resize', sesuaikan);
      // Tiap foto yang selesai dimuat bisa mengubah lebar deretnya.
      $$('img', track).forEach(function (im) {
        if (!im.complete) im.addEventListener('load', sesuaikan);
      });

      var kurangiGerak = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (kurangiGerak) jalan.pause();

      function posisiSekarang() {
        return ((jalan.currentTime || 0) / durasi) * periode;
      }
      function pindahKe(posisi) {
        // Dibungkus ke dalam satu periode: di titik mana pun kelipatannya,
        // isi yang terlihat sama persis, jadi pembungkusan tak kasatmata.
        var p = ((posisi % periode) + periode) % periode;
        jalan.currentTime = (p / periode) * durasi;
      }

      /* ---- Tarik dengan jari atau kursor ---- */
      var menarik = false, xAwal = 0, posisiAwal = 0, jarakTarik = 0;
      var JARAK_ANGGAP_TARIKAN = 6;   // di bawah ini masih dihitung ketukan

      wadah.addEventListener('pointerdown', function (e) {
        if (e.button && e.button !== 0) return;
        menarik = true;
        jarakTarik = 0;
        xAwal = e.clientX;
        posisiAwal = posisiSekarang();
        jalan.pause();
        wadah.classList.add('is-ditarik');
      });

      // Pendengarnya dipasang di window, dan setPointerCapture sengaja TIDAK
      // dipakai. Menangkap pointer akan memindahkan sasaran peristiwa klik ke
      // wadahnya, sehingga ketukan tidak pernah sampai ke tombol fotonya dan
      // lightbox tidak akan pernah terbuka. Lewat window, tarikan tetap
      // terlacak walau jari keluar dari area galeri, tanpa efek samping itu.
      window.addEventListener('pointermove', function (e) {
        if (!menarik) return;
        var geser = e.clientX - xAwal;
        jarakTarik = Math.max(jarakTarik, Math.abs(geser));
        pindahKe(posisiAwal - geser);
      });

      function lepas() {
        if (!menarik) return;
        menarik = false;
        wadah.classList.remove('is-ditarik');
        if (!kurangiGerak) jalan.play();
      }
      window.addEventListener('pointerup', lepas);
      window.addEventListener('pointercancel', lepas);

      // Tarikan tidak boleh berakhir dengan membuka lightbox. Ditahan di fase
      // menangkap supaya pendengar klik pada tombolnya tidak pernah terpanggil.
      wadah.addEventListener('click', function (e) {
        if (jarakTarik > JARAK_ANGGAP_TARIKAN) {
          e.preventDefault();
          e.stopPropagation();
          jarakTarik = 0;
        }
      }, true);

      // Berhenti saat kursor menunjuk, supaya foto bisa diamati dan diklik
      wadah.addEventListener('mouseenter', function () { jalan.pause(); });
      wadah.addEventListener('mouseleave', function () { if (!menarik && !kurangiGerak) jalan.play(); });

      // Salinan ikut membuka lightbox, memakai nomor foto aslinya.
      track.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.gallery__item') : null;
        if (!btn || items.indexOf(btn) !== -1) return;   // yang asli sudah ditangani
        var i = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(i)) open(i);
      });
    })();
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

    var wishes = [];
    var backend = null;     // diisi bila Firestore berhasil tersambung
    var loading = false;    // true selama menunggu balasan pertama Firestore

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
      if (!wishes.length) {
        list.innerHTML = '<li class="wishes__empty">' +
          (loading ? 'Memuat ucapan…' : 'Belum ada ucapan. Jadilah yang pertama 🤲') +
          '</li>';
        if (counter) counter.textContent = '';
        return;
      }

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

    /* ---- Cadangan: localStorage (dipakai bila Firebase belum diisi) ---- */
    var localBackend = {
      name: 'lokal',
      start: function () {
        loading = false;
        var saved = store.get(CONFIG.storageKey, null);
        wishes = Array.isArray(saved) ? saved : CONFIG.seedWishes.slice();
        render();
      },
      add: function (wish) {
        wishes.unshift(wish);
        var ok = store.set(CONFIG.storageKey, wishes);
        render();
        return Promise.resolve(ok
          ? ''
          : 'Browser memblokir penyimpanan, jadi ucapan hilang saat halaman dimuat ulang.');
      }
    };

    /* ---- Firestore: ucapan tampil langsung di semua perangkat ---- */

    // Dibungkus new Function agar browser lama yang belum mengenal import()
    // tidak menggagalkan seluruh berkas ini saat mem-parsing.
    var dynImport = null;
    try { dynImport = new Function('u', 'return import(u);'); } catch (e) { dynImport = null; }

    function firebaseReady() {
      var cfg = window.FIREBASE_CONFIG;
      return !!(dynImport && cfg && cfg.apiKey && cfg.projectId);
    }

    function startFirestore() {
      var cfg = window.FIREBASE_CONFIG;
      var base = 'https://www.gstatic.com/firebasejs/' + CONFIG.firebaseVersion + '/';

      return Promise.all([
        dynImport(base + 'firebase-app.js'),
        dynImport(base + 'firebase-firestore.js')
      ]).then(function (mods) {
        var fbApp = mods[0], fs = mods[1];
        var db = fs.getFirestore(fbApp.initializeApp(cfg));
        var col = fs.collection(db, window.FIREBASE_COLLECTION || 'wishes');

        // Firestore yang sehat selalu membalas — walau koleksinya masih kosong.
        // Jadi "tidak ada balasan sama sekali" berarti sambungan bermasalah,
        // bukan buku tamu yang masih kosong. Dua hal itu harus dibedakan,
        // supaya tamu tidak terpaku pada daftar kosong yang tak kunjung terisi.
        var answered = false;

        // Dengarkan perubahan: ucapan tamu lain muncul tanpa perlu muat ulang.
        fs.onSnapshot(
          fs.query(col, fs.orderBy('ts', 'desc'), fs.limit(CONFIG.wishLimit)),
          function (snap) {
            answered = true;
            loading = false;
            var arr = [];
            snap.forEach(function (doc) {
              var d = doc.data();
              arr.push({
                name: d.name,
                message: d.message,
                attend: d.attend,
                count: d.count,
                // serverTimestamp belum terisi pada pantulan pertama → pakai jam lokal
                ts: d.ts && d.ts.toMillis ? d.ts.toMillis() : Date.now()
              });
            });
            wishes = arr;
            render();
          },
          function (err) {
            answered = true;
            console.warn('[undangan] gagal membaca ucapan:', err && err.code);
            if (!wishes.length) localBackend.start();
          }
        );

        // Firestore diam saja (project tidak ada, offline, diblokir jaringan):
        // tampilkan cadangan lokal agar bagian ucapan tidak terlihat rusak.
        setTimeout(function () {
          if (!answered) {
            console.warn('[undangan] Firestore tidak merespons, memakai penyimpanan lokal.');
            localBackend.start();
          }
        }, CONFIG.firestoreTimeout * 1000);

        backend = {
          name: 'firestore',
          add: function (wish) {
            return fs.addDoc(col, {
              name: wish.name,
              message: wish.message,
              attend: wish.attend,
              count: wish.count || '',
              ts: fs.serverTimestamp()
            }).then(function () { return ''; });
          }
        };
      });
    }

    /* ---- Batas kirim per perangkat, penahan spam sederhana ---- */
    function cooldownLeft() {
      var last = store.get('wedding_last_sent', 0);
      var left = CONFIG.cooldown - Math.floor((Date.now() - last) / 1000);
      return left > 0 ? left : 0;
    }

    function say(msg, isError) {
      if (!note) return;
      note.textContent = msg;
      note.classList.toggle('is-error', !!isError);
    }

    /* ---- Pengiriman ---- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements.name.value.trim();
      var message = form.elements.message.value.trim();
      var attend = (form.querySelector('input[name="attend"]:checked') || {}).value || 'Hadir';
      var count = form.elements.count.value;

      if (name.length < 2) {
        say('Mohon isi nama lengkap Anda.', true);
        form.elements.name.focus();
        return;
      }

      var wait = cooldownLeft();
      if (wait) {
        say('Mohon tunggu ' + wait + ' detik sebelum mengirim lagi.', true);
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      say('Mengirim…');

      var wish = {
        name: name.slice(0, 60),
        message: (message || 'Selamat menempuh hidup baru!').slice(0, 400),
        attend: attend,
        count: count,
        ts: Date.now()
      };

      (backend || localBackend).add(wish)
        .then(function (warning) {
          store.set('wedding_last_sent', Date.now());
          form.reset();
          say('Terima kasih, ' + name + '. Konfirmasi Anda sudah kami terima.'
              + (warning ? ' (' + warning + ')' : ''));
          toast('Konfirmasi terkirim. Terima kasih!');
          list.scrollTop = 0;
        })
        .catch(function (err) {
          console.warn('[undangan] gagal mengirim ucapan:', err && err.code);
          say('Maaf, ucapan gagal terkirim. Periksa koneksi lalu coba lagi.', true);
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });

    /* ---- Mulai ---- */
    if (firebaseReady()) {
      loading = true;
      render();
      startFirestore().catch(function (err) {
        console.warn('[undangan] Firebase gagal dimuat, memakai penyimpanan lokal:', err);
        localBackend.start();
      });
    } else {
      localBackend.start();
    }
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
