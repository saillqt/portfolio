// ===== LOADER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1800);
});

// ===== ANTIGRAVITY PARTICLE SYSTEM =====
(function initAntigravity() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    // Create canvas over the particles div
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Sizing
    function resize() {
        canvas.width  = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Mouse tracking for repulsion
    let mouse = { x: -9999, y: -9999 };
    const hero = document.getElementById('hero');
    if (hero) {
        hero.addEventListener('mousemove', e => {
            const r = hero.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        }, { passive: true });
        hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    }

    // Particle factory
    const GOLD   = 'rgba(245,197,24,';
    const WHITE  = 'rgba(255,255,255,';
    const COUNT  = window.innerWidth < 768 ? 55 : 110;

    function makeParticle() {
        const isGold = Math.random() > 0.3;
        const size   = isGold ? (Math.random() * 2.5 + 1) : (Math.random() * 1.5 + 0.5);
        return {
            x:      Math.random() * canvas.width,
            y:      Math.random() * canvas.height,
            size,
            baseSize: size,
            vx:     (Math.random() - 0.5) * 0.3,
            vy:     -(Math.random() * 0.5 + 0.15),   // antigravity: always drift upward
            alpha:  Math.random() * 0.6 + 0.15,
            pulse:  Math.random() * Math.PI * 2,
            color:  isGold ? GOLD : WHITE,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
        };
    }

    let particles = Array.from({ length: COUNT }, makeParticle);

    // Respawn at bottom when a particle exits top
    function resetTop(p) {
        p.x    = Math.random() * canvas.width;
        p.y    = canvas.height + p.size * 2;
        p.vx   = (Math.random() - 0.5) * 0.3;
        p.vy   = -(Math.random() * 0.5 + 0.15);
        p.alpha = Math.random() * 0.6 + 0.15;
        p.pulse = Math.random() * Math.PI * 2;
    }

    const REPEL_RADIUS = 100;
    const REPEL_FORCE  = 1.8;

    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            // Twinkle
            p.pulse += p.twinkleSpeed;
            const flickerAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
            const flickerSize  = p.baseSize * (0.9 + 0.1 * Math.sin(p.pulse * 1.3));

            // Mouse repulsion (antigravity burst)
            const dx   = p.x - mouse.x;
            const dy   = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_RADIUS && dist > 0) {
                const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
                p.vx += (dx / dist) * force * 0.06;
                p.vy += (dy / dist) * force * 0.06;
            }

            // Velocity decay (keep it gentle)
            p.vx *= 0.98;
            p.vy  = p.vy * 0.98 - 0.005;   // tiny upward nudge each frame

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap horizontally, respawn vertically
            if (p.x < -p.size)              p.x = canvas.width  + p.size;
            else if (p.x > canvas.width  + p.size) p.x = -p.size;
            if (p.y < -p.size * 4)          resetTop(p);

            // Draw glow
            if (p.color === GOLD && flickerSize > 1.5) {
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, flickerSize * 3);
                grd.addColorStop(0,   p.color + (flickerAlpha * 0.6) + ')');
                grd.addColorStop(1,   p.color + '0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, flickerSize * 3, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
            }

            // Draw core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, flickerSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color + flickerAlpha + ')';
            ctx.fill();
        });

        requestAnimationFrame(tick);
    }

    tick();
})();

// ===== CURSOR GLOW =====
const glow = document.getElementById('cursorGlow');
if (glow && window.innerWidth > 768) {
    document.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}

// ===== NAV SCROLL =====
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ===== MOBILE MENU =====
const burger = document.getElementById('navBurger');
const navLinks = document.querySelector('.nav__links');
if (burger) {
    burger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        burger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            navLinks.classList.remove('open');
            burger.classList.remove('active');
        });
    });
}

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        const link = document.querySelector(`.nav__links a[href="#${id}"]`);
        if (link) {
            link.classList.toggle('active', scrollY >= top && scrollY < top + height);
        }
    });
}, { passive: true });

// ===== REVEAL ON SCROLL =====
const revealEls = document.querySelectorAll(
    '.about__grid, .about__left, .about__right, .xp__entry, .skill-card, .trait-chip, .stillthere__content, .contact__content, .split-text, .work__featured, .work__stats'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.classList.add('in');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// ===== SKILL CARDS — cursor light tracking + bar fill on view =====
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
});

// ===== STATS COUNTER =====
const counters = document.querySelectorAll('.work__stat-num');
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const dur = 1400;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        statObserver.unobserve(el);
    });
}, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });
counters.forEach(c => statObserver.observe(c));

