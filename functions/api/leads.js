const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const LEAD_TO_EMAIL = "info@veksacore.com";
const MAX_REQUEST_BYTES = 16_384;
const EVALUATION_INTERESTS = {
  "asset-discovery-visibility": "Asset Discovery & Visibility",
  "cyber-asset-intelligence": "Cyber Asset Intelligence",
  "risk-exposure": "Risk & Exposure",
  "compliance-assessment": "Compliance Assessment",
  "splunk-integration": "Splunk Integration",
  "other": "Other",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clean(value, maxLength) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  return String(value ?? "").trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

async function hashIp(ip) {
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function enforceRateLimit(env, request) {
  if (!env.LEAD_RATE_LIMIT) return true;

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `lead:${await hashIp(ip)}`;
  const current = Number(await env.LEAD_RATE_LIMIT.get(key) || "0");

  if (current >= 5) return false;

  await env.LEAD_RATE_LIMIT.put(key, String(current + 1), {
    expirationTtl: 3600,
  });
  return true;
}

async function validateTurnstile(env, token, request) {
  const required = String(env.REQUIRE_TURNSTILE || "").toLowerCase() === "true";

  if (!env.TURNSTILE_SECRET_KEY) {
    return { success: !required, misconfigured: required };
  }
  if (!token) return { success: false };

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || undefined,
        idempotency_key: crypto.randomUUID(),
      }),
    },
  );

  if (!response.ok) return { success: false };
  return response.json();
}

async function sendLeadEmail(env, lead) {
  const required = [
    "CF_ACCOUNT_ID",
    "CF_EMAIL_API_TOKEN",
    "LEAD_FROM_EMAIL",
  ];

  const missing = required.filter(key => !env[key]);
  if (missing.length) {
    console.error(`Lead email configuration missing: ${missing.join(", ")}`);
    throw new Error("Lead email delivery is not configured.");
  }

  const subject = `[Cyobik demo request] ${lead.company} — ${lead.fullName}`;
  const lines = [
    `Name: ${lead.fullName}`,
    `Work email: ${lead.workEmail}`,
    `Company: ${lead.company}`,
    `Country: ${lead.country}`,
    `Evaluation interest: ${lead.evaluationInterestLabel}`,
    `Job title: ${lead.jobTitle || "Not provided"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Marketing consent: ${lead.marketingConsent ? "Yes" : "No"}`,
    `Privacy notice version: ${lead.privacyNoticeVersion}`,
    `Locale: ${lead.locale}`,
    `Source: ${lead.source}`,
    `Submitted at: ${lead.submittedAt}`,
    "",
    "Additional details:",
    lead.message || "Not provided",
  ];

  const html = `
    <h2>New Cyobik demo request</h2>
    <table cellpadding="7" cellspacing="0" border="0">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(lead.fullName)}</td></tr>
      <tr><td><strong>Work email</strong></td><td>${escapeHtml(lead.workEmail)}</td></tr>
      <tr><td><strong>Company</strong></td><td>${escapeHtml(lead.company)}</td></tr>
      <tr><td><strong>Country</strong></td><td>${escapeHtml(lead.country)}</td></tr>
      <tr><td><strong>Evaluation interest</strong></td><td>${escapeHtml(lead.evaluationInterestLabel)}</td></tr>
      <tr><td><strong>Job title</strong></td><td>${escapeHtml(lead.jobTitle || "Not provided")}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(lead.phone || "Not provided")}</td></tr>
      <tr><td><strong>Marketing consent</strong></td><td>${lead.marketingConsent ? "Yes" : "No"}</td></tr>
      <tr><td><strong>Privacy notice version</strong></td><td>${escapeHtml(lead.privacyNoticeVersion)}</td></tr>
      <tr><td><strong>Locale</strong></td><td>${escapeHtml(lead.locale)}</td></tr>
      <tr><td><strong>Source</strong></td><td>${escapeHtml(lead.source)}</td></tr>
      <tr><td><strong>Submitted at</strong></td><td>${escapeHtml(lead.submittedAt)}</td></tr>
    </table>
    <h3>Additional details</h3>
    <p>${escapeHtml(lead.message || "Not provided").replace(/\n/g, "<br>")}</p>
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_EMAIL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: LEAD_TO_EMAIL,
        from: env.LEAD_FROM_EMAIL,
        reply_to: lead.workEmail,
        subject,
        text: lines.join("\n"),
        html,
      }),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    console.error("Lead email delivery failed", response.status, result.errors || []);
    throw new Error("Lead email delivery failed.");
  }

  return result;
}

export async function onRequestPost({ request, env }) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigins = new Set([
      requestUrl.origin,
      "https://cyobik.com",
      "https://www.cyobik.com",
    ]);

    if (!origin || !allowedOrigins.has(origin)) {
      return json({ error: "Invalid request origin." }, 403);
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json({ error: "Unsupported request format." }, 415);
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > MAX_REQUEST_BYTES) {
      return json({ error: "Request payload is too large." }, 413);
    }

    if (!(await enforceRateLimit(env, request))) {
      return json({ error: "Too many requests. Please try again later." }, 429);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return json({ error: "Request payload is too large." }, 413);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Malformed JSON request." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Invalid request body." }, 400);
    }

    if (clean(body.website, 200)) {
      return json({ success: true }, 202);
    }

    const evaluationInterest = clean(body.evaluationInterest, 80);
    const locale = clean(body.locale, 10).toLowerCase();

    const lead = {
      fullName: clean(body.fullName, 120),
      workEmail: clean(body.workEmail, 180).toLowerCase(),
      company: clean(body.company, 160),
      country: clean(body.country, 80),
      evaluationInterest,
      evaluationInterestLabel: EVALUATION_INTERESTS[evaluationInterest] || "",
      jobTitle: clean(body.jobTitle, 120),
      phone: clean(body.phone, 40),
      message: cleanMultiline(body.message, 1200),
      source: clean(body.source, 80) || "website-demo-form",
      locale: locale === "tr" ? "tr" : "en",
      privacyNoticeVersion: clean(body.privacyNoticeVersion, 80),
      marketingConsent: body.marketingConsent === true,
      submittedAt: new Date().toISOString(),
    };

    if (
      !lead.fullName ||
      !lead.workEmail ||
      !lead.company ||
      !lead.country ||
      !lead.evaluationInterestLabel ||
      !lead.privacyNoticeVersion
    ) {
      return json({ error: "Please complete all required fields." }, 400);
    }

    if (!validEmail(lead.workEmail)) {
      return json({ error: "Please enter a valid work email address." }, 400);
    }

    const turnstile = await validateTurnstile(
      env,
      clean(body["cf-turnstile-response"], 2048),
      request,
    );

    if (turnstile.misconfigured) {
      console.error("Turnstile is required but TURNSTILE_SECRET_KEY is missing.");
      return json({ error: "Form verification is temporarily unavailable." }, 503);
    }

    if (!turnstile.success) {
      return json({ error: "Human verification failed. Please try again." }, 400);
    }

    await sendLeadEmail(env, lead);
    return json({ success: true }, 201);
  } catch (error) {
    console.error("Lead form processing failed", error?.message || error);
    return json(
      { error: "The request could not be sent. Please try again later." },
      500,
    );
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
