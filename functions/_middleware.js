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

const NON_PUBLIC_PREFIXES = [
  "/.github",
  "/.git",
  "/archive",
  "/concepts",
  "/content",
  "/functions",
  "/scripts",
  "/site",
  "/tests",
];

const NON_PUBLIC_FILES = new Set([
  "/.gitignore",
  "/.nojekyll",
  "/readme.md",
  "/package.json",
  "/package-lock.json",
  "/deploy-trigger.txt",
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

function normalisePath(pathname) {
  let value = pathname;
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the original encoded path if decoding fails.
  }
  return value.replace(/\/{2,}/g, "/").toLowerCase();
}

export function isNonPublicPath(pathname) {
  const path = normalisePath(pathname);
  if (NON_PUBLIC_FILES.has(path)) return true;
  return NON_PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function notFound() {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Cloudflare Pages currently publishes from the repository root. Deny
  // repository-only source, governance and build paths before static assets
  // are served so internal files cannot become public by direct URL.
  if (isNonPublicPath(url.pathname)) {
    return notFound();
  }

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
