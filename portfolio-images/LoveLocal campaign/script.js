/* =================================================================
   LoveLocal · "The Aisle" — scroll-driven forward-motion engine
   -----------------------------------------------------------------
   How it works:
   • A tall .track defines the scroll length (one screen per station).
   • ScrollTrigger reads progress 0→1 and we map it to the camera's
     forward translateZ (the CSS var --cam on .world). The camera
     glides INTO the aisle; stations parked at increasing depth grow
     and their side shelves slide past — real perspective, not a zoom.
   • ScrollTrigger.snap settles the camera at each station so the
     product centers and is calmly readable.
   • The hero is a 2D doorway we fade/lift on the first segment.
   • Click a product → the panel slides up with the full-size asset.
   ================================================================= */

/* ---------- 1. CONTENT — edit copy/assets here ---------- */
const STATIONS = [
  {
    id: "entrance", map: "Andar",
    kind: "hero", // handled by the 2D hero layer; no 3D billboard
  },
  {
    id: "flyer", map: "Flyer",
    kind: "product",
    label: "Flyer",
    thumb: "side 1.webp",
    peek: { left: ["flyer mock up 1.webp"], right: ["flyer mock up 2.webp"] }, // peek out at the sides when you arrive
    panel: {
      tag: "Deliverable 01 · Print + digital flyer",
      title: "Your local shops. Now on your phone.",
      why: "Loud, scannable, mohalle-friendly. Front sells the promise, back stocks the proof — categories you already trust.",
      faces: ["side 1.webp", "side 2.webp"], // flip front/back
    },
  },
  {
    id: "bag", map: "Bag",
    kind: "product",
    label: "Delivery Bag",
    thumb: "bag front.webp",
    peek: { left: ["bag mockup 1.webp", "bag mockup 3.webp"], right: ["bag mockup 2.webp", "bag mockup 4.webp"] },
    panel: {
      tag: "Deliverable 02 · Delivery bag",
      title: "The brand, carried home.",
      why: "Every doorstep is a billboard. Front greets, back reassures — bharosa that travels the last mile.",
      faces: ["bag front.webp", "bag back.webp"],
    },
  },
  {
    id: "insta", map: "Post",
    kind: "product",
    label: "Instagram Post",
    thumb: "Instagram post.webp",
    panel: {
      tag: "Deliverable 03 · Instagram post",
      title: "Thumb-stopping, in-feed.",
      why: "Built for the scroll: bold hook, one clear message, brand colours that pop in a crowded feed.",
      phone: "Instagram post.webp", // shown inside phone.png frame
      isInstagram: true, // enable interactive features
    },
  },
  {
    id: "story", map: "Story",
    kind: "product",
    label: "Litchi Story",
    thumb: "litchi-poster.svg",
    panel: {
      tag: "Deliverable 04 · Instagram story (video)",
      title: "Litchi season, sorted.",
      why: "A short, juicy seasonal story — taps into what's fresh right now and nudges the in-app order.",
      phoneVideo: "litchi-story.mp4.mp4",
    },
  },
  {
    id: "checkout", map: "Checkout",
    kind: "checkout",
    card: `
      <span class="stamp">✓ Dhanyavaad!</span>
      <p class="kicker">Station 6 · Checkout</p>
      <h2>Stocked &amp; delivered<br/>by Sahil 🛍️</h2>
      <p>Thanks for walking the aisle. Saara saamaan dekh liya?
         Ab cart full, dil bhi full — chai pe milo? ☕</p>
      <p class="big">👇</p>`,
  },
];

/* ---------- 2. DOM refs ---------- */
const worldEl    = document.getElementById("world");
const stationsEl = document.getElementById("stations");
const trackEl    = document.getElementById("track");
const heroEl     = document.getElementById("hero");
const mapStopsEl = document.querySelector(".aisle-map__stops");
const hotspotEl  = document.getElementById("hotspot");
const endActionsEl = document.getElementById("endActions");

