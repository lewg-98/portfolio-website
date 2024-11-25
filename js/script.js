// Performance optimizations using modern JavaScript features
(() => {
    'use strict';

    // Cache DOM elements
    const elements = {
        header: document.querySelector('.header'),
        nav: document.querySelector('.nav'),
        navList: document.querySelector('.nav__list'),
        form: document.querySelector('.contact__form'),
    };

    // Utility functions
    const debounce = (fn, delay = 300) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    // Mobile menu setup with event delegation
    const setupMobileMenu = () => {
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'nav__mobile-btn';
        mobileBtn.setAttribute('aria-label', 'Toggle navigation menu');
        mobileBtn.innerHTML = '<span></span><span></span><span></span>';
        
        elements.nav.insertBefore(mobileBtn, elements.navList);

        let isMenuOpen = false;

        // Event delegation for menu clicks
        elements.nav.addEventListener('click', (e) => {
            const target = e.target.closest('.nav__mobile-btn, .nav__link');
            if (!target) return;

            if (target.classList.contains('nav__mobile-btn')) {
                isMenuOpen = !isMenuOpen;
                elements.navList.classList.toggle('nav__list--active');
                mobileBtn.classList.toggle('nav__mobile-btn--active');
                document.body.style.overflow = isMenuOpen ? 'hidden' : '';
            } else if (target.classList.contains('nav__link') && window.innerWidth < 768) {
                elements.navList.classList.remove('nav__list--active');
                mobileBtn.classList.remove('nav__mobile-btn--active');
                document.body.style.overflow = '';
                isMenuOpen = false;
            }
        });
    };

    // Optimized smooth scroll with IntersectionObserver
    const setupSmoothScroll = () => {
        const navLinks = document.querySelectorAll('.nav__link, .hero__cta');
        const headerHeight = elements.header.offsetHeight;

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const top = target.offsetTop - headerHeight;
                        window.scrollTo({
                            top,
                            behavior: 'smooth'
                        });
                    }
                }
            }, { passive: false });
        });
    };

    // Optimized lazy loading with IntersectionObserver
    const setupLazyLoading = () => {
        if (!('IntersectionObserver' in window)) return;

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const img = entry.target;
                const sources = img.parentElement.querySelectorAll('source');

                // Load sources first (if any)
                sources.forEach(source => {
                    if (source.dataset.srcset) {
                        source.srcset = source.dataset.srcset;
                        delete source.dataset.srcset;
                    }
                });

                // Then load the img
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }

                img.classList.add('loaded');
                observer.unobserve(img);
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    // Optimized form validation with efficient error handling
    const setupFormValidation = () => {
        if (!elements.form) return;

        const validateField = (field) => {
            const value = field.value.trim();
            const fieldType = field.type;
            const minLength = field.dataset.minLength || 0;
            
            // Remove existing error
            field.classList.remove('error');
            const errorEl = field.parentElement.querySelector('.error-message');
            if (errorEl) errorEl.remove();

            // Validation rules
            let isValid = true;
            let errorMessage = '';

            switch (fieldType) {
                case 'email':
                    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                    errorMessage = 'Please enter a valid email';
                    break;
                default:
                    isValid = value.length >= minLength;
                    errorMessage = `Minimum ${minLength} characters required`;
            }

            if (!isValid) {
                field.classList.add('error');
                const error = document.createElement('span');
                error.className = 'error-message';
                error.textContent = errorMessage;
                field.parentElement.appendChild(error);
            }

            return isValid;
        };

        // Efficient form submission with minimal reflows
        elements.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fields = elements.form.querySelectorAll('input, textarea');
            const formData = new FormData(elements.form);
            let isValid = true;

            // Batch validation to minimize reflows
            requestAnimationFrame(() => {
                fields.forEach(field => {
                    if (!validateField(field)) isValid = false;
                });

                if (isValid) {
                    submitForm(Object.fromEntries(formData));
                }
            });
        });

        // Efficient real-time validation with debounce
        elements.form.addEventListener('input', debounce(e => {
            if (e.target.matches('input, textarea')) {
                validateField(e.target);
            }
        }, 300));
    };

    // Optimized header scroll handling with requestAnimationFrame
    const setupHeaderScroll = () => {
        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.scrollY;

                    // Efficient classList manipulation
                    const headerClasses = elements.header.classList;
                    
                    if (currentScroll <= 0) {
                        headerClasses.remove('header--hidden', 'header--scrolled');
                    } else {
                        if (currentScroll > lastScroll && currentScroll > 100) {
                            headerClasses.add('header--hidden');
                        } else {
                            headerClasses.remove('header--hidden');
                        }
                        
                        headerClasses.toggle('header--scrolled', currentScroll > 50);
                    }

                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    };

    // Initialize features when DOM is ready
    const init = () => {
        setupMobileMenu();
        setupSmoothScroll();
        setupLazyLoading();
        setupFormValidation();
        setupHeaderScroll();
    };

    // Efficient DOM ready check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();