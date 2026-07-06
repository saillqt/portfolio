/* ============================================================
   EcoBrew — landing interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Preloader (min display so the pour reads) ---------- */
  const preloader = document.querySelector("[data-preloader]");
  if (preloader) {
    document.body.classList.add("is-loading");
    const start = performance.now();
    const MIN = 3600; // let the fill animation finish
    const dismiss = () => {
      const wait = Math.max(0, MIN - (performance.now() - start));
      setTimeout(() => {
        preloader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        setTimeout(() => preloader.remove(), 800);
      }, wait);
    };
    if (document.readyState === "complete") dismiss();
    else window.addEventListener("load", dismiss);
  }

  const header   = document.querySelector("[data-header]");
  const progress = document.querySelector(".progress span");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header state + scroll progress ---------- */
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("is-scrolled", y > 40);

    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (y / h) : 0;
    if (progress) progress.style.width = (p * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Parallax (hero bg + product image) ---------- */
  const layers = Array.from(document.querySelectorAll("[data-parallax]"));
  const soft   = Array.from(document.querySelectorAll("[data-parallax-soft]"));
  if (!reduce && (layers.length || soft.length)) {
    let ticking = false;
    function parallax() {
      layers.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        const off = (r.top) * -0.12;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      });
      soft.forEach((el) => {
        const r = el.getBoundingClientRect();
        const mid = (r.top + r.height / 2 - window.innerHeight / 2);
        el.style.transform = `translate3d(0, ${(mid * -0.03).toFixed(1)}px, 0)`;
      });
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
    parallax();
  }

  /* ---------- Reveal on scroll + section theme sync ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));
  // sections that use .is-visible on a container (hero, cta inner handled via children)
  document.querySelectorAll(".hero, .section, .site-footer").forEach((el) => revealIO.observe(el));

  /* ---------- theme-color meta sync + side slide navigation theme update ---------- */
  const sideNav = document.querySelector("[data-side-nav]");
  const sideNavItems = sideNav ? Array.from(sideNav.querySelectorAll(".side-nav__item")) : [];

  const themeIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target.getAttribute("data-theme");
      const map = { ink: "#17140F", cream: "#F6F0E3", amber: "#E7A83B" };
      if (themeMeta && map[t]) themeMeta.setAttribute("content", map[t]);

      // update side slide nav theme
      if (sideNav) {
        if (t === "ink") {
          sideNav.classList.add("is-light");
          sideNav.classList.remove("is-dark");
        } else {
          sideNav.classList.add("is-dark");
          sideNav.classList.remove("is-light");
        }
      }

      // update active side nav item
      const id = e.target.id;
      if (id && sideNavItems.length) {
        sideNavItems.forEach((item) => {
          const href = item.getAttribute("href");
          item.classList.toggle("is-active", href === `#${id}`);
        });
      }
    });
  }, { threshold: 0.2 });
  
  // Track all slide sections
  document.querySelectorAll(".hero, .section").forEach((el) => themeIO.observe(el));

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll(".stat__num[data-count]");
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || "";
      if (reduce || end === 0) { el.textContent = end + suffix; countIO.unobserve(el); return; }
      const dur = 2200; const t0 = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * end) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));


  /* ---------- Card slider (single card presentation deck view) ---------- */
  const slider = document.querySelector("[data-slider]");
  if (slider) {
    const track = slider.querySelector(".cardslider__track");
    const cards = Array.from(track.children);
    const dotsWrap = slider.querySelector("[data-slider-dots]");
    const prevBtn = slider.querySelector("[data-slider-prev]");
    const nextBtn = slider.querySelector("[data-slider-next]");
    const showcaseImgs = Array.from(document.querySelectorAll(".showcase__img"));
    let current = 0;

    // build dots
    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "cardslider__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Card " + (i + 1));
      dot.addEventListener("click", () => scrollTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function syncShowcase(idx) {
      if (!showcaseImgs.length) return;
      showcaseImgs.forEach((img, j) => {
        img.classList.toggle("is-active", j === idx);
      });
    }

    function scrollTo(i) {
      if (i < 0) i = cards.length - 1;
      if (i >= cards.length) i = 0;
      const targetOffset = cards[i].offsetLeft;
      track.scrollTo({ left: targetOffset, behavior: "smooth" });
      current = i;
      dots.forEach((d, j) => d.classList.toggle("is-active", j === i));
      syncShowcase(i);
    }

    // sync dots + showcase on manual swipe / scroll
    const snapIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = cards.indexOf(e.target);
          if (idx !== -1) {
            current = idx;
            dots.forEach((d, j) => d.classList.toggle("is-active", j === idx));
            syncShowcase(idx);
          }
        }
      });
    }, { root: track, threshold: 0.5 });
    cards.forEach((c) => snapIO.observe(c));

    if (prevBtn) prevBtn.addEventListener("click", () => scrollTo(current - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollTo(current + 1));
  }

  /* ---------- Mobile drawer ---------- */
  const toggle = document.querySelector("[data-menu-toggle]");
  const drawer = document.querySelector("[data-drawer]");
  if (toggle && drawer) {
    const setOpen = (open) => {
      drawer.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }
  /* ---------- Interactive Flavor Slider (Launch Showcase Drop) ---------- */
  const flavorChips = document.querySelectorAll("[data-flavor-buttons] .launch__chip");
  const flavorText = document.querySelector("[data-flavor-text]");
  const launchSection = document.getElementById("product");
  const launchSlides = document.querySelectorAll(".launch__slide");
  const launchGlow = document.querySelector("[data-flavor-glow]");

  const flavorData = {
    classic: {
      text: "We can't stop thinking about it. Give it one sip — neither will you. Smooth, refreshing, consciously made, and honestly a little obsessed with you back.",
      bg: "#17140F",
      glow: "radial-gradient(circle, rgba(231, 168, 59, 0.45), transparent 64%)"
    },
    chocolate: {
      text: "Infused with organic single-origin cacao nibs during the 12-hour cold steep. Delivers a velvet chocolate finish without any added sugars.",
      bg: "#251812",
      glow: "radial-gradient(circle, rgba(141, 91, 68, 0.65), transparent 64%)"
    },
    caramel: {
      text: "Brewed to highlight natural caramelization. Subtle, buttery caramel undertones with a clean, sweet palate profile from start to finish.",
      bg: "#4e2b0d",
      glow: "radial-gradient(circle, rgba(231, 168, 59, 0.6), transparent 64%)"
    },
    steep: {
      text: "Cold steeped for a patient 12 hours. This slow extraction eliminates bitterness and reduces acidity, ensuring an incredibly smooth cold brew.",
      bg: "#0B0A09",
      glow: "radial-gradient(circle, rgba(246, 240, 227, 0.25), transparent 64%)"
    }
  };

  if (flavorChips.length && flavorText && launchSection) {
    flavorChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const flavor = chip.getAttribute("data-flavor");
        const data = flavorData[flavor];
        if (!data) return;

        // 1. Update active chip
        flavorChips.forEach((btn) => btn.classList.toggle("is-active", btn === chip));

        // 2. Transition background colors
        launchSection.style.backgroundColor = data.bg;
        if (launchGlow) launchGlow.style.backgroundImage = data.glow;

        // 3. Transition slides
        launchSlides.forEach((slide) => {
          const isTarget = slide.getAttribute("data-slide-flavor") === flavor;
          slide.classList.toggle("is-active", isTarget);
        });

        // 4. Fade transition the text copy
        flavorText.style.opacity = "0";
        setTimeout(() => {
          flavorText.textContent = data.text;
          flavorText.style.opacity = "1";
        }, 400);
      });
    });
  }

  /* ---------- Scroll-Driven Coffee Bean Path with LERP Smoothing ---------- */
  const pathBean = document.getElementById("scrollPathBean");
  if (pathBean) {
    // Current animated coordinates
    let currX = 18, currY = 70, currScaleX = 1.0, currScaleY = 1.0, currRotate = -24;
    // Target coordinates (calculated on scroll)
    let targetX = 18, targetY = 70, targetScaleX = 1.0, targetScaleY = 1.0, targetRotate = -24;

    function getPath() {
      const isMobile = window.innerWidth < 900;
      return isMobile ? [
        { scroll: 0.0,  x: 20, y: 72, scaleX: 1.0,  scaleY: 1.0,  rotate: -24 },   // Hero start
        { scroll: 0.20, x: 75, y: 38, scaleX: 2.2,  scaleY: 2.2,  rotate: 160 },   // Over Idea image (Blow up!)
        { scroll: 0.40, x: 15, y: 60, scaleX: 0.75, scaleY: 0.75, rotate: 340 },   // Statement (shrink over text)
        // --- NEW DROP SECTION: Drops Straight Down vertically ---
        { scroll: 0.48, x: 50, y: -20, scaleX: 1.0,  scaleY: 1.0,  rotate: 380 },  // Top boundary of drop
        { scroll: 0.58, x: 50, y: 50,  scaleX: 2.4,  scaleY: 2.4,  rotate: 480 },  // Drop mid (Blow up over bottle!)
        { scroll: 0.68, x: 50, y: 120, scaleX: 1.0,  scaleY: 1.0,  rotate: 580 },  // Bottom boundary of drop
        // --- NEXT SECTION: Lands on Why EcoBrew ---
        { scroll: 0.70, x: 28, y: 15,  scaleX: 0.75, scaleY: 1.5,  rotate: 640 },  // Falling over Why (stretched)
        { scroll: 0.74, x: 28, y: 52,  scaleX: 1.5,  scaleY: 0.8,  rotate: 720 },  // Impact (squashed)
        { scroll: 0.76, x: 28, y: 50,  scaleX: 1.3,  scaleY: 1.3,  rotate: 720 }   // Settle in Why section
      ] : [
        { scroll: 0.0,  x: 18, y: 70, scaleX: 1.0,  scaleY: 1.0,  rotate: -24 },   // Hero start
        { scroll: 0.20, x: 76, y: 35, scaleX: 2.4,  scaleY: 2.4,  rotate: 160 },   // Over Idea image (Blow up!)
        { scroll: 0.40, x: 12, y: 60, scaleX: 0.8,  scaleY: 0.8,  rotate: 340 },   // Statement (shrink over text)
        // --- NEW DROP SECTION: Drops Straight Down vertically ---
        { scroll: 0.48, x: 68, y: -20, scaleX: 1.0,  scaleY: 1.0,  rotate: 380 },  // Top boundary of drop
        { scroll: 0.58, x: 68, y: 50,  scaleX: 2.6,  scaleY: 2.6,  rotate: 480 },  // Drop mid (Blow up over bottle!)
        { scroll: 0.68, x: 68, y: 120, scaleX: 1.0,  scaleY: 1.0,  rotate: 580 },  // Bottom boundary of drop
        // --- NEXT SECTION: Lands on Why EcoBrew ---
        { scroll: 0.70, x: 28, y: 15,  scaleX: 0.7,  scaleY: 1.5,  rotate: 640 },  // Falling over Why (stretched)
        { scroll: 0.74, x: 28, y: 52,  scaleX: 1.6,  scaleY: 0.8,  rotate: 720 },  // Impact (squashed)
        { scroll: 0.76, x: 28, y: 50,  scaleX: 1.4,  scaleY: 1.4,  rotate: 720 }   // Settle in Why section
      ];
    }

    function calculateTargets() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.max(0, Math.min(1, window.scrollY / docHeight));
      const currentPath = getPath();
      const settlePoint = currentPath[currentPath.length - 1];

      // If scrolled past Why settle point (0.76), lock it relative to Why section (scrolls up naturally)
      if (scrollPercent >= 0.76) {
        const deltaY = window.scrollY - (0.76 * docHeight);
        targetX = settlePoint.x;
        const landingYPx = (settlePoint.y * window.innerHeight) / 100;
        targetY = landingYPx - deltaY;
        targetScaleX = settlePoint.scaleX;
        targetScaleY = settlePoint.scaleY;
        targetRotate = settlePoint.rotate;
      } else {
        // Find bounding keyframes
        let p1 = currentPath[0];
        let p2 = currentPath[currentPath.length - 1];

        for (let i = 0; i < currentPath.length - 1; i++) {
          if (scrollPercent >= currentPath[i].scroll && scrollPercent <= currentPath[i + 1].scroll) {
            p1 = currentPath[i];
            p2 = currentPath[i + 1];
            break;
          }
        }

        // Interpolate
        const range = p2.scroll - p1.scroll;
        const factor = range > 0 ? (scrollPercent - p1.scroll) / range : 0;

        targetX = p1.x + (p2.x - p1.x) * factor;
        const targetYPercent = p1.y + (p2.y - p1.y) * factor;
        targetY = (targetYPercent * window.innerHeight) / 100;
        targetScaleX = p1.scaleX + (p2.scaleX - p1.scaleX) * factor;
        targetScaleY = p1.scaleY + (p2.scaleY - p1.scaleY) * factor;
        targetRotate = p1.rotate + (p2.rotate - p1.rotate) * factor;
      }
    }

    function lerpLoop() {
      // 0.085 interpolation factor for smooth lag-behind easing
      currX += (targetX - currX) * 0.085;
      currY += (targetY - currY) * 0.085;
      currScaleX += (targetScaleX - currScaleX) * 0.085;
      currScaleY += (targetScaleY - currScaleY) * 0.085;
      currRotate += (targetRotate - currRotate) * 0.085;

      // Apply styling
      pathBean.style.left = currX + "vw";
      pathBean.style.top = currY + "px"; // Apply pixel positions for subpixel smooth rendering
      pathBean.style.transform = "translate(-50%, -50%) scale(" + currScaleX.toFixed(3) + ", " + currScaleY.toFixed(3) + ") rotate(" + currRotate.toFixed(1) + "deg)";

      requestAnimationFrame(lerpLoop);
    }

    // Initialize positions
    calculateTargets();
    currX = targetX;
    currY = targetY;
    currScaleX = targetScaleX;
    currScaleY = targetScaleY;
    currRotate = targetRotate;

    // Start loop
    lerpLoop();

    window.addEventListener("scroll", calculateTargets);
    window.addEventListener("resize", calculateTargets);
  }
})();
