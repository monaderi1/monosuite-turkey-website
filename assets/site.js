const root = document.documentElement;
const pageBody = document.body;
const isTurkish = pageBody.dataset.lang === 'tr';
const themeButton = document.getElementById('themeBtn');
const menuButton = document.getElementById('menuBtn');
const navigation = document.getElementById('navLinks');
const savedTheme = localStorage.getItem('cyobik-theme');

if (savedTheme) root.dataset.theme = savedTheme;
if (themeButton) {
  themeButton.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('cyobik-theme', next);
  });
}

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const leadForm = document.getElementById('leadForm');
if (leadForm) {
  const leadStatus = document.getElementById('leadStatus');
  const leadSubmit = document.getElementById('leadSubmit');
  const turnstileSlot = document.getElementById('turnstileSlot');
  const submitLabel = isTurkish ? 'Demo talep edin' : 'Request a demo';
  const sendingLabel = isTurkish ? 'Gönderiliyor…' : 'Sending…';
  let turnstileWidgetId = null;

  const messages = isTurkish ? {
    success: 'Teşekkürler. Demo talebiniz alındı.',
    invalid: 'Lütfen zorunlu alanları kontrol edin.',
    rateLimit: 'Çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin.',
    verification: 'İnsan doğrulaması başarısız oldu. Lütfen tekrar deneyin.',
    unavailable: 'Form şu anda kullanılamıyor. Lütfen info@veksacore.com adresine e-posta gönderin.',
    generic: 'Talep gönderilemedi. Lütfen tekrar deneyin veya info@veksacore.com adresine e-posta gönderin.'
  } : {
    success: 'Thank you. Your demo request has been received.',
    invalid: 'Please review the required fields.',
    rateLimit: 'Too many requests were submitted. Please try again later.',
    verification: 'Human verification failed. Please try again.',
    unavailable: 'The form is temporarily unavailable. Please email info@veksacore.com.',
    generic: 'The request could not be sent. Please try again or email info@veksacore.com.'
  };

  async function loadTurnstile() {
    if (!turnstileSlot) return;

    try {
      const response = await fetch('/api/form-config', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const config = await response.json();
      if (!config.turnstileSiteKey) return;

      await new Promise((resolve, reject) => {
        if (window.turnstile) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      turnstileWidgetId = window.turnstile.render(turnstileSlot, {
        sitekey: config.turnstileSiteKey,
        theme: root.dataset.theme === 'dark' ? 'dark' : 'light'
      });
    } catch (error) {
      console.error('Turnstile could not be loaded', error);
    }
  }

  loadTurnstile();

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    leadStatus.textContent = '';
    leadStatus.className = 'form-status';

    if (!leadForm.reportValidity()) {
      leadStatus.textContent = messages.invalid;
      leadStatus.className = 'form-status error';
      return;
    }

    leadSubmit.disabled = true;
    leadSubmit.textContent = sendingLabel;

    const data = Object.fromEntries(new FormData(leadForm).entries());
    data.marketingConsent = data.marketingConsent === 'true';

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error(messages.rateLimit);
        if (response.status === 400) throw new Error(messages.verification);
        if (response.status === 503) throw new Error(messages.unavailable);
        throw new Error(messages.generic);
      }

      leadStatus.textContent = messages.success;
      leadStatus.className = 'form-status success';
      leadForm.reset();

      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } catch (error) {
      leadStatus.textContent = error.message || messages.generic;
      leadStatus.className = 'form-status error';

      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } finally {
      leadSubmit.disabled = false;
      leadSubmit.textContent = submitLabel;
    }
  });
}
