(() => {
  const body = document.body;
  const lang = body.dataset.lang || 'en';
  const page = body.dataset.page || 'home';
  const isTr = lang === 'tr';

  document.documentElement.setAttribute('translate', 'no');
  document.documentElement.classList.add('notranslate');
  body.setAttribute('translate', 'no');
  body.classList.add('notranslate');

  let translationMeta = document.querySelector('meta[name="google"]');
  if (!translationMeta) {
    translationMeta = document.createElement('meta');
    translationMeta.name = 'google';
    document.head.appendChild(translationMeta);
  }
  translationMeta.content = 'notranslate';

  let contentPolishStyles = document.querySelector('link[data-content-polish]');
  if (!contentPolishStyles) {
    contentPolishStyles = document.createElement('link');
    contentPolishStyles.rel = 'stylesheet';
    contentPolishStyles.href = '../assets/content-polish.css';
    contentPolishStyles.dataset.contentPolish = 'true';
    document.head.appendChild(contentPolishStyles);
  }

  const layoutFixes = document.createElement('style');
  layoutFixes.textContent = '.wrap.cta{margin-left:auto;margin-right:auto}';
  document.head.appendChild(layoutFixes);

  const pages = {
    home: ['index.html', 'index.html'],
    platform: ['platform.html', 'platform.html'],
    asset: ['asset-intelligence.html', 'varlik-istihbarati.html'],
    security: ['security-exposure.html', 'guvenlik-maruziyet.html'],
    risk: ['risk-prioritisation.html', 'risk-onceliklendirme.html'],
    integrations: ['integrations.html', 'entegrasyonlar.html'],
    deployment: ['deployment.html', 'dagitim.html'],
    editions: ['editions.html', 'surumler.html'],
    trust: ['security-trust.html', 'guvenlik-ve-guven.html'],
    company: ['company.html', 'sirket.html'],
    demo: ['request-demo.html', 'demo-talep-edin.html'],
    privacy: ['privacy.html', 'kvkk-aydinlatma-metni.html'],
    terms: ['terms.html', 'kullanim-kosullari.html']
  };

  const nav = isTr ? [
    ['platform', 'Platform'],
    ['asset', 'Varlık İstihbaratı'],
    ['security', 'Güvenlik ve Maruziyet'],
    ['risk', 'Risk'],
    ['integrations', 'Entegrasyonlar'],
    ['deployment', 'Dağıtım'],
    ['editions', 'Sürümler']
  ] : [
    ['platform', 'Platform'],
    ['asset', 'Asset Intelligence'],
    ['security', 'Security & Exposure'],
    ['risk', 'Risk'],
    ['integrations', 'Integrations'],
    ['deployment', 'Deployment'],
    ['editions', 'Editions']
  ];

  const idx = isTr ? 1 : 0;
  const other = isTr ? 'en' : 'tr';
  const otherIdx = isTr ? 0 : 1;
  const activePath = pages[page] || pages.home;
  const switchHref = `/${other}/${activePath[otherIdx]}`;
  const navHtml = nav.map(([key, label]) => `<a href="${pages[key][idx]}"${key === page ? ' aria-current="page"' : ''}>${label}</a>`).join('');

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="nav-shell"><div class="wrap nav"><a class="brand" href="index.html" aria-label="Cyobik home"><span class="mark">◇</span>Cyobik</a><nav class="links" id="navLinks" aria-label="${isTr ? 'Ana navigasyon' : 'Primary navigation'}">${navHtml}</nav><div class="nav-actions"><button class="theme" id="themeBtn" type="button" aria-label="${isTr ? 'Renk temasını değiştir' : 'Toggle colour theme'}">◐</button><a class="btn language-switch notranslate" id="languageSwitch" href="${switchHref}" hreflang="${other}" lang="${other}" translate="no" aria-label="${isTr ? 'Switch to English' : 'Türkçe sürüme geç'}"><span class="notranslate" translate="no">${isTr ? 'EN' : 'TR'}</span></a><button class="menu" id="menuBtn" type="button" aria-label="${isTr ? 'Navigasyonu aç' : 'Open navigation'}" aria-expanded="false">☰</button><a class="btn primary" href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a></div></div></header>`;
  }

  const languageSwitch = document.getElementById('languageSwitch');
  if (languageSwitch) {
    languageSwitch.addEventListener('click', () => {
      localStorage.setItem('cyobik-language', other);
    });
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `<footer><div class="wrap"><div class="footer-grid"><div><a class="brand" href="index.html"><span class="mark">◇</span>Cyobik</a><p class="small" style="margin-top:12px;max-width:430px">${isTr ? 'Kurumsal CAASM ve kanıta dayalı siber varlık istihbaratı.' : 'Enterprise CAASM and evidence-driven cyber asset intelligence.'}</p><p class="small" style="margin-top:14px;max-width:520px">${isTr ? 'Cyobik, Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti. tarafından işletilmektedir.' : 'Cyobik is operated by Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti.'}</p><a class="small" style="display:inline-block;margin-top:6px" href="mailto:info@veksacore.com">info@veksacore.com</a></div><div><h4>${isTr ? 'Platform' : 'Platform'}</h4><a href="${pages.asset[idx]}">${isTr ? 'Varlık İstihbaratı' : 'Asset Intelligence'}</a><a href="${pages.security[idx]}">${isTr ? 'Güvenlik ve Maruziyet' : 'Security & Exposure'}</a><a href="${pages.risk[idx]}">${isTr ? 'Risk Önceliklendirme' : 'Risk Prioritisation'}</a><a href="${pages.integrations[idx]}">${isTr ? 'Entegrasyonlar' : 'Integrations'}</a></div><div><h4>${isTr ? 'Kurumsal' : 'Company'}</h4><a href="${pages.deployment[idx]}">${isTr ? 'Dağıtım' : 'Deployment'}</a><a href="${pages.editions[idx]}">${isTr ? 'Sürümler ve Lisanslama' : 'Editions & Licensing'}</a><a href="${pages.trust[idx]}">${isTr ? 'Güvenlik ve Güven' : 'Security & Trust'}</a><a href="${pages.company[idx]}">${isTr ? 'Şirket' : 'Company'}</a><a href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a><a href="${pages.privacy[idx]}">${isTr ? 'KVKK Aydınlatma Metni' : 'Privacy Notice'}</a><a href="${pages.terms[idx]}">${isTr ? 'Kullanım Koşulları' : 'Terms of Use'}</a></div></div><div class="legal"><span>© <span data-year></span> Cyobik.</span><span>${isTr ? 'Müşteri denetimindeki kurumsal ortamlar için.' : 'Built for customer-controlled enterprise environments.'}</span></div></div></footer>`;
  }
})();
