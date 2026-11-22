document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('js-enabled');

  // Les icônes restent facultatives : le site fonctionne même si le CDN est indisponible.
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Année du copyright.
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Halo du curseur : uniquement sur les appareils disposant d'un vrai pointeur.
  const cursorGlow = $('#cursorGlow');
  if (cursorGlow && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
    let pointerFrame = 0;
    document.addEventListener('pointermove', (event) => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        cursorGlow.style.left = event.clientX + 'px';
        cursorGlow.style.top = event.clientY + 'px';
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  // Navigation sticky et menu mobile accessible au clavier.
  const navbar = $('#navbar');
  const menuToggle = $('#menuToggle');
  const navLinks = $('#navLinks');
  const closeMenu = () => {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
      navLinks.classList.toggle('open', !isOpen);
    });

    $$('a', navLinks).forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuToggle.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    }, { passive: true });
  }

  const backToTop = $('.back-to-top');
  let scrollFrame = 0;
  const updateScrollState = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const isScrolled = window.scrollY > 40;
      if (navbar) navbar.classList.toggle('scrolled', isScrolled);
      if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
      scrollFrame = 0;
    });
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  // Révélation au défilement avec solution de repli si l'API n'est pas disponible.
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('active'));
  }

  // Compteurs animés au moment où ils deviennent visibles.
  const counters = $$('.stat-number[data-target]');
  const animateCounter = (counter) => {
    if (counter.dataset.counted === 'true') return;
    counter.dataset.counted = 'true';
    const target = Number.parseInt(counter.dataset.target, 10);
    if (!Number.isFinite(target) || target < 0) return;
    if (reducedMotion) {
      counter.textContent = String(target);
      return;
    }
    const duration = 1200;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else counter.textContent = String(target);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && !reducedMotion) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // Effet de perspective désactivé sur les écrans tactiles et en mode mouvement réduit.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
    $$('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        if (!centerX || !centerY) return;
        const rotateX = ((event.clientY - rect.top - centerY) / centerY) * -4;
        const rotateY = ((event.clientX - rect.left - centerX) / centerX) * 4;
        card.style.setProperty('--tilt-x', rotateX.toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', rotateY.toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // Onglets accessibles : clic, flèches gauche/droite, Début et Fin.
  const tabButtons = $$('.tab-btn[role="tab"]');
  const tabPanels = $$('.tab-content[role="tabpanel"]');
  const activateTab = (button, moveFocus = false) => {
    const panelId = button.dataset.tab;
    tabButtons.forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    tabPanels.forEach((panel) => {
      const active = panel.id === panelId;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    if (moveFocus) button.focus();
  };

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button));
    button.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabButtons[nextIndex], true);
    });
  });

  // Préremplissage du devis depuis les cartes produit et fiches techniques.
  const productSelect = $('#productSelect');
  const quoteSection = $('#devis');
  const selectProduct = (value) => {
    if (!productSelect || !quoteSection || !value) return;
    const matchingOption = Array.from(productSelect.options).find((option) => option.value === value);
    if (matchingOption) productSelect.value = value;
    quoteSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    if (matchingOption) productSelect.focus({ preventScroll: true });
  };

  $$('.select-product').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (card) selectProduct(card.dataset.product);
    });
  });
  $$('.select-product-direct').forEach((button) => {
    button.addEventListener('click', () => selectProduct(button.dataset.product));
  });

  // Création des messages sans mélanger les encodages des différents champs.
  const quoteForm = $('#quoteForm');
  const emailSubmitButton = $('#emailSubmitBtn');
  const formStatus = $('#formStatus');
  const getFormData = () => ({
    whatsappNumber: $('#whatsappLine') ? $('#whatsappLine').value.replace(/\D/g, '') : '',
    name: $('#name') ? $('#name').value.trim() : '',
    phone: $('#phone') ? $('#phone').value.trim() : '',
    country: $('#country') ? $('#country').value.trim() : '',
    product: productSelect ? productSelect.value : '',
    message: $('#message') ? $('#message').value.trim() : ''
  });

  const buildQuoteMessage = (data) => [
    'NOUVELLE DEMANDE DE DEVIS - SI CONSULTING SARL',
    '--------------------------------------------',
    'Client / Société : ' + data.name,
    'Téléphone : ' + data.phone,
    'Pays : ' + data.country,
    'Solution : ' + data.product,
    'Détails : ' + (data.message || 'Demande de catalogue et de tarifs')
  ].join('\n');

  if (quoteForm) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!quoteForm.reportValidity()) return;
      const data = getFormData();
      if (!/^\d{8,15}$/.test(data.whatsappNumber)) {
        if (formStatus) formStatus.textContent = 'Le numéro WhatsApp sélectionné est invalide. Choisissez un autre numéro ou contactez-nous par e-mail.';
        return;
      }
      const url = 'https://wa.me/' + data.whatsappNumber + '?text=' + encodeURIComponent(buildQuoteMessage(data));
      if (formStatus) formStatus.textContent = 'Ouverture de WhatsApp avec votre demande préremplie…';
      const popup = window.open(url, '_blank');
      if (popup) popup.opener = null;
      else window.location.assign(url);
    });
  }

  if (emailSubmitButton && quoteForm) {
    emailSubmitButton.addEventListener('click', () => {
      if (!quoteForm.reportValidity()) return;
      const data = getFormData();
      const subject = encodeURIComponent('Demande de devis - ' + data.product + ' (' + data.name + ')');
      const body = encodeURIComponent(
        'Bonjour SI Consulting SARL,\n\n' +
        buildQuoteMessage(data) +
        '\n\nCordialement.'
      );
      if (formStatus) formStatus.textContent = 'Ouverture de votre messagerie avec la demande préremplie…';
      window.location.href = 'mailto:info@siconsulting.com?subject=' + subject + '&body=' + body;
    });
  }

  // Particules légères, limitées en nombre et suspendues hors écran.
  const canvas = $('#particlesCanvas');
  const context = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  const hero = $('.hero');
  if (canvas && context && hero && !reducedMotion) {
    let particles = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    let animationFrame = 0;
    let isVisible = true;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvasWidth = Math.max(1, bounds.width);
      canvasHeight = Math.max(1, bounds.height);
      canvas.width = Math.round(canvasWidth * pixelRatio);
      canvas.height = Math.round(canvasHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(65, Math.max(12, Math.round((canvasWidth * canvasHeight) / 22000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 1.8 + 0.5,
        speedY: Math.random() * 0.35 + 0.12,
        speedX: (Math.random() - 0.5) * 0.22,
        color: Math.random() > 0.35 ? 'rgba(245, 158, 11, 0.48)' : 'rgba(16, 185, 129, 0.42)'
      }));
    };

    const drawParticles = () => {
      animationFrame = 0;
      if (!isVisible || document.hidden) return;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      particles.forEach((particle) => {
        particle.y -= particle.speedY;
        particle.x += particle.speedX;
        if (particle.y < 0) {
          particle.y = canvasHeight;
          particle.x = Math.random() * canvasWidth;
        }
        if (particle.x < 0) particle.x = canvasWidth;
        if (particle.x > canvasWidth) particle.x = 0;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      animationFrame = requestAnimationFrame(drawParticles);
    };

    const startParticles = () => {
      if (isVisible && !document.hidden && !animationFrame) {
        animationFrame = requestAnimationFrame(drawParticles);
      }
    };
    const stopParticles = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopParticles();
      else startParticles();
    });

    if ('IntersectionObserver' in window) {
      const particleObserver = new IntersectionObserver((entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) startParticles();
        else stopParticles();
      }, { threshold: 0.01 });
      particleObserver.observe(hero);
    } else {
      startParticles();
    }
  }
});
