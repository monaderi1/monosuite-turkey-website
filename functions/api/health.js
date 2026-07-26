const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function onRequestGet({ env }) {
  const turnstileRequired = String(env.REQUIRE_TURNSTILE || "").toLowerCase() === "true";

  return new Response(JSON.stringify({
    ok: true,
    route: "/api/health",
    recipient: "m***@hotmail.com",
    emailConfiguration: {
      accountIdConfigured: Boolean(env.CF_ACCOUNT_ID),
      apiTokenConfigured: Boolean(env.CF_EMAIL_API_TOKEN),
      fromEmailConfigured: Boolean(env.LEAD_FROM_EMAIL),
    },
    turnstile: {
      siteKeyConfigured: Boolean(env.TURNSTILE_SITE_KEY),
      secretKeyConfigured: Boolean(env.TURNSTILE_SECRET_KEY),
      required: turnstileRequired,
    },
    rateLimitBindingConfigured: Boolean(env.LEAD_RATE_LIMIT),
  }, null, 2), {
    status: 200,
    headers: JSON_HEADERS,
  });
}
