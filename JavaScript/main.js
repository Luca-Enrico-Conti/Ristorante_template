document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const header = document.querySelector(".site-header");
    const navToggle = document.querySelector(".nav-toggle");
    const siteNav = document.querySelector(".site-nav");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsHover = window.matchMedia("(hover: hover)").matches;
    const mobileBreakpoint = window.matchMedia("(max-width: 900px)");

    body.classList.add("js-enabled");

    const pageTransition = document.createElement("div");
    pageTransition.className = "page-transition";
    body.appendChild(pageTransition);

    const hidePageTransition = () => {
        pageTransition.classList.add("is-hidden");
    };

    if (prefersReducedMotion) {
        hidePageTransition();
    } else {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(hidePageTransition);
        });
    }

    const closeMobileNav = () => {
        if (!header || !navToggle) {
            return;
        }

        header.classList.remove("nav-open");
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Apri il menu principale");
    };

    const openMobileNav = () => {
        if (!header || !navToggle) {
            return;
        }

        header.classList.add("nav-open");
        body.classList.add("nav-open");
        navToggle.setAttribute("aria-expanded", "true");
        navToggle.setAttribute("aria-label", "Chiudi il menu principale");
    };

    if (navToggle && siteNav) {
        navToggle.addEventListener("click", () => {
            const isOpen = header?.classList.contains("nav-open");

            if (isOpen) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });

        siteNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (mobileBreakpoint.matches) {
                    closeMobileNav();
                }
            });
        });

        mobileBreakpoint.addEventListener("change", (event) => {
            if (!event.matches) {
                closeMobileNav();
            }
        });
    }

    const updateHeaderState = () => {
        if (!header) {
            return;
        }

        header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileNav();
        }
    });

    const isInternalPageLink = (anchor) => {
        if (!(anchor instanceof HTMLAnchorElement)) {
            return false;
        }

        if (!anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) {
            return false;
        }

        if (anchor.origin !== window.location.origin) {
            return false;
        }

        const url = new URL(anchor.href);
        const samePageHash = url.pathname === window.location.pathname && url.hash;
        const hasSpecialProtocol = url.protocol === "mailto:" || url.protocol === "tel:";
        const isHtmlPage = /\.html$/i.test(url.pathname) || url.pathname.endsWith("/") || /index\.html$/i.test(url.pathname);

        return !samePageHash && !hasSpecialProtocol && isHtmlPage;
    };

    document.addEventListener("click", (event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a") : null;

        if (!anchor || !isInternalPageLink(anchor) || prefersReducedMotion) {
            return;
        }

        event.preventDefault();
        closeMobileNav();
        body.classList.add("is-transitioning-out");
        pageTransition.classList.remove("is-hidden");

        window.setTimeout(() => {
            window.location.href = anchor.href;
        }, 280);
    });

    const revealTargets = new Set();
    const revealSelectors = [
        ".page-content > *",
        ".home-hero-copy > *",
        ".hero-spotlight-card",
        ".glass-panel",
        ".visual-card",
        ".menu-hero > *",
        ".signature-card",
        ".menu-visual-card",
        ".menu-card",
        ".menu-items li",
        ".site-footer-inner"
    ];

    revealSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => revealTargets.add(element));
    });

    const revealElements = Array.from(revealTargets);
    revealElements.forEach((element, index) => {
        element.setAttribute("data-reveal", "");
        element.style.transitionDelay = `${Math.min((index % 6) * 70, 280)}ms`;
    });

    if (prefersReducedMotion) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealElements.forEach((element) => revealObserver.observe(element));
    }

    const counters = document.querySelectorAll(".stat-chip strong");
    if (counters.length > 0) {
        const animateCounter = (element) => {
            const targetValue = Number.parseInt(element.textContent || "0", 10);

            if (!Number.isFinite(targetValue)) {
                return;
            }

            const duration = 1400;
            const startTime = performance.now();

            const tick = (timestamp) => {
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = String(Math.round(targetValue * eased));

                if (progress < 1) {
                    window.requestAnimationFrame(tick);
                } else {
                    element.textContent = String(targetValue);
                }
            };

            window.requestAnimationFrame(tick);
        };

        if (prefersReducedMotion) {
            counters.forEach((element) => animateCounter(element));
        } else {
            const counterObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    });
                },
                { threshold: 0.8 }
            );

            counters.forEach((element) => counterObserver.observe(element));
        }
    }

    const surfaces = document.querySelectorAll(
        ".hero-spotlight-card, .glass-panel, .menu-card, .signature-card, .menu-hero-note, .site-footer-inner"
    );

    if (!prefersReducedMotion && supportsHover) {
        surfaces.forEach((surface) => {
            surface.classList.add("interactive-surface");

            surface.addEventListener("pointermove", (event) => {
                const bounds = surface.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width;
                const y = (event.clientY - bounds.top) / bounds.height;
                const rotateY = (x - 0.5) * 8;
                const rotateX = (0.5 - y) * 8;

                surface.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
                surface.style.boxShadow = "0 28px 50px rgba(78, 45, 28, 0.18)";
            });

            surface.addEventListener("pointerleave", () => {
                surface.style.transform = "";
                surface.style.boxShadow = "";
            });
        });
    }

    const images = document.querySelectorAll(".visual-card img, .menu-visual-card img, .menu-item-image");
    if (images.length > 0) {
        const lightbox = document.createElement("div");
        lightbox.className = "media-lightbox";
        lightbox.innerHTML = `
            <div class="media-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Anteprima immagine">
                <button class="media-lightbox-close" type="button" aria-label="Chiudi anteprima">Chiudi</button>
                <figure class="media-lightbox-figure">
                    <img class="media-lightbox-image" alt="">
                    <figcaption class="media-lightbox-caption"></figcaption>
                </figure>
            </div>
        `;

        body.appendChild(lightbox);

        const lightboxImage = lightbox.querySelector(".media-lightbox-image");
        const lightboxCaption = lightbox.querySelector(".media-lightbox-caption");
        const closeButton = lightbox.querySelector(".media-lightbox-close");

        const openLightbox = (image) => {
            lightboxImage.src = image.currentSrc || image.src;
            lightboxImage.alt = image.alt;
            lightboxCaption.textContent = image.alt || "";
            lightbox.classList.add("is-open");
            body.classList.add("lightbox-open");
        };

        const closeLightbox = () => {
            lightbox.classList.remove("is-open");
            body.classList.remove("lightbox-open");
        };

        images.forEach((image) => {
            image.classList.add("zoomable-image");
            image.setAttribute("tabindex", "0");
            image.setAttribute("role", "button");
            image.setAttribute("aria-haspopup", "dialog");

            image.addEventListener("click", () => openLightbox(image));
            image.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLightbox(image);
                }
            });
        });

        closeButton.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeLightbox();
            }
        });
    }

    const backToTopButton = document.createElement("button");
    backToTopButton.type = "button";
    backToTopButton.className = "back-to-top";
    backToTopButton.textContent = "Torna su";
    backToTopButton.setAttribute("aria-label", "Torna all'inizio della pagina");
    body.appendChild(backToTopButton);

    const updateBackToTop = () => {
        backToTopButton.classList.toggle("is-visible", window.scrollY > 540);
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
});