// ===== INJECT WORK CAPTIONS from data-title / data-desc =====
const workItems = Array.from(document.querySelectorAll('.work__item'));
workItems.forEach(item => {
    const title = item.dataset.title;
    const desc = item.dataset.desc || '';
    if (title && !item.querySelector('.work__caption')) {
        const cap = document.createElement('div');
        cap.className = 'work__caption';
        cap.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
        item.appendChild(cap);
    }
});

// ===== LAZY MEDIA LOADING (IntersectionObserver) =====
function loadMedia(item) {
    const img = item.querySelector('img[data-src]');
    const video = item.querySelector('video[data-src]');
    if (img) {
        img.addEventListener('load', () => item.classList.add('loaded'), { once: true });
        img.addEventListener('error', () => item.classList.add('loaded'), { once: true });
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        if (img.complete) {
            item.classList.add('loaded');
        }
    } else if (video) {
        video.src = video.dataset.src;
        video.removeAttribute('data-src');
        video.load();
        video.addEventListener('loadeddata', () => {
            item.classList.add('loaded');
            video.play().catch(() => {});
        }, { once: true });
    } else {
        item.classList.add('loaded');
    }
}

const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadMedia(entry.target);
        mediaObserver.unobserve(entry.target);
    });
}, { rootMargin: '600px 0px' });

document.querySelectorAll('.work__item, .work__featured-img, .about__photo-wrap, .strip__item, .meme-card').forEach(el => {
    const hasLazy = el.querySelector('[data-src]');
    if (!hasLazy) {
        // Already has src= (eager) — just mark loaded once the image finishes
        const eagerImg = el.querySelector('img[src]');
        if (eagerImg && !eagerImg.complete) {
            eagerImg.addEventListener('load', () => el.classList.add('loaded'), { once: true });
            eagerImg.addEventListener('error', () => el.classList.add('loaded'), { once: true });
        } else {
            el.classList.add('loaded');
        }
        return;
    }
    // Above-the-fold: load immediately if already in viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) {
        loadMedia(el);
    } else {
        mediaObserver.observe(el);
    }
});

// Pause videos when offscreen for perf
const videoEls = document.querySelectorAll('.work__item video');
const playObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) v.play && v.play().catch(() => {});
        else v.pause && v.pause();
    });
}, { threshold: 0.25 });
videoEls.forEach(v => playObserver.observe(v));

// ===== WORK FILTER + CURATION + DECLASSIFY PAGINATION =====
// Curated order — strongest, most diverse pieces surface first.
const CURATED_ORDER = [
    'Key Visual — Hero',
    'Nutripaw — Packaging Design',
    'Meet The Coders — Logo I',
    'Cadbury\'s India',
    'Decode Age — Ad I',
    'Nike Case Study',
    'World Debt',
    'Fevicol — Case Study I',
    'Vader',
    'Pelé Tribute',
    'We The Leaders',
    'Amusement Park — Laughter Day',
    'Swivl — Ad I',
    'Dark Santa',
    'Electricity Prices',
    'Batman Ninja',
    'Monk Mantra — Ad XI',
    'GreyB — Post Cover I',
    'Louis Vuitton',
    '7 Rivers — Branding',
    'Chart Patterns — Fingrad',
    'Menu Card — 01',
    'Engagement Post — 01',
    'Unacademy — Spec Ad'
];

(function curateGrid() {
    const grid = document.querySelector('.work__grid');
    if (!grid) return;
    const rank = new Map(CURATED_ORDER.map((t, i) => [t, i]));
    const BIG = CURATED_ORDER.length;
    workItems.sort((a, b) => {
        const ra = rank.has(a.dataset.title) ? rank.get(a.dataset.title) : BIG;
        const rb = rank.has(b.dataset.title) ? rank.get(b.dataset.title) : BIG;
        return ra - rb;
    });
    workItems.forEach(item => grid.appendChild(item));
})();

const filterBtns = document.querySelectorAll('.work__filter');
const workMoreBtn = document.getElementById('workMore');
const workMoreCount = document.getElementById('workMoreCount');
const WORK_PAGE = 12;
let workCap = WORK_PAGE;
let activeFilter = 'all';

// Show item counts on the tabs
filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === 'all' ? workItems.length
        : workItems.filter(i => i.dataset.category === f).length;
    const count = document.createElement('span');
    count.className = 'work__filter-count';
    count.textContent = n;
    btn.appendChild(count);
});

