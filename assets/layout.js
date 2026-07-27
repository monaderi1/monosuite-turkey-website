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
  layoutFixes.textContent = `
    .wrap.cta{margin-left:auto;margin-right:auto}
    .nav-dropdown{position:relative}
    .nav-dropdown-trigger{display:inline-flex;align-items:center;gap:7px;padding:28px 0 24px;border:0;border-bottom:2px solid transparent;background:transparent;color:inherit;font:inherit;font-weight:inherit;cursor:pointer}
    .nav-dropdown-trigger:hover,.nav-dropdown-trigger[aria-current="page"],.nav-dropdown.open>.nav-dropdown-trigger{color:var(--ink);border-color:var(--brand)}
    .nav-chevron{font-size:10px;line-height:1;transition:transform .18s ease}
    .nav-dropdown.open .nav-chevron{transform:rotate(180deg)}
    .dropdown-menu{display:none;position:absolute;top:calc(100% - 8px);left:-16px;min-width:238px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--shadow);z-index:120}
    .dropdown-menu a{display:block;padding:10px 12px!important;border:0!important;border-radius:9px;white-space:nowrap}
    .dropdown-menu a:hover,.dropdown-menu a[aria-current="page"]{background:var(--surface-2);color:var(--ink)}
    .nav-dropdown.open .dropdown-menu{display:grid}
    @media(min-width:821px){.nav-dropdown:hover .dropdown-menu,.nav-dropdown:focus-within .dropdown-menu{display:grid}}
    @media(max-width:820px){
      .nav-dropdown{width:100%}
      .nav-dropdown-trigger{width:100%;justify-content:space-between;padding:7px 0;border:0}
      .dropdown-menu{position:static;min-width:0;width:100%;margin-top:3px;padding:3px 0 3px 14px;border:0;border-left:1px solid var(--line);border-radius:0;background:transparent;box-shadow:none}
      .dropdown-menu a{padding:7px 0!important}
      .nav-dropdown:not(.open) .dropdown-menu{display:none}
    }
  `;
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

  const idx = isTr ? 1 : 0;
  const other = isTr ? 'en' : 'tr';
  const otherIdx = isTr ? 0 : 1;
  const activePath = pages[page] || pages.home;
  const switchHref = `/${other}/${activePath[otherIdx]}`;

  const platformItems = isTr ? [
    ['platform', 'Platform Genel Bakış'],
    ['asset', 'Varlık İstihbaratı'],
    ['security', 'Güvenlik ve Maruziyet'],
    ['risk', 'Risk Önceliklendirme'],
    ['integrations', 'Entegrasyonlar']
  ] : [
    ['platform', 'Platform Overview'],
    ['asset', 'Asset Intelligence'],
    ['security', 'Security & Exposure'],
    ['risk', 'Risk Prioritisation'],
    ['integrations', 'Integrations']
  ];

  const companyItems = isTr ? [
    ['company', 'Cyobik Hakkında'],
    ['trust', 'Güvenlik ve Güvenilirlik']
  ] : [
    ['company', 'About Cyobik'],
    ['trust', 'Security & Trust']
  ];

  const renderLink = ([key, label]) => `<a href="${pages[key][idx]}"${key === page ? ' aria-current="page"' : ''}>${label}</a>`;
  const renderDropdown = (id, label, items) => {
    const active = items.some(([key]) => key === page);
    return `<div class="nav-dropdown" data-nav-dropdown><button class="nav-dropdown-trigger" type="button" aria-expanded="false" aria-controls="${id}"${active ? ' aria-current="page"' : ''}>${label}<span class="nav-chevron" aria-hidden="true">▾</span></button><div class="dropdown-menu" id="${id}">${items.map(renderLink).join('')}</div></div>`;
  };

  const navHtml = [
    renderDropdown('platformMenu', 'Platform', platformItems),
    renderLink(['deployment', isTr ? 'Dağıtım' : 'Deployment']),
    renderLink(['editions', isTr ? 'Sürümler' : 'Editions']),
    renderDropdown('companyMenu', isTr ? 'Hakkımızda' : 'Company', companyItems)
  ].join('');

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="nav-shell"><div class="wrap nav"><a class="brand" href="index.html" aria-label="Cyobik home"><span class="mark">◇</span>Cyobik</a><nav class="links" id="navLinks" aria-label="${isTr ? 'Ana navigasyon' : 'Primary navigation'}">${navHtml}</nav><div class="nav-actions"><button class="theme" id="themeBtn" type="button" aria-label="${isTr ? 'Renk temasını değiştir' : 'Toggle colour theme'}">◐</button><a class="btn language-switch notranslate" id="languageSwitch" href="${switchHref}" hreflang="${other}" lang="${other}" translate="no" aria-label="${isTr ? 'Switch to English' : 'Türkçe sürüme geç'}"><span class="notranslate" translate="no">${isTr ? 'EN' : 'TR'}</span></a><button class="menu" id="menuBtn" type="button" aria-label="${isTr ? 'Navigasyonu aç' : 'Open navigation'}" aria-expanded="false">☰</button><a class="btn primary" href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a></div></div></header>`;
  }

  const dropdowns = [...document.querySelectorAll('[data-nav-dropdown]')];
  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    trigger?.addEventListener('click', () => {
      const willOpen = !dropdown.classList.contains('open');
      dropdowns.forEach((item) => {
        item.classList.remove('open');
        item.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-nav-dropdown]')) return;
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });

  const languageSwitch = document.getElementById('languageSwitch');
  if (languageSwitch) {
    languageSwitch.addEventListener('click', () => {
      localStorage.setItem('cyobik-language', other);
    });
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `<footer><div class="wrap"><div class="footer-grid"><div><a class="brand" href="index.html"><span class="mark">◇</span>Cyobik</a><p class="small" style="margin-top:12px;max-width:430px">${isTr ? 'Kurumsal CAASM ve kanıta dayalı siber varlık istihbaratı.' : 'Enterprise CAASM and evidence-driven cyber asset intelligence.'}</p><p class="small" style="margin-top:14px;max-width:520px">${isTr ? 'Cyobik, Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti. tarafından işletilmektedir.' : 'Cyobik is operated by Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti.'}</p><a class="small" style="display:inline-block;margin-top:6px" href="mailto:info@veksacore.com">info@veksacore.com</a></div><div><h4>Platform</h4><a href="${pages.asset[idx]}">${isTr ? 'Varlık İstihbaratı' : 'Asset Intelligence'}</a><a href="${pages.security[idx]}">${isTr ? 'Güvenlik ve Maruziyet' : 'Security & Exposure'}</a><a href="${pages.risk[idx]}">${isTr ? 'Risk Önceliklendirme' : 'Risk Prioritisation'}</a><a href="${pages.integrations[idx]}">${isTr ? 'Entegrasyonlar' : 'Integrations'}</a></div><div><h4>${isTr ? 'Kurumsal' : 'Company'}</h4><a href="${pages.deployment[idx]}">${isTr ? 'Dağıtım' : 'Deployment'}</a><a href="${pages.editions[idx]}">${isTr ? 'Sürümler ve Lisanslama' : 'Editions & Licensing'}</a><a href="${pages.trust[idx]}">${isTr ? 'Güvenlik ve Güvenilirlik' : 'Security & Trust'}</a><a href="${pages.company[idx]}">${isTr ? 'Cyobik Hakkında' : 'About Cyobik'}</a><a href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a><a href="${pages.privacy[idx]}">${isTr ? 'KVKK Aydınlatma Metni' : 'Privacy Notice'}</a><a href="${pages.terms[idx]}">${isTr ? 'Kullanım Koşulları' : 'Terms of Use'}</a></div></div><div class="legal"><span>© <span data-year></span> Cyobik.</span><span>${isTr ? 'Müşteri denetimindeki kurumsal ortamlar için.' : 'Built for customer-controlled enterprise environments.'}</span></div></div></footer>`;
  }
})();