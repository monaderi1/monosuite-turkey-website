const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "zoho.com",
]);

function emailDomain(value) {
  return String(value || "").trim().toLowerCase().split("@")[1] || "";
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const FORM_ENHANCEMENT_SCRIPT = `
<script>
(() => {
  const personalDomains = new Set(${JSON.stringify([...PERSONAL_EMAIL_DOMAINS])});
  const email = document.getElementById('workEmail');
  const form = document.getElementById('leadForm');
  const status = document.getElementById('leadStatus');
  const modal = document.getElementById('leadModal');
  const modalCard = modal && modal.querySelector('.modal-card');
  const modalHead = modal && modal.querySelector('.modal-head');
  const existingClose = document.getElementById('closeLeadModal');
  if (!email || !form || !status || !modal || !modalCard || !modalHead) return;

  const label = document.querySelector('label[for="workEmail"]');
  if (label) label.textContent = 'Business email *';
  if (!document.getElementById('businessEmailHint')) {
    const hint = document.createElement('span');
    hint.id = 'businessEmailHint';
    hint.className = 'small';
    hint.textContent = 'Please use your company email address. Personal email services are not accepted.';
    email.insertAdjacentElement('afterend', hint);
    email.setAttribute('aria-describedby', 'businessEmailHint');
  }

  const isBusinessEmail = value => {
    const domain = String(value || '').trim().toLowerCase().split('@')[1] || '';
    return Boolean(domain) && !personalDomains.has(domain);
  };

  email.addEventListener('input', () => email.setCustomValidity(''));
  form.addEventListener('submit', event => {
    if (isBusinessEmail(email.value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    email.setCustomValidity('Please enter your business email address. Personal email services are not accepted.');
    email.reportValidity();
  }, true);

  const successPanel = document.createElement('section');
  successPanel.id = 'leadSuccessPanel';
  successPanel.setAttribute('role', 'status');
  successPanel.setAttribute('aria-live', 'polite');
  successPanel.hidden = true;
  successPanel.innerHTML = \
    '<div style="text-align:center;padding:34px 12px 18px">' +
      '<div aria-hidden="true" style="width:64px;height:64px;margin:0 auto 20px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok);font-size:32px;font-weight:800">✓</div>' +
      '<div class="eyebrow">Request received</div>' +
      '<h2 style="margin-top:12px">Thank you for contacting Cyobik.</h2>' +
      '<p style="max-width:520px;margin:16px auto 0;color:var(--muted)">Your request has been received successfully. Our team will review the information and contact you shortly.</p>' +
      '<button class="btn primary" id="leadSuccessClose" type="button" style="margin-top:26px;min-width:150px">Close</button>' +
    '</div>';
  modalCard.appendChild(successPanel);

  const restoreFormView = () => {
    modalHead.hidden = false;
    form.hidden = false;
    successPanel.hidden = true;
    status.textContent = '';
    status.className = 'form-status';
  };

  const showSuccessView = () => {
    modalHead.hidden = true;
    form.hidden = true;
    successPanel.hidden = false;
    modalCard.scrollTop = 0;
    const closeButton = document.getElementById('leadSuccessClose');
    if (closeButton) closeButton.focus();
  };

  let successHandled = false;
  new MutationObserver(() => {
    if (successHandled || !status.classList.contains('success')) return;
    successHandled = true;
    showSuccessView();
  }).observe(status, { childList: true, attributes: true, subtree: true });

  successPanel.addEventListener('click', event => {
    if (event.target && event.target.id === 'leadSuccessClose') {
      if (existingClose) existingClose.click();
      else {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
      }
    }
  });

  document.querySelectorAll('[data-open-lead]').forEach(button => {
    button.addEventListener('click', () => {
      successHandled = false;
      restoreFormView();
    });
  });
})();
</script>`;

class BodyInjector {
  element(element) {
    element.append(FORM_ENHANCEMENT_SCRIPT, { html: true });
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/api/leads" && context.request.method === "POST") {
    try {
      const body = await context.request.clone().json();
      const domain = emailDomain(body.workEmail);
      if (domain && PERSONAL_EMAIL_DOMAINS.has(domain)) {
        return json(
          {
            error:
              "Please enter your business email address. Personal email services are not accepted.",
          },
          400,
        );
      }
    } catch {
      // The API handler returns the canonical malformed-request response.
    }
  }

  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) return response;

  return new HTMLRewriter().on("body", new BodyInjector()).transform(response);
}
