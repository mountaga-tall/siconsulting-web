document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const translations = window.SI_TRANSLATIONS || {};
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };
  document.body.classList.add('js-enabled');
  const languageFromBrowser = () => {
    const browserLanguage = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return ['en', 'de'].includes(browserLanguage) ? browserLanguage : 'fr';
  };
  let currentLanguage = ['fr', 'en', 'de'].includes(store.get('si-language')) ? store.get('si-language') : languageFromBrowser();
  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  };
  const showToast = (message) => {
    const toast = $('#siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 4200);
  };
  const updateThemeControl = (theme) => {
    const control = $('#themeToggle');
    if (!control) return;
    const dictionary = translations[currentLanguage] || translations.fr || {};
    const label = theme === 'dark' ? dictionary.themeLight : dictionary.themeDark;
    control.setAttribute('aria-label', label || 'Toggle theme');
    control.setAttribute('title', label || 'Toggle theme');
    control.innerHTML = '<i data-lucide="' + (theme === 'dark' ? 'sun' : 'moon') + '" aria-hidden="true"></i>';
    const themeMeta = $('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#080d16' : '#f4f7fb');
    refreshIcons();
  };
  const updateMenuControl = (open) => {
    const control = $('#menuToggle');
    if (!control) return;
    const dictionary = translations[currentLanguage] || translations.fr || {};
    control.setAttribute('aria-expanded', String(open));
    control.setAttribute('aria-label', open ? (dictionary.menuClose || 'Close menu') : (dictionary.menuOpen || 'Open menu'));
    control.innerHTML = '<i data-lucide="' + (open ? 'x' : 'menu') + '" aria-hidden="true"></i>';
    refreshIcons();
  };
  const applyLanguage = (language, persist = true) => {
    if (!translations[language]) language = 'fr';
    currentLanguage = language;
    const dictionary = translations[language];
    document.documentElement.lang = language;
    $$('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) element.textContent = dictionary[key];
    });
    $$('[data-i18n-placeholder]').forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) element.setAttribute('placeholder', dictionary[key]);
    });
    $$('[data-lang]').forEach((button) => {
      const selected = button.dataset.lang === language;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const titleKey = document.body.dataset.titleKey;
    const descriptionKey = document.body.dataset.descriptionKey;
    if (titleKey && dictionary[titleKey]) document.title = dictionary[titleKey];
    const description = $('meta[name="description"]');
    if (descriptionKey && dictionary[descriptionKey] && description) description.setAttribute('content', dictionary[descriptionKey]);
    const ogTitle = $('meta[property="og:title"]');
    if (ogTitle && titleKey && dictionary[titleKey]) ogTitle.setAttribute('content', dictionary[titleKey]);
    const ogDescription = $('meta[property="og:description"]');
    if (ogDescription && descriptionKey && dictionary[descriptionKey]) ogDescription.setAttribute('content', dictionary[descriptionKey]);
    const navKeys = {home:'navHome',solutions:'navSolutions',technology:'navTechnology',company:'navCompany',contact:'navContact'};
    $$('[data-nav]').forEach((link) => {
      if (link.dataset.nav === document.body.dataset.page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      link.setAttribute('aria-label', dictionary[navKeys[link.dataset.nav]] || link.textContent.trim());
    });
    updateThemeControl(document.documentElement.dataset.theme || 'dark');
    updateMenuControl($('#menuToggle')?.getAttribute('aria-expanded') === 'true');
    if (persist) store.set('si-language', language);
    refreshIcons();
  };
  $$('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));

  const savedTheme = store.get('si-theme');
  const theme = ['light','dark'].includes(savedTheme) ? savedTheme : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = theme;
  updateThemeControl(theme);
  $('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('si-theme', next);
    updateThemeControl(next);
  });

  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const closeMenu = () => {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.remove('open');
    document.body.classList.remove('menu-open');
    updateMenuControl(false);
  };
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      if (open) closeMenu();
      else {
        mainNav.classList.add('open');
        document.body.classList.add('menu-open');
        updateMenuControl(true);
      }
    });
    $$('a', mainNav).forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('pointerdown', (event) => {
      if (mainNav.classList.contains('open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); }, {passive:true});
  }

  const revealItems = $$('.reveal');
  revealItems.forEach((element, index) => element.style.setProperty('--reveal-delay', (index % 5) * 75 + 'ms'));
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.08, rootMargin:'0px 0px -35px 0px'});
    revealItems.forEach((element) => observer.observe(element));
  } else revealItems.forEach((element) => element.classList.add('revealed'));

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    $$('.solution-card, .tech-card, .method-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--tilt-x', (-y * 2.8).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * 2.8).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x','0deg');
        card.style.setProperty('--tilt-y','0deg');
      });
    });
  }

  const header = $('#siteHeader');
  const backToTop = $('#backToTop');
  let scrollBusy = false;
  const handleScroll = () => {
    if (scrollBusy) return;
    scrollBusy = true;
    requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 16);
      backToTop?.classList.toggle('visible', window.scrollY > 520);
      scrollBusy = false;
    });
  };
  window.addEventListener('scroll', handleScroll, {passive:true});
  handleScroll();
  backToTop?.addEventListener('click', () => window.scrollTo({top:0,behavior:prefersReducedMotion?'auto':'smooth'}));

  const form = $('#quoteForm');
  const emailButton = $('#emailSubmitBtn');
  const status = $('#formStatus');
  const formData = () => ({
    name:$('#name')?.value.trim() || '',
    email:$('#email')?.value.trim() || '',
    phone:$('#phone')?.value.trim() || '',
    country:$('#country')?.value.trim() || '',
    product:$('#productSelect')?.value || '',
    message:$('#message')?.value.trim() || ''
  });
  const buildMessage = (data) => [
    'SI CONSULTING SARL — REQUEST / DEMANDE / ANFRAGE',
    'Name / Nom / Name: ' + data.name,
    'Email: ' + data.email,
    'Phone / Téléphone: ' + data.phone,
    'Country / Pays / Land: ' + data.country,
    'Product / Produit / Produkt: ' + data.product,
    'Details / Détails / Details: ' + (data.message || '—')
  ].join('\n');
  const validForm = () => {
    if (!form || !form.reportValidity()) {
      const dictionary = translations[currentLanguage] || translations.fr;
      if (status) status.textContent = dictionary.formError || 'Please check the form.';
      return false;
    }
    return true;
  };
  if (form) {
    const query = new URLSearchParams(window.location.search);
    const productMap = {carbon:'Charbon actif minier',water:'Hydrafin – traitement des eaux',detection:'Détecteurs de métaux'};
    const select = $('#productSelect');
    if (select && productMap[query.get('product')]) select.value = productMap[query.get('product')];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validForm()) return;
      const data = formData();
      const message = encodeURIComponent(buildMessage(data));
      const url = 'https://wa.me/22377194647?text=' + message;
      const dictionary = translations[currentLanguage] || translations.fr;
      if (status) status.textContent = dictionary.whatsappOpening || 'Opening WhatsApp…';
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (!popup) window.location.assign(url);
    });
  }
  emailButton?.addEventListener('click', () => {
    if (!validForm()) return;
    const data = formData();
    const dictionary = translations[currentLanguage] || translations.fr;
    if (status) status.textContent = dictionary.emailOpening || 'Opening email…';
    window.location.href = 'mailto:info@siconsulting.com?subject=' + encodeURIComponent('SI Consulting — ' + data.product) + '&body=' + encodeURIComponent(buildMessage(data));
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', {scope:'./'}).catch((error) => console.warn('Service worker registration failed:', error));
    });
  }
  let deferredInstallPrompt = null;
  const installCard = $('#installCard');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installCard && store.get('si-install-dismissed') !== 'yes') installCard.hidden = false;
    refreshIcons();
  });
  $('#installButton')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showToast((translations[currentLanguage] || translations.fr).installFail || 'Install unavailable.');
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (installCard) installCard.hidden = true;
  });
  $('#dismissInstall')?.addEventListener('click', () => {
    if (installCard) installCard.hidden = true;
    store.set('si-install-dismissed','yes');
  });
  window.addEventListener('appinstalled', () => {
    if (installCard) installCard.hidden = true;
    showToast((translations[currentLanguage] || translations.fr).installReady || 'App installed.');
  });
  window.addEventListener('offline', () => showToast((translations[currentLanguage] || translations.fr).offline || 'You are offline.'));
  applyLanguage(currentLanguage, false);
});
