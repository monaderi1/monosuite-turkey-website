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
  if (!email || !form || !status || !modal) return;

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

  let successHandled = false;
  const observer = new MutationObserver(() => {
    if (successHandled || !status.classList.contains('success')) return;
    successHandled = true;
    observer.disconnect();
    status.textContent = 'Thank you — your request has been received. We’ll contact you shortly.';
    setTimeout(() => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }, 2500);
  });
  observer.observe(status, { childList: true, attributes: true, subtree: true });

  document.querySelectorAll('[data-open-lead]').forEach(button => {
    button.addEventListener('click', () => {
      successHandled = false;
      if (!observer.takeRecords) return;
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
