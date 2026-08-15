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

  return context.next();
}
