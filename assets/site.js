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

if (pageBody.dataset.page === 'home') {
  const scoreSection = [...document.querySelectorAll('main > .section')].find((section) =>
    section.querySelector('.metric') && section.querySelector('.section-head h2')
  );

  if (scoreSection) {
    const sectionHead = scoreSection.querySelector('.section-head');
    const metrics = [...scoreSection.querySelectorAll('.metric')];
    const illustrativeNote = scoreSection.querySelector('.small');

    const scoreIntro = isTurkish
      ? 'Cyobik, dağınık teknik bulguları üç anlaşılır göstergeye dönüştürür. Görünürlük Skoru ne kadarını bildiğinizi, Koruma Skoru hangi güvenlik ve kontrol kanıtlarının mevcut olduğunu, Risk Skoru ise mevcut bağlamın iş etkisi ve olasılıkla birlikte ne ifade ettiğini gösterir. Her skor, sonucu oluşturan varlık, bulgu ve kanıta kadar incelenebilir.'
      : 'Cyobik turns fragmented technical findings into three clear operating signals. Visibility shows how much of the environment is known, Protection shows which security and control evidence is present, and Risk shows what the maintained context means when business impact and likelihood are considered together. Every score can be traced back to the assets, findings and evidence that produced it.';

    if (sectionHead && !sectionHead.querySelector('[data-score-intro]')) {
      const intro = document.createElement('p');
      intro.className = 'lead2';
      intro.dataset.scoreIntro = 'true';
      intro.textContent = scoreIntro;
      sectionHead.appendChild(intro);
    }

    const scoreDescriptions = isTurkish ? [
      'Varlık bilgisinin ne kadar eksiksiz, güncel ve karar vermeye uygun olduğunu gösterir. Eksik envanter, sahiplik, yazılım, servis, ağ veya ilişki bilgileri skorun altında doğrudan görülebilir.',
      'Varlıklar için hangi güvenlik, zafiyet, maruziyet ve kontrol kanıtlarının mevcut olduğunu gösterir. Amaç yalnızca araç varlığını değil, koruma durumunu destekleyen doğrulanabilir kanıtı görünür kılmaktır.',
      'Varlıkların iş süreçlerine etkisini, güvenlik açıklarını, mevcut koruma eksiklerini ve gerçekleşme olasılığını birlikte değerlendirerek hem varlık hem de kurum genelindeki risk seviyesini ortaya koyar. Skor düştükçe değerlendirilen risk seviyesi de azalır.'
    ] : [
      'Shows how complete, current and decision-ready the asset knowledge is. Missing inventory, ownership, software, service, network or relationship information can be reviewed directly beneath the score.',
      'Shows which security, vulnerability, exposure and control evidence is available for the assets. The focus is not simply whether a tool exists, but whether verifiable evidence supports the current protection posture.',
      'Combines impact, likelihood, exposure, protection gaps and business context to express risk at asset and organisational level. A lower score represents a lower assessed level of risk.'
    ];

    metrics.forEach((metric, index) => {
      const paragraph = metric.querySelector('p');
      if (paragraph && scoreDescriptions[index]) paragraph.textContent = scoreDescriptions[index];
    });

    illustrativeNote?.remove();
  }
}