function applyWorkFilter() {
    const matching = workItems.filter(i =>
        activeFilter === 'all' || i.dataset.category === activeFilter);
    workItems.forEach(i => i.classList.add('hidden'));
    matching.slice(0, workCap).forEach(i => i.classList.remove('hidden'));

    const remaining = Math.max(0, matching.length - workCap);
    if (workMoreBtn) {
        workMoreBtn.style.display = remaining > 0 ? '' : 'none';
        if (workMoreCount) workMoreCount.textContent = remaining + ' FILE' + (remaining === 1 ? '' : 'S') + ' SEALED';
    }
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        workCap = WORK_PAGE;
        applyWorkFilter();
    });
});

if (workMoreBtn) {
    workMoreBtn.addEventListener('click', () => {
        workCap += WORK_PAGE;
        applyWorkFilter();
    });
}

applyWorkFilter();

// ===== LIGHTBOX with title & description + prev/next =====
const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightboxMedia');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxTag = document.getElementById('lightboxTag');
const lightboxDesc = document.getElementById('lightboxDesc');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let activeIndex = -1;

function openLightbox(idx) {
    const visible = workItems.filter(i => !i.classList.contains('hidden'));
    if (!visible.length) return;
    activeIndex = ((idx % visible.length) + visible.length) % visible.length;
    const item = visible[activeIndex];
    const media = item.querySelector('img, video');
    if (!media) return;

    lightboxMedia.innerHTML = '';
    if (media.tagName === 'VIDEO') {
        const v = document.createElement('video');
        v.src = media.currentSrc || media.src || media.dataset.src || '';
        v.controls = true;
        v.autoplay = true;
        v.loop = true;
        v.playsInline = true;
        lightboxMedia.appendChild(v);
    } else {
        const img = document.createElement('img');
        img.src = media.currentSrc || media.src || media.dataset.src || '';
        img.alt = media.alt || '';
        lightboxMedia.appendChild(img);
    }

    lightboxTag.textContent = item.dataset.tag || 'WORK';
    lightboxTitle.textContent = item.dataset.title || '';
    lightboxDesc.textContent = item.dataset.desc || '';
    lightbox.classList.add('active');
    lightbox.dataset.list = 'visible';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxMedia.innerHTML = '';
    activeIndex = -1;
}

function navigate(dir) {
    if (activeIndex < 0) return;
    const visible = workItems.filter(i => !i.classList.contains('hidden'));
    openLightbox(activeIndex + dir);
}

workItems.forEach(item => {
    item.addEventListener('click', () => {
        const visible = workItems.filter(i => !i.classList.contains('hidden'));
        const idx = visible.indexOf(item);
        if (idx >= 0) openLightbox(idx);
    });
});

// ===== STANDALONE LIGHTBOX (carousels, memes, videos) =====
function openLightboxFromElement(el, tagOverride) {
    const media = el.querySelector('img, video');
    if (!media) return;
    lightboxMedia.innerHTML = '';
    if (media.tagName === 'VIDEO') {
        const v = document.createElement('video');
        v.src = media.currentSrc || media.src || media.dataset.src || '';
        v.controls = true;
        v.autoplay = true;
        v.loop = true;
        v.playsInline = true;
        lightboxMedia.appendChild(v);
    } else {
        const img = document.createElement('img');
        img.src = media.currentSrc || media.src || media.dataset.src || '';
        img.alt = media.alt || '';
        lightboxMedia.appendChild(img);
    }
    const rowLabel = el.closest('.strip-row')?.querySelector('.strip-row__label')?.textContent?.trim();
    lightboxTag.textContent = el.dataset.tag || tagOverride || rowLabel || 'WORK';
    lightboxTitle.textContent = el.dataset.title || media.alt || '';
    lightboxDesc.textContent = el.dataset.desc || '';
    lightbox.classList.add('active');
    activeIndex = -1; // disable prev/next nav for standalone items
}

// Carousel strip items — every card
document.querySelectorAll('.strip__item').forEach(el => {
    el.addEventListener('click', () => openLightboxFromElement(el, 'CAROUSEL'));
});

// Memes — every card
document.querySelectorAll('.meme-card').forEach(el => {
    el.addEventListener('click', () => openLightboxFromElement(el, 'MEME'));
});

// Yogabar gallery — packs, totes, polaroid, mockups all pop into the shared lightbox
document.querySelectorAll('#yogabar-retro-world .yo-mock, #yogabar-retro-world .yo-tote, #yogabar-retro-world .yo-pack, #yogabar-retro-world .yo-polaroid').forEach(el => {
    el.addEventListener('click', (e) => {
        // ignore clicks on actual links / buttons inside the card
        if (e.target.closest('a, button')) return;
        openLightboxFromElement(el, 'YOGABAR');
    });
});

