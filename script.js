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


// ===== YOGABAR LAB HTML CONTENT FOR IFRAME INJECTION =====
const YOGABAR_LAB_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yogabar Retro Lab</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Bebas+Neue&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: #0A1128;
            color: #FFFDF9;
            font-family: 'Inter', -apple-system, sans-serif;
            height: 100vh;
            overflow: hidden;
            user-select: none;
        }

        /* Animated grid bg */
        .lab-bg {
            position: fixed;
            inset: 0;
            background-image:
                linear-gradient(rgba(255, 75, 92, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 75, 92, 0.05) 1px, transparent 1px);
            background-size: 36px 36px;
            animation: bgDrift 18s linear infinite;
            pointer-events: none;
        }
        @keyframes bgDrift {
            0% { background-position: 0 0; }
            100% { background-position: 36px 36px; }
        }

        .lab-wrap {
            position: relative;
            z-index: 1;
            display: flex;
            height: 100vh;
        }

        /* ─── LEFT: PACKAGE PREVIEW ─── */
        .lab-preview {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .lab-canvas {
            position: relative;
            width: 260px;
            height: 320px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            transition: background-color 0.5s ease;
            overflow: visible;
        }

        .lab-canvas-grid {
            position: absolute;
            inset: 0;
            border-radius: 12px;
            background-image: repeating-conic-gradient(
                rgba(255, 255, 255, 0.04) 0% 25%,
                transparent 0% 50%
            );
            background-size: 16px 16px;
        }

        .lab-pkg {
            position: relative;
            z-index: 2;
            width: 200px;
            height: auto;
            filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.6));
            animation: floatPkg 3.8s ease-in-out infinite;
            transition: opacity 0.25s ease;
        }
        @keyframes floatPkg {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-14px) rotate(2deg); }
        }

        /* Spinning badges */
        .lab-badge {
            position: absolute;
            width: 66px;
            height: 66px;
            border-radius: 50%;
            border: 2px solid #FFFDF9;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 8.5px;
            letter-spacing: 0.4px;
            line-height: 1.25;
            padding: 5px;
            z-index: 3;
            transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lab-badge.hidden { opacity: 0; transform: scale(0.5) !important; }

        .badge-millets {
            background: #FF4B5C;
            top: -8%;
            left: -16%;
            animation: spin 8s linear infinite;
        }
        .badge-sugar {
            background: #0c152b;
            border-color: rgba(255,255,255,0.5);
            bottom: 4%;
            right: -18%;
            animation: spin 11s linear infinite reverse;
        }
        .badge-grains {
            background: #FFC045;
            color: #0A1128;
            border-color: #0A1128;
            top: 38%;
            right: -20%;
            animation: spin 14s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* ─── RIGHT: CONTROLS ─── */
        .lab-controls {
            width: 200px;
            background: rgba(12, 21, 43, 0.95);
            border-left: 1px solid rgba(255, 255, 255, 0.07);
            padding: 18px 14px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
        }

        .ctrl-header {
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ctrl-leds {
            display: flex;
            gap: 5px;
            margin-bottom: 8px;
        }
        .ctrl-led {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #222;
        }
        .ctrl-led.r { background: #FF4B5C; box-shadow: 0 0 5px #FF4B5C; }
        .ctrl-led.g { transition: all 0.2s; }
        .ctrl-led.g.lit { background: #44ff88; box-shadow: 0 0 5px #44ff88; }
        .ctrl-led.y { transition: all 0.2s; }
        .ctrl-led.y.lit { background: #FFC045; box-shadow: 0 0 5px #FFC045; }

        .ctrl-title {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 11px;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.6);
        }

        .ctrl-label {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.35);
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        /* Color buttons */
        .color-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }
        .color-btn {
            border: 1.5px solid transparent;
            border-radius: 3px;
            padding: 7px 4px;
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            transition: border-color 0.15s, transform 0.1s;
            text-align: center;
        }
        .color-btn:active { transform: scale(0.93); }
        .color-btn.active { border-color: #FFFDF9; }

        /* Toggle list */
        .toggle-list { display: flex; flex-direction: column; gap: 5px; }
        .toggle-btn {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 3px;
            padding: 7px 8px;
            color: rgba(255,255,255,0.4);
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 7px;
            transition: all 0.2s;
        }
        .toggle-btn .dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            flex-shrink: 0;
            transition: all 0.2s;
        }
        .toggle-btn.active {
            border-color: rgba(255, 75, 92, 0.5);
            color: #FFFDF9;
            background: rgba(255,75,92,0.07);
        }
        .toggle-btn.active .dot {
            background: #FF4B5C;
            box-shadow: 0 0 5px #FF4B5C;
        }

        /* Flavor buttons */
        .flavor-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }
        .flavor-btn {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 3px;
            padding: 8px 4px;
            color: rgba(255,255,255,0.4);
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            line-height: 1.4;
        }
        .flavor-btn.active {
            border-color: #FFFDF9;
            color: #FFFDF9;
            background: rgba(255,255,255,0.04);
        }

        /* Logo at bottom */
        .ctrl-logo {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.07);
        }
        .ctrl-logo img {
            width: 90px;
            opacity: 0.55;
            filter: brightness(2);
        }
        .ctrl-logo-sub {
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.2);
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="lab-bg"></div>

    <div class="lab-wrap">

        <!-- Package preview -->
        <div class="lab-preview">
            <div class="lab-canvas" id="labCanvas">
                <div class="lab-canvas-grid"></div>

                <div class="lab-badge badge-millets" id="badgeMillets">MIGHTY<br>MILLETS</div>
                <div class="lab-badge badge-sugar" id="badgeSugar">NO<br>REFINED<br>SUGAR</div>
                <div class="lab-badge badge-grains" id="badgeGrains">100%<br>WHOLE<br>GRAINS</div>

                <img src="yogabar/blue package.png" id="pkgImg" class="lab-pkg" alt="Yogabar Package">
            </div>
        </div>

        <!-- Controls -->
        <div class="lab-controls">
            <div class="ctrl-header">
                <div class="ctrl-leds">
                    <div class="ctrl-led r"></div>
                    <div class="ctrl-led g" id="ledG"></div>
                    <div class="ctrl-led y" id="ledY"></div>
                </div>
                <div class="ctrl-title">VIBE CONTROLLER V1.0</div>
            </div>

            <div>
                <div class="ctrl-label">1. BACKDROP</div>
                <div class="color-grid">
                    <button class="color-btn active" data-color="navy"   style="background:#0c152b; color:#FFFDF9;">NAVY</button>
                    <button class="color-btn"        data-color="coral"  style="background:#FF4B5C; color:#FFFDF9;">CORAL</button>
                    <button class="color-btn"        data-color="cream"  style="background:#FFFDF9; color:#0c152b;">CREAM</button>
                    <button class="color-btn"        data-color="gold"   style="background:#FFC045; color:#0c152b;">GOLD</button>
                </div>
            </div>

            <div>
                <div class="ctrl-label">2. RETRO CLAIMS</div>
                <div class="toggle-list">
                    <button class="toggle-btn active" data-badge="badgeMillets"><span class="dot"></span>MIGHTY MILLETS</button>
                    <button class="toggle-btn active" data-badge="badgeSugar"><span class="dot"></span>NO REFINED SUGAR</button>
                    <button class="toggle-btn active" data-badge="badgeGrains"><span class="dot"></span>100% WHOLE GRAINS</button>
                </div>
            </div>

            <div>
                <div class="ctrl-label">3. FLAVOR PACK</div>
                <div class="flavor-grid">
                    <button class="flavor-btn active" data-flavor="blue">BLUE<br>PACK</button>
                    <button class="flavor-btn"        data-flavor="yellow">YELLOW<br>PACK</button>
                </div>
            </div>

            <div class="ctrl-logo">
                <img src="yogabar/logo red and white.png" alt="Yogabar" onerror="this.style.display='none'">
                <div class="ctrl-logo-sub">MILLET MUESLI REDESIGN</div>
            </div>
        </div>
    </div>

    <script>
        const canvas  = document.getElementById('labCanvas');
        const pkgImg  = document.getElementById('pkgImg');
        const ledG    = document.getElementById('ledG');
        const ledY    = document.getElementById('ledY');

        const BG = { navy:'#0c152b', coral:'#FF4B5C', cream:'#FFFDF9', gold:'#FFC045' };

        function flash(led) {
            led.classList.add('lit');
            setTimeout(() => led.classList.remove('lit'), 350);
        }

        // Color
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                canvas.style.backgroundColor = BG[btn.dataset.color] || BG.navy;
                flash(ledG);
            });
        });

        // Badge toggles
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                const badge = document.getElementById(btn.dataset.badge);
                if (badge) badge.classList.toggle('hidden');
                flash(ledY);
            });
        });

        // Flavor swap
        document.querySelectorAll('.flavor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.flavor-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                pkgImg.style.opacity = '0';
                setTimeout(() => {
                    pkgImg.src = btn.dataset.flavor === 'yellow'
                        ? 'yogabar/yellow package.png'
                        : 'yogabar/blue package.png';
                    pkgImg.style.opacity = '1';
                }, 220);
                flash(ledG);
                flash(ledY);
            });
        });
    </script>
</body>
</html>
`;

// ===== DYNAMIC IFRAME INJECTION =====
window.addEventListener('load', () => {
    const iframe = document.getElementById('yogabar-iframe');
    if (iframe) {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(YOGABAR_LAB_HTML);
            doc.close();
        } catch (e) {
            console.error('Failed to inject iframe content:', e);
        }
    }
});

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
                        ? 'yogabar/yellow package.png'
                        : 'yogabar/blue package.png';
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