const flow = document.querySelector('.flow');
if (flow && pageBody.dataset.page === 'home') {
  const flowSteps = isTurkish ? [
    { title: 'Keşfet', heading: 'Ortamınızdaki varlıkları görün', summary: 'Altyapı keşfi, Cyobik Agent ile envanter oluşturma, doğrulanmış veri aktarımı ve manuel varlık ekleme yöntemleriyle ortamınızdaki varlıkları belirleyin.', outcome: 'Çıktı: Yönetilen ve doğrulanabilir bir varlık başlangıç noktası.' },
    { title: 'Bağlamlandır', heading: 'Her varlığa anlam kazandırın', summary: 'Profilleri, yazılımları, servisleri, sahipliği, yaşam döngüsünü, ağları, ilişkileri ve İş Servislerini birleştirin.', outcome: 'Çıktı: Teknik kayıtların iş ve operasyon bağlamıyla zenginleştirilmesi.' },
    { title: 'Görünür Kıl', heading: 'Güvenlik koşullarını ortaya çıkarın', summary: 'Zafiyetleri, iç saldırı yüzeyi koşullarını, koruma kanıtlarını ve kontrol boşluklarını ilgili varlıklarla ilişkilendirin.', outcome: 'Sonuç: Her güvenlik bulgusundan hangi varlık ve servislerin etkilendiğini net bir şekilde görün.' },
    { title: 'Önceliklendir', heading: 'En önemli risklere odaklanın', summary: 'Görünürlük, Koruma ve Risk Skorlarını iş etkisi, olasılık ve ayrıntılı kanıtla birlikte değerlendirin.', outcome: 'Sonuç: İş etkisini dikkate alan, anlaşılır ve gerekçelendirilebilir bir risk önceliklendirmesi.' },
    { title: 'Harekete Geç', heading: 'Kararları operasyonel iş akışına taşıyın', summary: 'ITSM ve talep yönetimi, Splunk, raporlar ve REST API üzerinden iyileştirme çalışmalarını ilerletin.', outcome: 'Sonuç: Önceliklendirilen risklerden alınan aksiyonlara kadar izlenebilir ve yönetilebilir bir süreç.' }
  ] : [
    { title: 'Discover', heading: 'See the assets in your environment', summary: 'Build the asset view through infrastructure discovery, Cyobik Agent inventory, validated import and manual creation.', outcome: 'Outcome: A governed and verifiable asset starting point.' },
    { title: 'Contextualise', heading: 'Give every asset meaning', summary: 'Connect profiles, software, services, ownership, lifecycle, networks, relationships and Business Services.', outcome: 'Outcome: Technical records enriched with business and operational context.' },
    { title: 'Expose', heading: 'Reveal security conditions', summary: 'Relate vulnerabilities, internal attack-surface conditions, protection evidence and control gaps to the assets they affect.', outcome: 'Outcome: A clear view of which assets and services are affected by each finding.' },
    { title: 'Prioritise', heading: 'Focus on the most meaningful risk', summary: 'Review Visibility, Protection and Risk Scores with business impact, likelihood and drill-down evidence.', outcome: 'Outcome: Explainable prioritisation grounded in business context.' },
    { title: 'Act', heading: 'Move decisions into operational workflows', summary: 'Advance remediation through ITSM and ticketing, Splunk, reports and REST API workflows.', outcome: 'Outcome: A traceable path from prioritised context to operational action.' }
  ];

  const flowLabel = isTurkish ? 'Beş aşamalı siber varlık karar akışı' : 'Five-stage cyber-asset decision flow';
  const evidenceLabel = isTurkish ? 'Tek kanıt katmanı' : 'One evidence layer';
  const selectLabel = isTurkish ? 'Aşamayı seçin' : 'Select a stage';

  const style = document.createElement('style');
  style.textContent = `
    .interactive-flow{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(280px,.92fr);gap:clamp(26px,4vw,58px);align-items:center}
    .flow-orbit{position:relative;aspect-ratio:1/1;width:min(100%,620px);margin:auto;min-width:0}
    .flow-orbit-ring{position:absolute;inset:14%;border:1px dashed color-mix(in srgb,var(--brand) 40%,var(--line));border-radius:50%;pointer-events:none}
    .flow-orbit-ring:after{content:'';position:absolute;right:5%;top:18%;width:11px;height:11px;border-top:2px solid var(--brand);border-right:2px solid var(--brand);transform:rotate(35deg)}
    .flow-core{position:absolute;inset:31%;display:grid;place-content:center;text-align:center;padding:clamp(14px,2.4vw,28px);border:1px solid var(--line);border-radius:50%;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
    .flow-core span{font-family:var(--mono);font-size:clamp(8px,1vw,11px);letter-spacing:.1em;text-transform:uppercase;color:var(--brand);overflow-wrap:anywhere}
    .flow-core strong{display:block;margin-top:8px;font-size:clamp(15px,2vw,23px);line-height:1.15;overflow-wrap:anywhere}
    .flow-stage{position:absolute;width:clamp(112px,20%,152px);min-height:76px;padding:12px 10px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--ink);text-align:center;cursor:pointer;box-shadow:0 10px 26px rgba(20,30,55,.07);transition:transform .18s ease,border-color .18s ease,background .18s ease;overflow:hidden}
    .flow-stage:hover,.flow-stage:focus-visible{transform:translateY(-3px);border-color:var(--brand)}
    .flow-stage[aria-pressed='true']{border-color:var(--brand);background:var(--brand-soft)}
    .flow-stage small{display:block;font-family:var(--mono);font-size:10px;color:var(--brand)}
    .flow-stage b{display:block;margin-top:5px;font-size:clamp(12px,1.45vw,16px);line-height:1.2;overflow-wrap:anywhere;word-break:normal;hyphens:auto}
    .flow-stage[data-step='0']{left:50%;top:0;transform:translateX(-50%)}
    .flow-stage[data-step='0']:hover,.flow-stage[data-step='0']:focus-visible{transform:translate(-50%,-3px)}
    .flow-stage[data-step='1']{right:1%;top:28%}
    .flow-stage[data-step='2']{right:13%;bottom:3%}
    .flow-stage[data-step='3']{left:13%;bottom:3%}
    .flow-stage[data-step='4']{left:1%;top:28%}
    .flow-detail{min-width:0;padding:clamp(24px,4vw,40px);border:1px solid var(--line);border-radius:22px;background:var(--surface)}
    .flow-detail-label{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--brand)}
    .flow-detail h3{margin-top:13px;font-size:clamp(25px,3vw,38px);line-height:1.12;overflow-wrap:anywhere}
    .flow-detail p{margin-top:15px;color:var(--muted);font-size:clamp(14px,1.5vw,17px);overflow-wrap:anywhere}
    .flow-outcome{margin-top:22px;padding:15px 17px;border-left:3px solid var(--brand);border-radius:0 12px 12px 0;background:var(--brand-soft);color:var(--ink)!important;font-size:14px!important}
    .flow-mobile-label{display:none}
    @media(max-width:900px){.interactive-flow{grid-template-columns:1fr;gap:30px}.flow-orbit{width:min(100%,580px)}.flow-detail{width:100%}}
    @media(max-width:620px){.flow-mobile-label{display:block;margin-bottom:12px;font-size:12px;color:var(--muted)}.flow-orbit{aspect-ratio:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%}.flow-orbit-ring,.flow-core{display:none}.flow-stage,.flow-stage[data-step]{position:static;width:100%;min-width:0;min-height:64px;transform:none!important;padding:10px 8px}.flow-stage:last-of-type{grid-column:1/-1}.flow-stage b{font-size:13px;white-space:normal;overflow-wrap:anywhere}.flow-detail{padding:24px 20px}}
  `;
  document.head.appendChild(style);

  flow.className = 'interactive-flow';
  flow.setAttribute('aria-label', flowLabel);
  flow.innerHTML = `<div><span class="flow-mobile-label">${selectLabel}</span><div class="flow-orbit"><div class="flow-orbit-ring" aria-hidden="true"></div><div class="flow-core" aria-hidden="true"><span>${evidenceLabel}</span><strong data-flow-core>${flowSteps[0].title}</strong></div>${flowSteps.map((step, index) => `<button class="flow-stage" type="button" data-step="${index}" aria-pressed="${index === 0}"><small>0${index + 1}</small><b>${step.title}</b></button>`).join('')}</div></div><article class="flow-detail" aria-live="polite"><span class="flow-detail-label" data-flow-label>${isTurkish ? 'Aşama 01' : 'Stage 01'}</span><h3 data-flow-heading>${flowSteps[0].heading}</h3><p data-flow-summary>${flowSteps[0].summary}</p><p class="flow-outcome" data-flow-outcome>${flowSteps[0].outcome}</p></article>`;

  const flowButtons = [...flow.querySelectorAll('.flow-stage')];
  const coreTitle = flow.querySelector('[data-flow-core]');
  const detailLabel = flow.querySelector('[data-flow-label]');
  const detailHeading = flow.querySelector('[data-flow-heading]');
  const detailSummary = flow.querySelector('[data-flow-summary]');
  const detailOutcome = flow.querySelector('[data-flow-outcome]');

  flowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.step);
      const step = flowSteps[index];
      flowButtons.forEach((item, itemIndex) => item.setAttribute('aria-pressed', String(itemIndex === index)));
      coreTitle.textContent = step.title;
      detailLabel.textContent = `${isTurkish ? 'Aşama' : 'Stage'} 0${index + 1}`;
      detailHeading.textContent = step.heading;
      detailSummary.textContent = step.summary;
      detailOutcome.textContent = step.outcome;
    });
  });
}