// Video cards — clicking the label opens lightbox; the video itself keeps its native controls
document.querySelectorAll('.video-card').forEach(el => {
    const label = el.querySelector('.video-card__label');
    if (label) {
        label.style.cursor = 'pointer';
        label.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightboxFromElement(el, 'VIDEO');
        });
    }
});

// ===== FEATURED CAROUSEL & LIGHTBOX =====
(function initFeaturedCarousel() {
    const slides = document.querySelectorAll('.work__featured-slide');
    if (!slides.length) return;
    
    const dots = document.querySelectorAll('.featured-dot');
    const btnPrev = document.querySelector('.featured-prev');
    const btnNext = document.querySelector('.featured-next');
    let active = 0;

    function goToSlide(idx) {
        if (idx < 0) idx = slides.length - 1;
        if (idx >= slides.length) idx = 0;
        if (idx === active) return;
        
        slides[active].classList.remove('active');
        dots[active]?.classList.remove('active');
        
        active = idx;
        
        slides[active].classList.add('active');
        dots[active]?.classList.add('active');
    }

    if (btnPrev) btnPrev.addEventListener('click', () => goToSlide(active - 1));
    if (btnNext) btnNext.addEventListener('click', () => goToSlide(active + 1));
    
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => goToSlide(idx));
    });

    // Featured case lightbox click
    document.querySelectorAll('.work__featured-img').forEach(el => {
        el.addEventListener('click', () => {
            lightboxMedia.innerHTML = `<img src="${el.dataset.src}" alt="${el.dataset.title || ''}">`;
            lightboxTag.textContent = el.dataset.tag || 'FEATURED';
            lightboxTitle.textContent = el.dataset.title || '';
            lightboxDesc.textContent = el.dataset.desc || '';
            lightbox.classList.add('active');
            activeIndex = -1; // disable global nav for featured
        });
    });
})();

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigate(-1));
if (lightboxNext) lightboxNext.addEventListener('click', () => navigate(1));
if (lightbox) {
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
}
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'ArrowLeft') navigate(-1);
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ===== MAGNETIC BUTTON =====
document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

// ===== TILT (subtle 3D) =====
document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 6;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

// ===== TERM DECK (swipeable card carousel) =====
(function initTermDeck(){
    const deck = document.getElementById('termDeck');
    if (!deck) return;
    const cards = deck.querySelectorAll('.term-card');
    const tabs  = deck.querySelectorAll('.term-deck__tab');
    const dots  = deck.querySelectorAll('.term-deck__dot');
    const arrows = deck.querySelectorAll('.term-deck__arrow');
    let active = 0;

    function go(idx){
        idx = (idx + cards.length) % cards.length;
        if (idx === active) return;
        cards[active].classList.remove('is-active');
        tabs[active]?.classList.remove('is-active');
        dots[active]?.classList.remove('is-active');
        active = idx;
        cards[active].classList.add('is-active');
        tabs[active]?.classList.add('is-active');
        dots[active]?.classList.add('is-active');
    }

    tabs.forEach(t => t.addEventListener('click', () => go(parseInt(t.dataset.idx, 10))));
    dots.forEach(d => d.addEventListener('click', () => go(parseInt(d.dataset.idx, 10))));
    arrows.forEach(a => a.addEventListener('click', () => go(active + parseInt(a.dataset.dir, 10))));

    // Touch swipe
    const viewport = deck.querySelector('.term-deck__viewport');
    let startX = 0, dx = 0, dragging = false;
    viewport.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX; dx = 0; dragging = true;
    }, { passive: true });
    viewport.addEventListener('touchmove', e => {
        if (!dragging) return;
        dx = e.touches[0].clientX - startX;
    }, { passive: true });
    viewport.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
    });

    // Keyboard arrows when deck is in viewport
    document.addEventListener('keydown', e => {
        const r = deck.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        if (e.key === 'ArrowRight') go(active + 1);
        if (e.key === 'ArrowLeft')  go(active - 1);
    });
})();


