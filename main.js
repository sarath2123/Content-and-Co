// ===== Content & Co — Shared Behavior =====

// Always start at the top on refresh, instead of the browser
// restoring the previous scroll position.
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    const siteHeader = document.getElementById('site-header');

    // Toggle Mobile Menu
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('click', (e) => {
        if (siteHeader && !siteHeader.contains(e.target)) closeMenu();
    });

    function closeMenu() {
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuBtn.querySelector('i').className = 'fas fa-bars';
        }
    }

    // Highlight the current page in the nav
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.nav-links a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Split headline text into words for the staggered word-reveal effect
    document.querySelectorAll(".word-reveal").forEach(el => {
    const walk = node => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent
                .split(/(\s+)/)
                .map(part => {
                    if (part.trim() === "") return document.createTextNode(part);

                    const span = document.createElement("span");
                    span.className = "word";
                    span.textContent = part;
                    return span;
                });
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);

            [...node.childNodes].forEach(child => {
                walk(child).forEach(n => clone.appendChild(n));
            });

            return [clone];
        }

        return [];
    };

    const nodes = walk(el);

    el.innerHTML = "";

    let delay = 0.05;

    el.querySelectorAll(".word").forEach(() => {});

    nodes.forEach(node => el.appendChild(node));

    el.querySelectorAll(".word").forEach(word => {
        word.style.animationDelay = `${delay}s`;
        delay += 0.04;
    });
});
    // Scroll-triggered fade-in reveal
    const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    if (entry.target.classList.contains('stats')) {
                        animateStatNumbers(entry.target);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    // Count the About page stats up from 0 instead of just appearing.
    // Runs once, when the stats strip first scrolls into view.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function animateStatNumbers(container) {
        if (reducedMotion) return;
        container.querySelectorAll('.stat-num').forEach(el => {
            const match = el.textContent.trim().match(/^(\d+)(.*)$/);
            if (!match) return;
            const target = parseInt(match[1], 10);
            const suffix = match[2];
            const duration = 1100;
            const start = performance.now();
            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    // Card spotlight: track the cursor and expose it as CSS custom
    // properties, throttled to one update per animation frame.
    // Skipped entirely on touch devices (no hover, no benefit).
    if (window.matchMedia('(hover: hover)').matches && !reducedMotion) {
        const spotlightSelector = '.service-card, .service-detail-card, .pricing-card, ' +
            '.contact-box, .standalone-card, .member-card, .testimonial-card, ' +
            '.testimonial-card-light, .whatsapp-cta';
        let pendingEvent = null;
        let frameQueued = false;
        document.addEventListener('pointermove', (e) => {
            pendingEvent = e;
            if (frameQueued) return;
            frameQueued = true;
            requestAnimationFrame(() => {
                frameQueued = false;
                if (!pendingEvent) return;
                const target = pendingEvent.target.closest(spotlightSelector);
                if (target) {
                    const rect = target.getBoundingClientRect();
                    target.style.setProperty('--mx', `${pendingEvent.clientX - rect.left}px`);
                    target.style.setProperty('--my', `${pendingEvent.clientY - rect.top}px`);
                }
            });
        }, { passive: true });
    }

    // Header gains a soft shadow once scrolled past the hero.
    let scrollFrameQueued = false;
    window.addEventListener('scroll', () => {
        if (scrollFrameQueued) return;
        scrollFrameQueued = true;
        requestAnimationFrame(() => {
            if (siteHeader) siteHeader.classList.toggle('scrolled', window.scrollY > 20);
            scrollFrameQueued = false;
        });
    }, { passive: true });

    // Contact forms: build a pre-filled WhatsApp message instead of
    // submitting anywhere (this is a static site, there's no backend).
    document.querySelectorAll('form[data-whatsapp-form]').forEach(form => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const category = form.getAttribute('data-category') || '';
            const lines = [`Hi Content & Co! Enquiry: ${category}`];

            form.querySelectorAll('.form-group').forEach(group => {
                const label = group.querySelector('label');
                const field = group.querySelector('.form-control');
                if (label && field && field.value.trim()) {
                    lines.push(`${label.textContent}: ${field.value.trim()}`);
                }
            });

            const message = encodeURIComponent(lines.join('\n'));
            window.open(`https://wa.me/919342141898?text=${message}`, '_blank');
            form.reset();
        });
    });
});