// The flat hotspot opens whichever product station is currently centered.
hotspotEl.addEventListener("click", () => {
  const i = +hotspotEl.dataset.target;
  if (!Number.isNaN(i)) openPanel(i);
});
// Hovering the hotspot lifts the product it points at.
hotspotEl.addEventListener("mouseenter", () => {
  const p = document.querySelector(".station.is-active .product");
  if (p) p.classList.add("is-hover");
});
hotspotEl.addEventListener("mouseleave", () => {
  document.querySelectorAll(".product.is-hover").forEach(p => p.classList.remove("is-hover"));
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = STATIONS.length;
const GAP = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gap"));

/* ---------- 3. BUILD the aisle map + stations ---------- */
STATIONS.forEach((s, i) => {
  // Map dot
  const li = document.createElement("li");
  li.title = s.map;
  li.dataset.index = i;
  if (i === 0) li.classList.add("is-active");
  mapStopsEl.appendChild(li);

  // Station 0 (entrance) is the hero layer — no 3D scene needed.
  if (s.kind === "hero") return;

  const station = document.createElement("section");
  station.className = "station";
  station.style.setProperty("--i", i);
  station.dataset.index = i;

  // Flanking shelves (decoration that slides past as you approach)
  station.insertAdjacentHTML("beforeend", `<div class="shelf shelf--left"></div>`);
  station.insertAdjacentHTML("beforeend", `<div class="shelf shelf--right"></div>`);

  // Center billboard
  const bb = document.createElement("div");
  bb.className = "billboard";

  if (s.kind === "info" || s.kind === "checkout") {
    bb.innerHTML = `<div class="card">${s.card}
      <span class="doodle" style="top:-18px;right:-10px">✨</span>
      <span class="doodle" style="bottom:-14px;left:-12px">❤</span></div>`;
  } else if (s.kind === "product") {
    bb.innerHTML = `
      <button class="product" type="button" data-open="${i}" aria-label="Open ${s.label}">
        <span class="pd pd--1" aria-hidden="true">✦</span>
        <span class="pd pd--2" aria-hidden="true">♥</span>
        <span class="pd pd--3" aria-hidden="true">✧</span>
        <img class="product__img" src="${s.thumb}" alt="${s.label}" loading="lazy" />
        <span class="product__label">${s.label}</span>
        <span class="product__cta">Shelf se uthao ↑</span>
      </button>`;
  }
  // Peeker mockups: tucked behind the product, slide out to the sides
  // when this station becomes active (added before the product so the
  // product sits on top of them).
  if (s.peek) {
    let peekHTML = '';
    // --pk = stack index per side, so multiple peekers fan out instead of
    // sitting on top of each other.
    (s.peek.left || []).forEach((img, k) => {
      peekHTML += `<img class="peek peek--left" style="--pk:${k}" src="${img}" alt="" loading="lazy" />`;
    });
    (s.peek.right || []).forEach((img, k) => {
      peekHTML += `<img class="peek peek--right" style="--pk:${k}" src="${img}" alt="" loading="lazy" />`;
    });
    bb.insertAdjacentHTML("afterbegin", peekHTML);
  }

  station.appendChild(bb);
  stationsEl.appendChild(station);
});

/* ---------- 4. SIZE the scroll track ---------- */
// One viewport of scroll per gap between stations, plus a little tail.
trackEl.style.height = (N * 100) + "vh";

/* ===============================================================
   5. THE CAMERA ENGINE  (skipped entirely in reduced-motion mode)
   =============================================================== */
const stationEls = Array.from(document.querySelectorAll(".station"));
const mapDots = Array.from(mapStopsEl.children);

function setActiveStation(idx) {
  mapDots.forEach((d, i) => {
    d.classList.toggle("is-active", i === idx);
    d.classList.toggle("is-done", i < idx);
  });
  // Reveal only the CURRENT station and the NEXT one coming up the aisle.
  // We deliberately drop the just-passed station: at a settled stop it sits
  // right on the lens plane and would smear hugely across the screen.
  stationEls.forEach(el => {
    const i = +el.dataset.index;
    el.classList.toggle("is-near", i === idx || i === idx + 1);
    el.classList.toggle("is-active", i === idx);   // drives the side peekers
  });

  // Point the flat hotspot at the centered station if it's a product.
  const cur = STATIONS[idx];
  if (cur && cur.kind === "product") {
    hotspotEl.dataset.target = idx;
    hotspotEl.hidden = false;
  } else {
    hotspotEl.hidden = true;
    delete hotspotEl.dataset.target;
  }

  // Show the flat checkout CTAs only at the checkout station.
  if (endActionsEl) endActionsEl.hidden = !(cur && cur.kind === "checkout");

  // Spotlight on while a product is centered; live label in the aisle map.
  document.body.classList.toggle("at-product", !!(cur && cur.kind === "product"));
  const mapCurrentEl = document.getElementById("mapCurrent");
  if (mapCurrentEl && cur) mapCurrentEl.textContent = cur.map;
}

if (!reduceMotion && window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  // Snap points: one per station, evenly spaced across 0→1.
  const snapPoints = STATIONS.map((_, i) => i / (N - 1));

  ScrollTrigger.create({
    trigger: trackEl,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6,
    snap: {
      snapTo: snapPoints,
      duration: { min: 0.25, max: 0.7 },
      ease: "power2.inOut",
      delay: 0.05,
    },
    onUpdate(self) {
      const p = self.progress;

      // Camera glides forward: 0 → (N-1)*GAP. Station i sits at -i*GAP,
      // so when cam == i*GAP that station is centered on the lens.
      const cam = p * (N - 1) * GAP();
      worldEl.style.setProperty("--cam", cam + "px");

      // Push the aisle artwork in toward the vanishing point (gentle).
      document.documentElement.style.setProperty("--bg-scale", (1 + p * 0.6).toFixed(3));

      // Hero is the doorway: fade & lift it across the FIRST segment only.
      const heroSeg = Math.min(1, p / (1 / (N - 1)));   // 0→1 over stop 0→1
      heroEl.style.opacity = String(1 - heroSeg);
      heroEl.style.transform = `translateY(${-heroSeg * 12}vh) scale(${1 - heroSeg * 0.06})`;
      heroEl.style.pointerEvents = heroSeg > 0.5 ? "none" : "auto";

      // Active station = nearest snap point
      setActiveStation(Math.round(p * (N - 1)));
    },
  });

  // Click a map dot to jump to that station.
  mapDots.forEach((dot, i) => {
    dot.style.cursor = "pointer";
    dot.addEventListener("click", () => scrollToStation(i));
  });

  function scrollToStation(i) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (i / (N - 1)) * max, behavior: "smooth" });
  }
  window.__scrollToStation = scrollToStation;

  // Which station are we at? Derived from current scroll progress.
  const currentIndex = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((window.scrollY / max) * (N - 1));
  };

  // Keyboard: arrows / space / page keys advance (or back up) the walk.
  window.addEventListener("keydown", (e) => {
    if (document.getElementById("panel").classList.contains("is-open")) return; // panel handles its own keys
    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault(); scrollToStation(Math.min(N - 1, currentIndex() + 1));
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault(); scrollToStation(Math.max(0, currentIndex() - 1));
    }
  });

  // Cinematic "look around": gently tilt the 3D world and drift the
  // backdrop toward the mouse. Transform-only, lerped in rAF — cheap.
  const stageEl = document.querySelector(".stage");
  let mx = 0, my = 0, lx = 0, ly = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });
  (function look() {
    lx += (mx - lx) * 0.05;
    ly += (my - ly) * 0.05;
    worldEl.style.transform = `rotateY(${(lx * 3).toFixed(3)}deg) rotateX(${(-ly * 2).toFixed(3)}deg)`;
    stageEl.style.setProperty("--lkx", lx.toFixed(4));
    stageEl.style.setProperty("--lky", ly.toFixed(4));
    requestAnimationFrame(look);
  })();

  setActiveStation(0);
} else {
  // Reduced motion / no GSAP: flat stacked document. Reveal everything
  // and light up the map via IntersectionObserver as sections pass.
  document.documentElement.style.removeProperty("--cam");
  stationEls.forEach(el => el.classList.add("is-near"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) setActiveStation(+en.target.dataset.index);
    });
  }, { threshold: 0.5 });
  // observe hero (index 0) + stations
  heroEl.dataset.index = 0; io.observe(heroEl);
  stationEls.forEach(el => io.observe(el));
}

