const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

export function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    }),
    { headers: HEADERS },
  );
}
