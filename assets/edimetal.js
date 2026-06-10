/* ============================================================
   EDIMETAL — interacción y animación
   ============================================================ */
(function () {
  "use strict";

  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(pointer: fine)").matches;
  var vh = function () { return window.innerHeight; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- Header state ---------- */
  var header = document.getElementById("siteHeader");
  function headerState() {
    header.classList.toggle("is-solid", window.scrollY > 40);
  }

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMenu() {
    navToggle.classList.remove("open");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  navToggle.addEventListener("click", function () {
    var open = !mobileMenu.classList.contains("open");
    navToggle.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      var links = mobileMenu.querySelectorAll(".mobile-nav a");
      links.forEach(function (a, i) { a.style.transitionDelay = (120 + i * 60) + "ms"; });
    }
  });

  /* ---------- Smooth anchors (sin scrollIntoView) ---------- */
  document.querySelectorAll("[data-anchor]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("data-anchor"));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: top, behavior: RM ? "auto" : "smooth" });
    });
  });

  /* ---------- Reveal observer ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        ro.unobserve(en.target);
      }
    });
  }, { threshold: 0.18 });
  reveals.forEach(function (el, i) {
    el.style.setProperty("--rd", (i % 4) * 70 + "ms");
    ro.observe(el);
  });

  /* ---------- Split titles (línea por línea) ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="split-line"><span>' + p.trim() + "</span></span>";
    }).join("");
  });
  var so = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var lines = en.target.querySelectorAll(".split-line");
        lines.forEach(function (l, i) {
          l.querySelector("span").style.transitionDelay = i * 110 + "ms";
          l.classList.add("in");
        });
        so.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-split]").forEach(function (el) { so.observe(el); });

  /* ---------- Hero: entrada + transición técnica al hacer scroll ---------- */
  var hero = document.querySelector(".hero");
  var heroMedia = document.getElementById("heroMedia");
  var heroContent = document.getElementById("heroContent");
  var heroFrame = document.querySelector(".hero-frame");

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { hero.classList.add("fonts-in"); });
    setTimeout(function () { hero.classList.add("fonts-in"); }, 900);
  } else {
    hero.classList.add("fonts-in");
  }

  function heroScroll() {
    if (RM) return;
    var y = window.scrollY;
    var h = vh();
    if (y > h * 1.2) return;
    // Parallax sutil: la imagen queda en su lugar, solo se desplaza
    // levemente m\u00e1s lento que el scroll. Sin zoom ni re-encuadre.
    heroMedia.style.transform = "translateY(" + (y * 0.22).toFixed(1) + "px)";
    var p = clamp(y / (h * 0.9), 0, 1);
    heroContent.style.transform = "translateY(" + (-p * 40).toFixed(1) + "px)";
    heroContent.style.opacity = String(1 - clamp((p - 0.45) / 0.5, 0, 0.85));
  }

  /* ---------- Manifiesto: texto scrub ---------- */
  var scrub = document.getElementById("scrubText");
  var scrubWords = [];
  if (scrub) {
    var keys = ["precisas,", "seguras", "durables", "milímetro."];
    var ki = 0;
    var words = scrub.textContent.trim().split(/\s+/);
    scrub.innerHTML = words.map(function (w) {
      var isKey = keys.indexOf(w) > -1;
      var cls = isKey ? " key k" + (ki++) : "";
      return '<span class="w' + cls + '">' + w + "</span>";
    }).join(" ");
    scrubWords = Array.prototype.slice.call(scrub.querySelectorAll(".w"));
  }
  function scrubScroll() {
    if (!scrub) return;
    var r = scrub.getBoundingClientRect();
    var p = clamp((vh() * 0.85 - r.top) / (vh() * 0.75), 0, 1);
    var lit = Math.round(p * scrubWords.length);
    scrubWords.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
  }

  /* ---------- Parallax sutil ---------- */
  var prlxEls = Array.prototype.slice.call(document.querySelectorAll("[data-prlx]"));
  function prlxScroll() {
    if (RM) return;
    prlxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh()) return;
      var amt = parseFloat(el.dataset.prlx) || -40;
      var p = (r.top + r.height / 2 - vh() / 2) / vh(); // -0.5..0.5 aprox
      el.style.transform = "translateY(" + (p * amt).toFixed(1) + "px)";
    });
  }

  /* ---------- Truss que se dibuja ---------- */
  var trussPath = document.getElementById("trussPath");
  var trussNodes = document.querySelectorAll("#trussNodes circle");
  var trussLen = 0;
  if (trussPath) {
    trussLen = trussPath.getTotalLength();
    trussPath.style.strokeDasharray = String(trussLen);
    trussPath.style.strokeDashoffset = String(trussLen);
  }
  function trussScroll() {
    if (!trussPath) return;
    var r = document.getElementById("trussSvg").getBoundingClientRect();
    var p = clamp((vh() - r.top) / (r.height + vh() * 0.55), 0, 1);
    trussPath.style.strokeDashoffset = String(trussLen * (1 - p));
    trussNodes.forEach(function (n, i) {
      n.classList.toggle("on", p > 0.25 + (i / trussNodes.length) * 0.7);
    });
  }

  /* ---------- Scrollytelling: scrub de video ---------- */
  var scrolly = document.getElementById("proceso");
  var sVideo = document.getElementById("scrollyVideo");
  var chapters = document.querySelectorAll(".chapter");
  var spFill = document.getElementById("spFill");
  var spSteps = document.querySelectorAll(".sp-step");
  var sDuration = 0, sTarget = 0, seekBusy = false;

  if (sVideo) {
    sVideo.addEventListener("loadedmetadata", function () { sDuration = sVideo.duration || 0; });
    try { sVideo.load(); } catch (err) {}
    // Carga el video como Blob para garantizar seeking (algunos servidores
    // no soportan Range requests y currentTime se ignora silenciosamente).
    var blobLoaded = false;
    var loadBlob = function () {
      if (blobLoaded || RM) return;
      blobLoaded = true;
      fetch("uploads/Factory_assembly_with_welding_202606101603.mp4")
        .then(function (r) { return r.ok ? r.blob() : Promise.reject(); })
        .then(function (b) {
          var t = sVideo.currentTime || 0;
          sVideo.src = URL.createObjectURL(b);
          sVideo.load();
          sVideo.addEventListener("loadedmetadata", function () {
            sDuration = sVideo.duration || 0;
            try { sVideo.currentTime = t; } catch (err) {}
          }, { once: true });
        })
        .catch(function () { blobLoaded = false; });
    };
    // Precarga cuando la sección se acerca al viewport
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { loadBlob(); vio.disconnect(); }
      });
    }, { rootMargin: "150% 0px" });
    vio.observe(scrolly);
  }

  function scrollyProgress() {
    var rect = scrolly.getBoundingClientRect();
    var total = scrolly.offsetHeight - vh();
    return clamp(-rect.top / total, 0, 1);
  }

  function scrollyScroll() {
    if (!scrolly) return;
    var p = scrollyProgress();
    if (sDuration && !RM) sTarget = p * Math.max(0, sDuration - 0.08);
    var idx = Math.min(3, Math.floor(p * 4));
    chapters.forEach(function (c, i) { c.classList.toggle("is-active", i === idx); });
    if (spFill) spFill.style.height = (p * 100) + "%";
    spSteps.forEach(function (s, i) { s.classList.toggle("done", p * 4 >= i + 0.5); });
  }

  /* Scrub fluido: hacia adelante el video se REPRODUCE a velocidad variable
     (sin seeks por frame); solo hace seek en retrocesos o saltos grandes. */
  if (sVideo) {
    sVideo.addEventListener("seeked", function () { seekBusy = false; });
  }
  function videoLerp() {
    if (sDuration && !RM && sVideo.readyState >= 2) {
      var cur = sVideo.currentTime;
      var diff = sTarget - cur;
      var ad = Math.abs(diff);
      if (ad < 0.05) {
        // En posición: detén la reproducción
        if (!sVideo.paused) sVideo.pause();
      } else if (diff > 0 && diff < 2.8) {
        // Avance: reproduce hacia el objetivo — movimiento continuo
        sVideo.playbackRate = clamp(1.0 + diff * 4.2, 0.6, 12);
        if (sVideo.paused) {
          var pr = sVideo.play();
          if (pr && pr.catch) pr.catch(function () {});
        }
      } else {
        // Retroceso o salto grande: seek directo (en cola, uno a la vez)
        if (!sVideo.paused) sVideo.pause();
        if (!seekBusy) {
          seekBusy = true;
          try { sVideo.currentTime = sTarget; } catch (err) { seekBusy = false; }
        }
      }
    }
    requestAnimationFrame(videoLerp);
  }

  if (RM && sVideo) {
    sVideo.setAttribute("controls", "controls");
    sVideo.preload = "metadata";
  }

  /* ---------- Servicios ---------- */
  var servItems = document.querySelectorAll(".serv-item");
  var servImgs = document.querySelectorAll(".sv-img");
  function setServ(i) {
    servItems.forEach(function (it) { it.classList.toggle("is-active", it.dataset.serv == i); });
    servImgs.forEach(function (im) { im.classList.toggle("is-active", im.dataset.serv == i); });
  }
  servItems.forEach(function (it) {
    var i = +it.dataset.serv;
    it.addEventListener("mouseenter", function () { if (FINE) setServ(i); });
    it.addEventListener("click", function () { setServ(i); });
    it.addEventListener("focus", function () { setServ(i); });
  });
  // En táctil: activa el servicio según scroll
  if (!FINE) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setServ(+en.target.dataset.serv);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    servItems.forEach(function (it) { sio.observe(it); });
  }

  /* ---------- Showcase horizontal ---------- */
  var showcase = document.getElementById("capacidades");
  var track = document.getElementById("showcaseTrack");
  var scMobile = window.matchMedia("(max-width: 720px)");

  function sizeShowcase() {
    if (RM || scMobile.matches) { showcase.style.height = ""; return; }
    var extra = track.scrollWidth - window.innerWidth;
    showcase.style.height = (vh() + Math.max(0, extra)) + "px";
  }
  function showcaseScroll() {
    if (RM || scMobile.matches) { track.style.transform = ""; return; }
    var rect = showcase.getBoundingClientRect();
    var total = showcase.offsetHeight - vh();
    if (total <= 0) return;
    var p = clamp(-rect.top / total, 0, 1);
    var extra = track.scrollWidth - window.innerWidth;
    track.style.transform = "translateX(" + (-p * extra) + "px)";
  }

  /* ---------- Marquee CTA ---------- */
  var ctam = document.getElementById("ctamTrack");
  var mx = 0, lastY = window.scrollY, boost = 0;
  function marqueeTick() {
    if (ctam && !RM) {
      var dy = window.scrollY - lastY;
      lastY = window.scrollY;
      boost += (clamp(Math.abs(dy) * 0.06, 0, 3) - boost) * 0.08;
      mx -= 0.6 + boost;
      var half = ctam.scrollWidth / 2;
      if (-mx >= half) mx += half;
      ctam.style.transform = "translateX(" + mx + "px)";
    }
    requestAnimationFrame(marqueeTick);
  }

  /* ---------- Botones magnéticos ---------- */
  if (FINE && !RM) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      var raf = null;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.32;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          btn.style.transform = "translate(" + x + "px," + y + "px)";
        });
      });
      btn.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        btn.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        btn.style.transform = "translate(0,0)";
        setTimeout(function () { btn.style.transition = ""; }, 500);
      });
    });
  }

  /* ---------- Clientes (logos del sitio actual) ---------- */
  var clientGrid = document.getElementById("clientGrid");
  if (clientGrid) {
    for (var ci = 1; ci <= 11; ci++) {
      var n = (ci < 10 ? "0" : "") + ci;
      var cell = document.createElement("div");
      cell.className = "client-cell";
      var img = document.createElement("img");
      img.src = "https://edimetal.cl/img/clients/" + n + "-dark.png";
      img.alt = "Cliente EDIMETAL";
      img.loading = "lazy";
      img.onerror = function () { this.parentElement.remove(); };
      cell.appendChild(img);
      clientGrid.appendChild(cell);
    }
  }

  /* ---------- Formulario → mailto ---------- */
  var form = document.getElementById("conForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = "Nombre: " + d.get("nombre") + "\nEmail: " + d.get("email") +
        (d.get("telefono") ? "\nTeléfono: " + d.get("telefono") : "") +
        "\n\n" + d.get("mensaje");
      var url = "mailto:contacto@edimetal.cl?subject=" +
        encodeURIComponent("Consulta de proyecto — " + d.get("nombre")) +
        "&body=" + encodeURIComponent(body);
      window.location.href = url;
      document.getElementById("ffNote").textContent = "SE ABRIRÁ TU CLIENTE DE CORREO PARA ENVIAR EL MENSAJE.";
    });
  }

  /* ---------- Año footer ---------- */
  var fy = document.getElementById("footYear");
  if (fy) fy.textContent = String(new Date().getFullYear());

  /* ---------- Scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      headerState();
      heroScroll();
      scrubScroll();
      prlxScroll();
      trussScroll();
      scrollyScroll();
      showcaseScroll();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    sizeShowcase();
    onScroll();
  });

  sizeShowcase();
  onScroll();
  if (!RM) {
    requestAnimationFrame(videoLerp);
    requestAnimationFrame(marqueeTick);
  }
})();