/* "Aao andar" cue scrolls to station 1 */
document.getElementById("enterCue").addEventListener("click", () => {
  if (window.__scrollToStation) window.__scrollToStation(1);
  else document.querySelectorAll(".station")[0]?.scrollIntoView({ behavior: "smooth" });
});

/* ===============================================================
   6. THE PRODUCT PANEL
   =============================================================== */
const panel      = document.getElementById("panel");
const scrim      = document.getElementById("scrim");
const panelStage = document.getElementById("panelStage");
const panelTag   = document.getElementById("panelTag");
const panelTitle = document.getElementById("panelTitle");
const panelWhy   = document.getElementById("panelWhy");
const flipBtn    = document.getElementById("flipBtn");
let   flipState  = false;

function buildPanelStage(data) {
  // Flippable flat asset (flyer / bag)
  if (data.faces) {
    return `<div class="flip-asset">
      <img id="faceImg" src="${data.faces[0]}" alt="" />
    </div>`;
  }
  // Instagram post — styled to read like a real IG feed post
  if (data.isInstagram) {
    // Instagram-style line icons (feather set)
    const ICON = {
      heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
      comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/></svg>`,
      share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>`,
      bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    };
    return `<div class="ig">
      <header class="ig__head">
        <span class="ig__avatar"><img src="logo.svg" alt="" /></span>
        <span class="ig__meta">
          <span class="ig__name">lovelocal <svg class="ig__verified" viewBox="0 0 24 24" fill="#3897f0"><path d="M12 1l2.6 2.2 3.4-.3 1 3.3 3 1.6-1.2 3.2 1.2 3.2-3 1.6-1 3.3-3.4-.3L12 23l-2.6-2.2-3.4.3-1-3.3-3-1.6L3.2 12 2 8.8l3-1.6 1-3.3 3.4.3z"/><path d="M10.6 14.6 8 12l-1.2 1.2 3.8 3.8 7-7L16.4 9z" fill="#fff"/></svg></span>
          <span class="ig__sub">Sponsored</span>
        </span>
        <span class="ig__dots">⋯</span>
      </header>
      <img src="${data.phone}" alt="" class="ig__media insta-post__image" />
      <div class="ig__bar">
        <div class="ig__bar-left">
          <button class="ig__act" id="likeBtn" aria-label="Like">${ICON.heart}</button>
          <button class="ig__act" id="commentBtn" aria-label="Comment">${ICON.comment}</button>
          <button class="ig__act" aria-label="Share">${ICON.share}</button>
        </div>
        <button class="ig__act" aria-label="Save">${ICON.bookmark}</button>
      </div>
      <div class="ig__likes"><span id="likeCount">36</span> likes</div>
      <div class="ig__caption"><b>lovelocal</b> Woh bharosa. Ab phone par. 🛒 <span class="ig__tags">#LoveLocal #ApnaDukaan #NowOnYourPhone</span></div>
      <div class="ig__viewcomments">View all <span id="commentCount">31</span> comments</div>
      <div class="ig__commentlist" id="commentsArea"></div>
      <div class="ig__time">2 hours ago</div>
      <div class="ig__add" id="commentSection" style="display:none;">
        <input type="text" class="ig__input" placeholder="Add a comment…" id="commentInput" />
        <button class="ig__postbtn" id="sendBtn">Post</button>
      </div>
    </div>`;
  }
  // Phone-framed image
  if (data.phone) {
    return `<div class="phone-frame">
      <img class="phone-frame__device" src="assets/phone.png" alt="" />
      <div class="phone-frame__screen"><img src="${data.phone}" alt="" /></div>
    </div>`;
  }
  // Story video — shown bare (no phone frame), at its vertical 9:16 size
  if (data.phoneVideo) {
    return `<video class="story-video" src="${data.phoneVideo}" autoplay muted loop playsinline></video>`;
  }
  return "";
}

