// ===== LOADER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1800);
});

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

// Featured case click
document.querySelectorAll('.work__featured-img').forEach(el => {
    el.addEventListener('click', () => {
        lightboxMedia.innerHTML = `<img src="${el.dataset.src}" alt="${el.dataset.title || ''}">`;
        lightboxTag.textContent = el.dataset.tag || 'FEATURED';
        lightboxTitle.textContent = el.dataset.title || '';
        lightboxDesc.textContent = el.dataset.desc || '';
        lightbox.classList.add('active');
        activeIndex = -1; // disable nav for featured
    });
});

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
