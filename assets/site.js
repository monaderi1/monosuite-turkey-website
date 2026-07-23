const root = document.documentElement;
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
  let turnstileWidgetId = null;

  async function loadTurnstile() {
    try {
      const response = await fetch('/api/form-config', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const config = await response.json();
      if (!config.turnstileSiteKey) return;
      await new Promise((resolve, reject) => {
        if (window.turnstile) { resolve(); return; }
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
    if (!leadForm.reportValidity()) return;
    leadSubmit.disabled = true;
    leadSubmit.textContent = 'Sending…';
    const data = Object.fromEntries(new FormData(leadForm).entries());
    data.consent = data.consent === 'true';
    const context = [
      data.useCase ? `Priority use case: ${data.useCase}` : '',
      data.assetRange ? `Approximate asset range: ${data.assetRange}` : ''
    ].filter(Boolean);
    if (context.length) data.message = `${context.join('\n')}\n\n${data.message || ''}`.trim();
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The request could not be sent.');
      leadStatus.textContent = 'Thank you. Your request has been received.';
      leadStatus.className = 'form-status success';
      leadForm.reset();
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    } catch (error) {
      leadStatus.textContent = error.message || 'The request could not be sent. Please try again.';
      leadStatus.className = 'form-status error';
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    } finally {
      leadSubmit.disabled = false;
      leadSubmit.textContent = 'Send request';
    }
  });
}