function openPanel(index) {
  const data = STATIONS[index].panel;
  if (!data) return;
  flipState = false;

  panelTag.textContent = data.tag;
  panelTitle.textContent = data.title;
  panelWhy.textContent = data.why;
  panelStage.className = "panel__stage";
  panelStage.innerHTML = buildPanelStage(data);

  // Setup Instagram interactive features
  if (data.isInstagram) {
    setTimeout(() => {
      const likeBtn = document.getElementById("likeBtn");
      const commentBtn = document.getElementById("commentBtn");
      const commentSection = document.getElementById("commentSection");
      const sendBtn = document.getElementById("sendBtn");
      const commentInput = document.getElementById("commentInput");
      const likeCount = document.getElementById("likeCount");
      const commentCount = document.getElementById("commentCount");
      const commentsArea = document.getElementById("commentsArea");
      let liked = false;
      let currentLikes = 36;
      let currentComments = 31;
      
      if (likeBtn) {
        likeBtn.onclick = (e) => {
          e.stopPropagation();
          liked = !liked;
          currentLikes = liked ? 37 : 36;
          likeCount.textContent = currentLikes;
          likeBtn.classList.toggle("is-liked", liked);
        };
      }
      
      if (commentBtn) {
        commentBtn.onclick = (e) => {
          e.stopPropagation();
          commentSection.style.display = commentSection.style.display === "none" ? "flex" : "none";
          if (commentSection.style.display === "flex") {
            commentInput.focus();
          }
        };
      }
      
      if (sendBtn) {
        sendBtn.onclick = (e) => {
          e.stopPropagation();
          if (commentInput.value.trim()) {
            const commentText = commentInput.value;
            currentComments++;
            commentCount.textContent = currentComments;
            
            // Show comment
            const commentEl = document.createElement("div");
            commentEl.className = "ig__comment";
            commentEl.innerHTML = `<b>you</b> ${commentText}`;
            commentsArea.appendChild(commentEl);
            
            commentInput.value = "";
          }
        };
      }
      
      if (commentInput) {
        commentInput.onkeypress = (e) => {
          if (e.key === "Enter") sendBtn.click();
        };
      }
    }, 0);
  }

  // Flip control only for two-faced assets — with a page-turn animation:
  // the page rotates away on Y, we swap the face mid-turn, then it turns
  // back in from the other side.
  if (data.faces) {
    flipBtn.hidden = false;
    flipBtn.textContent = "Palto ↻ (Front / Back)";
    flipBtn.onclick = () => {
      const img = document.getElementById("faceImg");
      if (img.dataset.turning) return;          // ignore clicks mid-turn
      img.dataset.turning = "1";
      img.style.transition = "transform .26s ease-in";
      img.style.transform = "rotateY(88deg)";   // turn the page away
      setTimeout(() => {
        flipState = !flipState;
        img.src = data.faces[flipState ? 1 : 0]; // swap face while edge-on
        img.style.transition = "none";
        img.style.transform = "rotateY(-88deg)"; // jump to the other side
        requestAnimationFrame(() => {
          img.style.transition = "transform .26s ease-out";
          img.style.transform = "rotateY(0deg)"; // turn back in
          setTimeout(() => { delete img.dataset.turning; }, 280);
        });
      }, 260);
    };
  } else {
    flipBtn.hidden = true;
  }

  panel.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => {
    panel.classList.add("is-open");
    scrim.classList.add("is-open");
  });
  document.body.style.overflow = "hidden"; // freeze the walk while reading
  document.getElementById("panelClose").focus();
}

function closePanel() {
  panel.classList.remove("is-open");
  scrim.classList.remove("is-open");
  document.body.style.overflow = "";
  // stop any video
  const v = panelStage.querySelector("video"); if (v) v.pause();
  setTimeout(() => { panel.hidden = true; scrim.hidden = true; panelStage.innerHTML = ""; }, 420);
}

// Open from any product button
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open]");
  if (opener) openPanel(+opener.dataset.open);
});
document.getElementById("panelClose").addEventListener("click", closePanel);
scrim.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
});

/* ---------- 7. Refresh ScrollTrigger after assets/fonts load ---------- */
window.addEventListener("load", () => {
  if (!reduceMotion && window.ScrollTrigger) ScrollTrigger.refresh();
});
