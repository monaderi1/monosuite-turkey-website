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
    .risk-context{padding-top:30px}
    .risk-context .section-head{max-width:850px}
    .regulated-callout{margin-top:28px}
    @media(min-width:821px){.nav-dropdown:hover .dropdown-menu{display:grid}}
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
    home: ['', ''],
    platform: ['platform', 'platform'],
    asset: ['asset-intelligence', 'varlik-istihbarati'],
    security: ['security-exposure', 'guvenlik-maruziyet'],
    risk: ['risk-prioritisation', 'risk-onceliklendirme'],
    integrations: ['integrations', 'entegrasyonlar'],
    deployment: ['deployment', 'dagitim'],
    editions: ['editions', 'surumler'],
    company: ['company', 'sirket'],
    demo: ['request-demo', 'demo-talep-edin'],
    privacy: ['privacy', 'kvkk-aydinlatma-metni'],
    terms: ['terms', 'kullanim-kosullari']
  };

  const idx = isTr ? 1 : 0;
  const other = isTr ? 'en' : 'tr';
  const otherIdx = isTr ? 0 : 1;
  const activePath = pages[page] || pages.home;
  const switchHref = `/${other}/${activePath[otherIdx]}`;

  const platformItems = isTr ? [
    ['platform', '__CYOBIK_0053__'],
    ['asset', '__CYOBIK_0059__'],
    ['security', '__CYOBIK_0051__'],
    ['risk', '__CYOBIK_0054__'],
    ['integrations', '__CYOBIK_0069__']
  ] : [
    ['platform', '__CYOBIK_0061__'],
    ['asset', '__CYOBIK_0058__'],
    ['security', '__CYOBIK_0055__'],
    ['risk', '__CYOBIK_0056__'],
    ['integrations', '__CYOBIK_0074__']
  ];

  const renderLink = ([key, label]) => `<a href="${pages[key][idx]}"${key === page ? ' aria-current="page"' : ''}>${label}</a>`;
  const renderDropdown = (id, label, items) => {
    const active = items.some(([key]) => key === page);
    return `<div class="nav-dropdown" data-nav-dropdown><button class="nav-dropdown-trigger" type="button" aria-expanded="false" aria-controls="${id}"${active ? ' aria-current="page"' : ''}>${label}<span class="nav-chevron" aria-hidden="true">▾</span></button><div class="dropdown-menu" id="${id}">${items.map(renderLink).join('')}</div></div>`;
  };

  const navHtml = [
    renderDropdown('platformMenu', '__CYOBIK_0078__', platformItems),
    renderLink(['deployment', isTr ? '__CYOBIK_0083__' : '__CYOBIK_0076__']),
    renderLink(['editions', isTr ? '__CYOBIK_0080__' : '__CYOBIK_0079__']),
    renderLink(['company', isTr ? '__CYOBIK_0077__' : '__CYOBIK_0084__'])
  ].join('');

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="nav-shell"><div class="wrap nav"><a class="brand" href="./" aria-label="Cyobik home"><span class="mark">◇</span>Cyobik</a><nav class="links" id="navLinks" aria-label="${isTr ? '__CYOBIK_0071__' : '__CYOBIK_0060__'}">${navHtml}</nav><div class="nav-actions"><button class="theme" id="themeBtn" type="button" aria-label="${isTr ? '__CYOBIK_0050__' : '__CYOBIK_0057__'}">◐</button><a class="btn language-switch notranslate" id="languageSwitch" href="${switchHref}" hreflang="${other}" lang="${other}" translate="no" aria-label="${isTr ? '__CYOBIK_0063__' : '__CYOBIK_0062__'}"><span class="notranslate" translate="no">${isTr ? 'EN' : 'TR'}</span></a><button class="menu" id="menuBtn" type="button" aria-label="${isTr ? '__CYOBIK_0072__' : '__CYOBIK_0068__'}" aria-expanded="false">☰</button><a class="btn primary" href="${pages.demo[idx]}">${isTr ? '__CYOBIK_0067__' : '__CYOBIK_0070__'}</a></div></div></header>`;
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

  if (page === 'home') {
    const hero = document.querySelector('main > .hero');
    const heroTitle = hero?.querySelector('h1');
    const heroLead = hero?.querySelector('.lead');
    const proofline = hero?.querySelector('.proofline');

    if (heroTitle) {
      heroTitle.textContent = isTr
        ? '__CYOBIK_0025__'
        : '__CYOBIK_0028__';
    }
    if (heroLead) {
      heroLead.textContent = isTr
        ? '__CYOBIK_0002__'
        : '__CYOBIK_0004__';
    }
    if (proofline) {
      proofline.innerHTML = isTr
        ? '<span>__CYOBIK_0075__</span><span>__CYOBIK_0047__</span><span>__CYOBIK_0044__</span><span>__CYOBIK_0039__</span>'
        : '<span>__CYOBIK_0073__</span><span>__CYOBIK_0042__</span><span>__CYOBIK_0065__</span><span>__CYOBIK_0040__</span>';
    }

    document.querySelector('main > .strip')?.remove();

    if (hero && !document.querySelector('[data-risk-context]')) {
      const section = document.createElement('section');
      section.className = 'section alt risk-context';
      section.dataset.riskContext = 'true';
      section.innerHTML = isTr ? `
        <div class="wrap">
          <div class="section-head">
            <div class="eyebrow">__CYOBIK_0035__</div>
            <h2>__CYOBIK_0020__</h2>
            <p class="lead2">__CYOBIK_0008__</p>
          </div>
          <div class="grid-3">
            <article class="card"><h3>__CYOBIK_0049__</h3><p>__CYOBIK_0005__</p></article>
            <article class="card"><h3>__CYOBIK_0046__</h3><p>__CYOBIK_0003__</p></article>
            <article class="card"><h3>__CYOBIK_0066__</h3><p>__CYOBIK_0015__</p></article>
          </div>
          <div class="callout regulated-callout">
            <div class="eyebrow">__CYOBIK_0033__</div>
            <h2 style="margin-top:12px">__CYOBIK_0023__</h2>
            <p>__CYOBIK_0001__</p>
            <div class="grid-3" style="margin-top:24px">
              <article class="card"><h3>__CYOBIK_0036__</h3><p>__CYOBIK_0014__</p></article>
              <article class="card"><h3>__CYOBIK_0045__</h3><p>__CYOBIK_0017__</p></article>
              <article class="card"><h3>__CYOBIK_0043__</h3><p>__CYOBIK_0006__</p></article>
            </div>
          </div>
        </div>` : `
        <div class="wrap">
          <div class="section-head">
            <div class="eyebrow">__CYOBIK_0048__</div>
            <h2>__CYOBIK_0022__</h2>
            <p class="lead2">__CYOBIK_0007__</p>
          </div>
          <div class="grid-3">
            <article class="card"><h3>__CYOBIK_0041__</h3><p>__CYOBIK_0010__</p></article>
            <article class="card"><h3>__CYOBIK_0052__</h3><p>__CYOBIK_0012__</p></article>
            <article class="card"><h3>__CYOBIK_0064__</h3><p>__CYOBIK_0011__</p></article>
          </div>
          <div class="callout regulated-callout">
            <div class="eyebrow">__CYOBIK_0032__</div>
            <h2 style="margin-top:12px">__CYOBIK_0026__</h2>
            <p>__CYOBIK_0000__</p>
            <div class="grid-3" style="margin-top:24px">
              <article class="card"><h3>__CYOBIK_0034__</h3><p>__CYOBIK_0009__</p></article>
              <article class="card"><h3>__CYOBIK_0037__</h3><p>__CYOBIK_0016__</p></article>
              <article class="card"><h3>__CYOBIK_0038__</h3><p>__CYOBIK_0013__</p></article>
            </div>
          </div>
        </div>`;
      hero.insertAdjacentElement('afterend', section);
    }

    const flow = document.querySelector('.flow');
    const flowEyebrow = flow?.closest('.section')?.querySelector('.section-head .eyebrow');
    if (flowEyebrow) {
      flowEyebrow.textContent = isTr
        ? '__CYOBIK_0029__'
        : '__CYOBIK_0031__';
    }
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `<footer><div class="wrap"><div class="footer-grid"><div><a class="brand" href="./"><span class="mark">◇</span>Cyobik</a><p class="small" style="margin-top:12px;max-width:430px">${isTr ? '__CYOBIK_0024__' : '__CYOBIK_0021__'}</p><p class="small" style="margin-top:14px;max-width:520px">${isTr ? '__CYOBIK_0018__' : '__CYOBIK_0019__'}</p><a class="small" style="display:inline-block;margin-top:6px" href="mailto:info@veksacore.com">info@veksacore.com</a></div><div><h4>__CYOBIK_0081__</h4><a href="${pages.asset[idx]}">${isTr ? 'Varlık İstihbaratı' : 'Asset Intelligence'}</a><a href="${pages.security[idx]}">${isTr ? 'Güvenlik ve Maruziyet' : 'Security & Exposure'}</a><a href="${pages.risk[idx]}">${isTr ? 'Risk Önceliklendirme' : 'Risk Prioritisation'}</a><a href="${pages.integrations[idx]}">${isTr ? 'Entegrasyonlar' : 'Integrations'}</a></div><div><h4>${isTr ? '__CYOBIK_0082__' : '__CYOBIK_0085__'}</h4><a href="${pages.deployment[idx]}">${isTr ? 'Dağıtım' : 'Deployment'}</a><a href="${pages.editions[idx]}">${isTr ? 'Sürümler ve Lisanslama' : 'Editions & Licensing'}</a><a href="${pages.company[idx]}">${isTr ? 'Cyobik Hakkında' : 'About Cyobik'}</a><a href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a><a href="${pages.privacy[idx]}">${isTr ? 'KVKK Aydınlatma Metni' : 'Privacy Notice'}</a><a href="${pages.terms[idx]}">${isTr ? 'Kullanım Koşulları' : 'Terms of Use'}</a></div></div><div class="legal"><span>© <span data-year></span> Cyobik.</span><span>${isTr ? '__CYOBIK_0030__' : '__CYOBIK_0027__'}</span></div></div></footer>`;
  }
})();