// ===== RETRO VIBE CUSTOMIZER SYSTEM =====
(function initRetroCustomizer() {
    const canvas = document.getElementById('customizer-canvas');
    const pkgImg = document.getElementById('customizer-pkg-img');
    const ledG = document.querySelector('.console-leds .led.green');
    const ledY = document.querySelector('.console-leds .led.yellow');

    const BG_COLORS = {
        navy: '#1A2A4A',
        blue: '#1E73BE',
        red: '#C0392B',
        cream: '#FAF0F0'
    };

    function flashLed(led) {
        if (!led) return;
        led.classList.add('lit');
        setTimeout(() => led.classList.remove('lit'), 350);
    }

    // 1. Backdrop Color Changer
    document.querySelectorAll('#bg-color-selectors .color-select').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#bg-color-selectors .color-select').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color;
            if (canvas && BG_COLORS[color]) {
                canvas.style.backgroundColor = BG_COLORS[color];
            }
            flashLed(ledG);
        });
    });

    // 2. Toggle claims/badges
    document.querySelectorAll('.console-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const badgeId = 'canvas-' + btn.dataset.target;
            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.classList.toggle('active');
            }
            flashLed(ledY);
        });
    });

    // 3. Flavor pack swap
    document.querySelectorAll('[data-flavor]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flavor]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (pkgImg) {
                pkgImg.style.opacity = '0';
                setTimeout(() => {
                    pkgImg.src = btn.dataset.flavor === 'yellow'
                        ? 'yogabar/yellow package.webp'
                        : 'yogabar/blue package.webp';
                    pkgImg.style.opacity = '1';
                }, 220);
            }
            flashLed(ledG);
            flashLed(ledY);
        });
    });

    // 4. Interactive Swatch Cards (Click to Copy, Double Click to set Canvas Background)
    document.querySelectorAll('.swatch-card').forEach(card => {
        const hex = card.dataset.hex;
        
        // Visual Copy Toast overlay
        const toast = document.createElement('div');
        toast.className = 'swatch-toast';
        toast.textContent = 'COPIED!';
        card.appendChild(toast);

        card.addEventListener('click', () => {
            // Copy to clipboard
            navigator.clipboard.writeText(hex).then(() => {
                card.classList.add('copied-flash');
                flashLed(ledG);
                flashLed(ledY);
                setTimeout(() => card.classList.remove('copied-flash'), 1000);
            }).catch(err => {
                console.error('Failed to copy hex code:', err);
            });
        });

        card.addEventListener('dblclick', () => {
            // Set canvas background to this color
            if (canvas) {
                canvas.style.backgroundColor = hex;
            }
            flashLed(ledG);
            flashLed(ledY);
            
            // Sync with console buttons if applicable
            document.querySelectorAll('#bg-color-selectors .color-select').forEach(btn => {
                const btnColorVar = btn.getAttribute('style').match(/--btn-color:\s*(#[a-fA-F0-9]+)/);
                if (btnColorVar && btnColorVar[1].toLowerCase() === hex.toLowerCase()) {
                    document.querySelectorAll('#bg-color-selectors .color-select').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    });
})();

// ===== RETRO THEME ACTIVE MODE SWITCHER (EASTER EGG) =====
(function initThemeSwitcher() {
    const trigger = document.getElementById('retro-vibe-trigger');
    const backBtn = document.getElementById('btn-back-batman');
    const restoreBtn = document.getElementById('batman-vibe-restore');
    const overlay = document.getElementById('transition-overlay');
    const transitionBars = overlay ? [...overlay.querySelectorAll('.transition-bar')] : [];
    let transitionTimer;
    let isTransitioning = false;
    let lockedScrollY = 0;

    if (!overlay) return;

    function waitForBars() {
        return new Promise(resolve => {
            if (!transitionBars.length) {
                resolve();
                return;
            }

            let done = false;
            const finishedBars = new Set();
            const finish = () => {
                if (done) return;
                done = true;
                transitionBars.forEach(bar => bar.removeEventListener('transitionend', onEnd));
                clearTimeout(transitionTimer);
                resolve();
            };
            const onEnd = event => {
                if (event.propertyName !== 'transform') return;
                finishedBars.add(event.target);
                if (finishedBars.size === transitionBars.length) finish();
            };

            transitionBars.forEach(bar => bar.addEventListener('transitionend', onEnd));
            transitionTimer = setTimeout(finish, 1400);
        });
    }

    function lockPage() {
        const html = document.documentElement;
        const body = document.body;
        lockedScrollY = window.scrollY || html.scrollTop || body.scrollTop || 0;
        html.classList.add('theme-switching');
        body.style.position = 'fixed';
        body.style.top = `-${lockedScrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
    }

    function unlockAtTop() {
        const html = document.documentElement;
        const body = document.body;
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        html.scrollTop = 0;
        body.scrollTop = 0;
    }

    function runTransition(toRetro) {
        if (isTransitioning) return;
        isTransitioning = true;

        lockPage();
        overlay.className = 'transition-overlay';
        if (!toRetro) {
            overlay.classList.add('batman-color');
        }

        requestAnimationFrame(async () => {
            overlay.offsetHeight;
            const enterTransition = waitForBars();
            overlay.classList.add('active');
            await enterTransition;

            if (toRetro) {
                document.body.classList.add('retro-vibe-active');
            } else {
                document.body.classList.remove('retro-vibe-active');
            }
            unlockAtTop();
            await new Promise(resolve => requestAnimationFrame(() => {
                unlockAtTop();
                requestAnimationFrame(resolve);
            }));

            overlay.style.visibility = 'hidden';
            overlay.classList.remove('active');
            transitionBars.forEach(bar => {
                bar.style.transition = 'none';
                bar.style.transform = 'translate3d(-101%,0,0)';
            });
            overlay.offsetHeight;
            overlay.className = 'transition-overlay';
            transitionBars.forEach(bar => {
                bar.style.transition = '';
                bar.style.transform = '';
            });
            overlay.style.visibility = '';
            document.documentElement.classList.remove('theme-switching');
            isTransitioning = false;
        });
    }

    if (trigger) trigger.addEventListener('click', () => runTransition(true));
    if (backBtn) backBtn.addEventListener('click', () => runTransition(false));
    if (restoreBtn) restoreBtn.addEventListener('click', () => runTransition(false));

    // Footer restore button
    const footerRestoreBtn = document.getElementById('retro-footer-restore-btn');
    if (footerRestoreBtn) footerRestoreBtn.addEventListener('click', () => runTransition(false));
})();

// ===== RETRO SCROLL-REVEAL =====
(function initRetroReveal() {
    const revealEls = document.querySelectorAll('.retro-reveal');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));

    // Re-check visible elements when entering retro mode
    const retroTrigger = document.getElementById('retro-vibe-trigger');
    if (retroTrigger) {
        retroTrigger.addEventListener('click', () => {
            setTimeout(() => {
                revealEls.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        el.classList.add('is-visible');
                    }
                });
            }, 700); // after transition completes
        });
    }
})();

/* ===============================================================
   LOVELOCAL · ENTER THE AISLE
   Opens the LoveLocal "walk the aisle" microsite in a fullscreen
   iframe behind a roller-shutter that rolls UP to reveal it
   (and rolls back DOWN on exit) — a dukaan opening for business.
   =============================================================== */
(function initLoveLocal() {
    const enterBtn = document.getElementById('llEnter');
    const world    = document.getElementById('lovelocal-world');
    const iframe   = document.getElementById('lovelocal-iframe');
    const shutter  = document.getElementById('llShutter');
    const exitBtn  = document.getElementById('llExit');
    if (!enterBtn || !world || !iframe || !shutter) return;

    const SRC = 'portfolio-images/LoveLocal%20campaign/index.html';
    let busy = false;

    function open() {
        if (busy || world.classList.contains('is-active')) return;
        busy = true;
        // Lazy-load the aisle only on first open.
        if (!iframe.src || iframe.src.endsWith('about:blank')) iframe.src = SRC;
        world.classList.add('is-active');     // reveal world, shutter down covering it
        shutter.classList.remove('is-up');
        document.body.style.overflow = 'hidden';
        // Double rAF so the "down" state paints before we animate up.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            shutter.classList.add('is-up');   // roll the shutter UP → dukaan opens
            setTimeout(() => { busy = false; }, 2000);
        }));
    }

    function close() {
        if (busy || !world.classList.contains('is-active')) return;
        busy = true;
        shutter.classList.remove('is-up');    // roll shutter back DOWN to cover
        setTimeout(() => {
            world.classList.remove('is-active');
            document.body.style.overflow = '';
            iframe.src = 'about:blank';        // unload the heavy aisle
            busy = false;
        }, 1900);                             // matches shutter transition
    }

    enterBtn.addEventListener('click', open);
    if (exitBtn) exitBtn.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && world.classList.contains('is-active')) close();
    });
})();

/* ===============================================================
   AMAZING PASS · scroll signal, gotham rain + lightning,
   decrypt labels, bat-flock easter egg
   =============================================================== */

// ===== SCROLL SIGNAL BAR =====
(function initScrollSignal() {
    const bar = document.createElement('div');
    bar.className = 'scroll-signal';
    bar.innerHTML = '<div class="scroll-signal__fill"></div>';
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;

    let ticking = false;
    function update() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? (window.scrollY / max) * 100 : 0;
        fill.style.width = p + '%';
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
})();

// ===== GOTHAM RAIN + LIGHTNING (hero) =====
(function initGothamWeather() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Lightning overlay
    const lightning = document.createElement('div');
    lightning.className = 'hero__lightning';
    lightning.setAttribute('aria-hidden', 'true');
    hero.insertBefore(lightning, hero.firstChild);

    // Rain canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__rain';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.querySelector('.hero__content'));
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COUNT = window.innerWidth < 768 ? 45 : 110;
    const WIND = -0.9; // slight leftward drift
    function makeDrop() {
        const z = Math.random();            // depth: 0 far, 1 near
        return {
            x: Math.random() * (canvas.width + 200),
            y: Math.random() * canvas.height,
            len: 8 + z * 18,
            speed: 7 + z * 11,
            alpha: 0.05 + z * 0.22,
            z
        };
    }
    let drops = Array.from({ length: COUNT }, makeDrop);

    let heroVisible = true;
    new IntersectionObserver(entries => {
        heroVisible = entries[0].isIntersecting;
    }).observe(hero);

    function tick() {
        if (heroVisible && !document.hidden) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            drops.forEach(d => {
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + WIND * (d.len / 12), d.y + d.len);
                ctx.lineWidth = 0.6 + d.z;
                ctx.strokeStyle = `rgba(190,205,230,${d.alpha})`;
                ctx.stroke();
                d.y += d.speed;
                d.x += WIND;
                if (d.y > canvas.height + d.len) {
                    d.y = -d.len - Math.random() * 40;
                    d.x = Math.random() * (canvas.width + 200);
                }
                if (d.x < -20) d.x = canvas.width + 10;
            });
        }
        requestAnimationFrame(tick);
    }
    tick();

    // Lightning scheduler — random distant flashes
    (function scheduleFlash() {
        const wait = 2500 + Math.random() * 4000;
        setTimeout(() => {
            if (heroVisible && !document.hidden && !document.body.classList.contains('retro-vibe-active')) {
                lightning.classList.remove('flash');
                void lightning.offsetWidth;
                lightning.classList.add('flash');
            }
            scheduleFlash();
        }, wait);
    })();
})();

// ===== SECTION LABEL DECRYPT =====
(function initDecryptLabels() {
    const labels = document.querySelectorAll('.section__label');
    if (!labels.length) return;
    const CHARS = '█▓▒░<>/\|#@$%&01';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function decrypt(el) {
        const original = el.textContent;
        const total = original.length;
        let frame = 0;
        const framesPerChar = 2;
        function step() {
            const resolved = Math.floor(frame / framesPerChar);
            let out = '';
            for (let i = 0; i < total; i++) {
                if (i < resolved || original[i] === ' ') out += original[i];
                else out += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            el.textContent = out;
            frame++;
            if (resolved < total) requestAnimationFrame(step);
            else el.textContent = original;
        }
        step();
    }

    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            obs.unobserve(entry.target);
            if (!reduced) decrypt(entry.target);
        });
    }, { threshold: 0.4 });
    labels.forEach(l => obs.observe(l));
})();

// ===== BAT-FLOCK EASTER EGG (type "batman") =====
(function initBatFlock() {
    let buffer = '';
    let active = false;

    function release() {
        if (active) return;
        active = true;

        const signal = document.createElement('div');
        signal.className = 'bat-signal-flash';
        document.body.appendChild(signal);

        const flock = document.createElement('div');
        flock.className = 'bat-flock';
        const n = 14;
        for (let i = 0; i < n; i++) {
            const bat = document.createElement('img');
            bat.src = 'batman%20logo.webp';
            bat.alt = '';
            bat.className = 'bat-flock__bat';
            bat.style.setProperty('--bt', (4 + Math.random() * 72) + '%');
            bat.style.setProperty('--bs', Math.round(24 + Math.random() * 44) + 'px');
            bat.style.setProperty('--bd', (2.6 + Math.random() * 2.6).toFixed(2) + 's');
            bat.style.setProperty('--bdel', (Math.random() * 1.4).toFixed(2) + 's');
            bat.style.setProperty('--bw', Math.round(30 + Math.random() * 90) + 'px');
            flock.appendChild(bat);
        }
        document.body.appendChild(flock);

        setTimeout(() => {
            flock.remove();
            signal.remove();
            active = false;
        }, 7000);
    }

    document.addEventListener('keydown', e => {
        if (e.key.length !== 1) return;
        buffer = (buffer + e.key.toLowerCase()).slice(-6);
        if (buffer === 'batman') { buffer = ''; release(); }
    });

    console.log('%c🦇 I am vengeance. I am the night. Type "batman" anywhere...', 'color:#f5c518;font-family:monospace;font-size:12px;background:#0a0a0a;padding:6px 10px;border-radius:4px;');
})();

// ===== INTERACTIVE WORLDS PORTAL CARDS =====
(function initWorldCards() {
    // Whole card is clickable — delegate to its button
    document.querySelectorAll('.world-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('button')) return;
            const btn = card.querySelector('.world-card__btn');
            if (btn) btn.click();
        });
    });
})();

// ===== FEATURED SLIDES · blurred backdrop fill (fixed-height media box) =====
document.querySelectorAll('.work__featured-img[data-src]').forEach(el => {
    el.style.setProperty('--featured-bg', `url("${el.dataset.src}")`);
});


/* ===============================================================
   INTERACTIVITY PASS · tron cursor trail + click sparks,
   spotlight cards, hero parallax, more magnetic buttons
   =============================================================== */

// ===== TRON CURSOR TRAIL + CLICK SPARKS =====
(function initTronTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return; // mouse only

    const canvas = document.createElement('canvas');
    canvas.className = 'tron-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const LIFE = 450;          // trail segment lifetime (ms)
    const points = [];         // {x, y, t}
    const sparks = [];         // {x, y, vx, vy, life, t}

    window.addEventListener('mousemove', e => {
        const last = points[points.length - 1];
        // interpolate fast moves so the ribbon stays continuous
        if (last && performance.now() - last.t < 80) {
            const dx = e.clientX - last.x, dy = e.clientY - last.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.min(6, Math.floor(dist / 24));
            for (let i = 1; i <= steps; i++) {
                points.push({ x: last.x + dx * i / (steps + 1), y: last.y + dy * i / (steps + 1), t: performance.now() });
            }
        }
        points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (points.length > 400) points.splice(0, points.length - 400);
    }, { passive: true });

    window.addEventListener('pointerdown', e => {
        const n = 12;
        for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
            const v = 2 + Math.random() * 3.5;
            sparks.push({
                x: e.clientX, y: e.clientY,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1,
                life: 500 + Math.random() * 300,
                t: performance.now()
            });
        }
    }, { passive: true });

    function colors() {
        // coral in retro mode, gold in the batcave
        return document.body.classList.contains('retro-vibe-active')
            ? { glow: '255,75,92', core: '255,220,225' }
            : { glow: '245,197,24', core: '255,246,200' };
    }

    function draw() {
        const now = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // prune
        while (points.length && now - points[0].t > LIFE) points.shift();
        for (let i = sparks.length - 1; i >= 0; i--) {
            if (now - sparks[i].t > sparks[i].life) sparks.splice(i, 1);
        }

        const c = colors();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // trail ribbon: outer glow pass + bright core pass
        if (points.length > 1) {
            for (let pass = 0; pass < 2; pass++) {
                for (let i = 1; i < points.length; i++) {
                    const p0 = points[i - 1], p1 = points[i];
                    const age = (now - p1.t) / LIFE;         // 0 fresh → 1 dead
                    const fade = 1 - age;
                    if (fade <= 0) continue;
                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    if (pass === 0) {
                        ctx.strokeStyle = `rgba(${c.glow},${(fade * 0.28).toFixed(3)})`;
                        ctx.lineWidth = 9 * fade;
                    } else {
                        ctx.strokeStyle = `rgba(${c.core},${(fade * 0.9).toFixed(3)})`;
                        ctx.lineWidth = 2.4 * fade;
                    }
                    ctx.stroke();
                }
            }
        }

        // click sparks
        sparks.forEach(s => {
            const age = (now - s.t) / s.life;
            const fade = 1 - age;
            s.x += s.vx; s.y += s.vy;
            s.vy += 0.11;              // slight gravity
            s.vx *= 0.985; s.vy *= 0.985;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
            ctx.strokeStyle = `rgba(${c.glow},${(fade * 0.9).toFixed(3)})`;
            ctx.lineWidth = 1.6 * fade + 0.4;
            ctx.stroke();
        });

        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(draw);
    }
    draw();
})();

// ===== SPOTLIGHT CARDS (perks, xp, finale, terminals) =====
(function initSpotlightCards() {
    const els = document.querySelectorAll('.perk, .xp__info, .finale__card, .lang-card');
    els.forEach(el => {
        el.classList.add('spot-card');
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        }, { passive: true });
    });
})();

// ===== HERO PARALLAX (title drifts against the cursor) =====
(function initHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.getElementById('hero');
    const content = hero && hero.querySelector('.hero__content');
    if (!content) return;
    hero.addEventListener('mousemove', e => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5;
        content.style.setProperty('--hpx', (-nx).toFixed(3));
        content.style.setProperty('--hpy', (-ny).toFixed(3));
    }, { passive: true });
    hero.addEventListener('mouseleave', () => {
        content.style.setProperty('--hpx', 0);
        content.style.setProperty('--hpy', 0);
    });
})();

// ===== MAGNETIC: extend to carousel arrows + declassify button =====
document.querySelectorAll('.featured-btn, .work__more, .term-deck__arrow').forEach(el => {
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});
