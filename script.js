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

document.querySelectorAll('.work__item, .work__featured-img, .about__photo-wrap').forEach(el => {
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

// ===== WORK FILTER =====
const filterBtns = document.querySelectorAll('.work__filter');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        workItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
});

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
