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

  const renderLink = ([key, label]) => `<a href="${pages[key][idx]}"${key === page ? ' aria-current="page"' : ''}>${label}</a>`;
  const renderDropdown = (id, label, items) => {
    const active = items.some(([key]) => key === page);
    return `<div class="nav-dropdown" data-nav-dropdown><button class="nav-dropdown-trigger" type="button" aria-expanded="false" aria-controls="${id}"${active ? ' aria-current="page"' : ''}>${label}<span class="nav-chevron" aria-hidden="true">▾</span></button><div class="dropdown-menu" id="${id}">${items.map(renderLink).join('')}</div></div>`;
  };

  const navHtml = [
    renderDropdown('platformMenu', 'Platform', platformItems),
    renderLink(['deployment', isTr ? 'Dağıtım' : 'Deployment']),
    renderLink(['editions', isTr ? 'Sürümler' : 'Editions']),
    renderLink(['company', isTr ? 'Hakkımızda' : 'Company'])
  ].join('');

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<header class="nav-shell"><div class="wrap nav"><a class="brand" href="./" aria-label="Cyobik home"><span class="mark">◇</span>Cyobik</a><nav class="links" id="navLinks" aria-label="${isTr ? 'Ana navigasyon' : 'Primary navigation'}">${navHtml}</nav><div class="nav-actions"><button class="theme" id="themeBtn" type="button" aria-label="${isTr ? 'Renk temasını değiştir' : 'Toggle colour theme'}">◐</button><a class="btn language-switch notranslate" id="languageSwitch" href="${switchHref}" hreflang="${other}" lang="${other}" translate="no" aria-label="${isTr ? 'Switch to English' : 'Türkçe sürüme geç'}"><span class="notranslate" translate="no">${isTr ? 'EN' : 'TR'}</span></a><button class="menu" id="menuBtn" type="button" aria-label="${isTr ? 'Navigasyonu aç' : 'Open navigation'}" aria-expanded="false">☰</button><a class="btn primary" href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a></div></div></header>`;
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
        ? 'Yeni bir risk oluşturmadan siber risklerinizi keşfedin.'
        : 'Discover cyber risk without creating a new one.';
    }
    if (heroLead) {
      heroLead.textContent = isTr
        ? 'Cyobik; hassas envanter, güvenlik açığı ve yapılandırma verilerinizi harici bir bulut platformuna göndermeden, siber güvenlik ve BT ekiplerinin ihtiyaç duyduğu siber varlık istihbaratını sunar. Platformu özel bulut ortamınızda veya internet bağlantısı olmayan tamamen izole ağlarda çalıştırabilirsiniz.'
        : 'Cyobik gives security and IT teams the cyber asset intelligence they need without sending sensitive inventory, vulnerability and configuration data to an external cloud platform. Run it inside your private cloud or fully air-gapped environment.';
    }
    if (proofline) {
      proofline.innerHTML = isTr
        ? '<span>Özel Bulut</span><span>Tamamen İzole Ortamlarda Çalışma</span><span>Çevrimdışı Güncelleme</span><span>Verilerin Kurum İçinde İşlenmesi</span>'
        : '<span>Private cloud</span><span>Fully air-gapped operation</span><span>Offline updates</span><span>Customer-controlled processing</span>';
    }

    document.querySelector('main > .strip')?.remove();

    if (hero && !document.querySelector('[data-risk-context]')) {
      const section = document.createElement('section');
      section.className = 'section alt risk-context';
      section.dataset.riskContext = 'true';
      section.innerHTML = isTr ? `
        <div class="wrap">
          <div class="section-head">
            <div class="eyebrow">VERİ KONTROLÜ TASARIMIN TEMELİNDE</div>
            <h2>Riskleri görünür hale getirirken yeni güvenlik riskleri oluşturmayın.</h2>
            <p class="lead2">Siber varlık verileri yalnızca bir envanterden ibaret değildir. Kullandığınız teknolojiler, sistem yapılandırmaları, güvenlik açıkları, varlıklar arasındaki ilişkiler ve kritik iş bağımlılıkları hakkında önemli bilgiler içerir. Cyobik, tüm bu bilgilerin kontrolünüzdeki ortamda kalmasını sağlar.</p>
          </div>
          <div class="grid-3">
            <article class="card"><h3>Merkezileştirilmiş Veri Riski</h3><p>Varlık ve güvenlik açığı verilerinin kurum dışındaki bir platformda toplanması, üçüncü taraf sistemlerde yaşanabilecek bir güvenlik ihlalinin etkisini artırabilir ve BT altyapınızın yapısına ilişkin hassas bilgilerin açığa çıkmasına neden olabilir.</p></article>
            <article class="card"><h3>Üçüncü Taraf Kaynaklı Riskler</h3><p>Bulut tabanlı bir keşif platformu; yeni kullanıcı hesapları, API bağlantıları, entegrasyonlar ve veri akışları oluşturabilir. Bu bileşenlerin her biri saldırı yüzeyinizi genişletebilir ve üçüncü taraflardan kaynaklanan güvenlik risklerini artırabilir.</p></article>
            <article class="card"><h3>Veri Kontrolü ve Uyumluluk</h3><p>Hassas varlık, güvenlik açığı ve yapılandırma verilerinin kurumun kontrolündeki ortamın dışına çıkarılması; verinin nerede tutulduğu, nasıl yönetildiği ve nasıl denetlendiği konusunda ek güvenlik ve uyumluluk gereksinimleri doğurabilir.</p></article>
          </div>
          <div class="callout regulated-callout">
            <div class="eyebrow">Yasal Düzenlemelere Tabi ve Hassas Ortamlar İçin</div>
            <h2 style="margin-top:12px">Saldırı yüzeyiniz, başkasının tutacağı bir veri değildir.</h2>
            <p>Cyobik; bankaların, kamu kurumlarının ve kritik altyapı kuruluşlarının siber varlıklarına ait hassas verileri tamamen kendi kontrollerinde tutmasını sağlar. Özel bulutlardan internet bağlantısı olmayan tamamen izole ağlara kadar tüm veriler, güvenlik değerlendirmeleri, skorlamalar ve risk analizleri kurumun kendi altyapısında işlenir ve kurum dışına çıkmaz.</p>
            <div class="grid-3" style="margin-top:24px">
              <article class="card"><h3>Hassas Verileri Kurum İçinde Tutun</h3><p>Varlık, güvenlik açığı, yapılandırma ve bağlantı verilerini harici bir analiz platformuna aktarmadan, kurumunuzun kontrolündeki ortamda yönetin.</p></article>
              <article class="card"><h3>İzole Ortamlarda Kesintisiz Çalışın</h3><p>İnternet erişiminin kısıtlı veya tamamen kapalı olduğu ortamlarda dahi varlık görünürlüğünü, güvenlik değerlendirmelerini ve risk analizlerini kesintisiz sürdürün.</p></article>
              <article class="card"><h3>Veri İşleme Süreçlerinin Kontrolü Sizde Kalsın</h3><p>Veri toplama, ilişkilendirme, skorlama ve analiz süreçlerini verinin bulunduğu ortamda gerçekleştirin. Hassas verileri kurum dışına taşımadan, tüm süreçleri kurumunuzun güvenlik politikalarına uygun şekilde kendi altyapınızda yönetin.</p></article>
            </div>
          </div>
        </div>` : `
        <div class="wrap">
          <div class="section-head">
            <div class="eyebrow">DATA CONTROL AT THE CORE OF THE DESIGN</div>
            <h2>Make risks visible without creating new security risks.</h2>
            <p class="lead2">Cyber asset data is more than an inventory. It can reveal technologies, configurations, vulnerabilities, relationships and critical business dependencies. Cyobik keeps this intelligence inside the environment you control.</p>
          </div>
          <div class="grid-3">
            <article class="card"><h3>Centralised data risk</h3><p>Centralising asset and vulnerability intelligence outside the organisation can increase the impact of a third-party compromise and reveal how your environment is structured.</p></article>
            <article class="card"><h3>Third-party risks</h3><p>A cloud-based discovery platform adds identities, APIs, integrations and data flows. Each becomes part of your external attack surface and supply-chain risk.</p></article>
            <article class="card"><h3>Data control and compliance</h3><p>Moving sensitive asset, vulnerability and configuration data outside the controlled environment can introduce additional residency, governance and oversight requirements.</p></article>
          </div>
          <div class="callout regulated-callout">
            <div class="eyebrow">For regulated and sensitive environments</div>
            <h2 style="margin-top:12px">Your attack surface is not someone else’s data to hold.</h2>
            <p>Cyobik helps banks, government organisations and critical infrastructure operators keep cyber asset intelligence inside the environment they control, including private and fully air-gapped networks. Asset data, security evidence, scoring and risk analysis remain within the organisation’s controlled infrastructure.</p>
            <div class="grid-3" style="margin-top:24px">
              <article class="card"><h3>Keep sensitive data inside your organisation</h3><p>Maintain asset, vulnerability, configuration and relationship data inside the organisation’s controlled environment rather than transferring it to an external analytics platform.</p></article>
              <article class="card"><h3>Operate continuously in isolated environments</h3><p>Continue visibility, security assessment and risk analysis where permanent external connectivity is restricted or prohibited.</p></article>
              <article class="card"><h3>Maintain control over processing</h3><p>Keep collection, correlation, scoring and analysis close to the systems and data they describe, aligned with organisational security requirements.</p></article>
            </div>
          </div>
        </div>`;
      hero.insertAdjacentElement('afterend', section);
    }

    const flow = document.querySelector('.flow');
    const flowEyebrow = flow?.closest('.section')?.querySelector('.section-head .eyebrow');
    if (flowEyebrow) {
      flowEyebrow.textContent = isTr
        ? 'SİBER VARLIK YÖNETİMİ İÇİN TEK VE GÜVENİLİR BİLGİ KAYNAĞI'
        : 'ONE TRUSTED SOURCE FOR CYBER-ASSET MANAGEMENT';
    }
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `<footer><div class="wrap"><div class="footer-grid"><div><a class="brand" href="./"><span class="mark">◇</span>Cyobik</a><p class="small" style="margin-top:12px;max-width:430px">${isTr ? 'Kurumsal CAASM ve kanıta dayalı siber varlık istihbaratı.' : 'Enterprise CAASM and evidence-driven cyber asset intelligence.'}</p><p class="small" style="margin-top:14px;max-width:520px">${isTr ? 'Cyobik, Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti. tarafından işletilmektedir.' : 'Cyobik is operated by Veksacore Bilişim ve Siber Güvenlik Teknolojileri Ltd. Şti.'}</p><a class="small" style="display:inline-block;margin-top:6px" href="mailto:info@veksacore.com">info@veksacore.com</a></div><div><h4>Platform</h4><a href="${pages.asset[idx]}">${isTr ? 'Varlık İstihbaratı' : 'Asset Intelligence'}</a><a href="${pages.security[idx]}">${isTr ? 'Güvenlik ve Maruziyet' : 'Security & Exposure'}</a><a href="${pages.risk[idx]}">${isTr ? 'Risk Önceliklendirme' : 'Risk Prioritisation'}</a><a href="${pages.integrations[idx]}">${isTr ? 'Entegrasyonlar' : 'Integrations'}</a></div><div><h4>${isTr ? 'Kurumsal' : 'Company'}</h4><a href="${pages.deployment[idx]}">${isTr ? 'Dağıtım' : 'Deployment'}</a><a href="${pages.editions[idx]}">${isTr ? 'Sürümler ve Lisanslama' : 'Editions & Licensing'}</a><a href="${pages.company[idx]}">${isTr ? 'Cyobik Hakkında' : 'About Cyobik'}</a><a href="${pages.demo[idx]}">${isTr ? 'Demo Talep Edin' : 'Request a demo'}</a><a href="${pages.privacy[idx]}">${isTr ? 'KVKK Aydınlatma Metni' : 'Privacy Notice'}</a><a href="${pages.terms[idx]}">${isTr ? 'Kullanım Koşulları' : 'Terms of Use'}</a></div></div><div class="legal"><span>© <span data-year></span> Cyobik.</span><span>${isTr ? 'Müşteri denetimindeki kurumsal ortamlar için.' : 'Built for customer-controlled enterprise environments.'}</span></div></div></footer>`;
  }
})();
