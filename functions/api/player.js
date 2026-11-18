// SorareFutScout · Public player statistics. No user credentials required.
const API_URL = "https://api.sorare.com/federation/graphql";
// Fixed GraphQL query: users cannot submit arbitrary operations.
const QUERY = "query SorareFutScoutPlayer($slugs: [String!]) { players(slugs: $slugs) { __typename ... on Player { slug displayName position activeClub { name } l5: averageScore(type: LAST_FIVE_SO5_AVERAGE_SCORE) l10: averageScore(type: LAST_TEN_PLAYED_SO5_AVERAGE_SCORE) l15: averageScore(type: LAST_FIFTEEN_SO5_AVERAGE_SCORE) lastScores: rawPlayerGameScores(last: 5) } } }";
const json = (body, status = 200, extras = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", ...extras },
});

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    return json({ ok: false, error: "Indica un slug válido de Sorare en ?slug=..." }, 400);
  }

  // Cache successful public results on the Cloudflare edge to reduce Sorare API usage.
  const key = new Request(url.origin + "/api/player?slug=" + encodeURIComponent(slug));
  let cache;
  try {
    cache = caches.default;
    const cached = await cache.match(key);
    if (cached) return cached;
  } catch (_) { /* Cache API not available; fall back to fetching upstream. */ }

  let upstream;
  try {
    const headers = { "content-type": "application/json", accept: "application/json" };
    if (context.env && context.env.SORARE_API_KEY) headers.APIKEY = context.env.SORARE_API_KEY;
    upstream = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ operationName: "SorareFutScoutPlayer", query: QUERY, variables: { slugs: [slug] } }),
    });
  } catch (_) {
    return json({ ok: false, error: "No se ha podido contactar con Sorare." }, 502);
  }

  if (upstream.status === 429) {
    const retryAfter = upstream.headers.get("retry-after");
    return json({ ok: false, error: "Sorare ha limitado las consultas. Inténtalo más tarde." }, 429,
      retryAfter ? { "retry-after": retryAfter } : {});
  }
  if (!upstream.ok) {
    return json({ ok: false, error: "Sorare no ha respondido correctamente.", upstreamStatus: upstream.status }, 502);
  }

  let result;
  try { result = await upstream.json(); }
  catch (_) { return json({ ok: false, error: "Respuesta de Sorare no válida." }, 502); }

  if (result.errors && result.errors.length) {
    return json({ ok: false, error: "Sorare ha rechazado la consulta.", detail: String(result.errors[0].message || "").slice(0, 240) }, 502);
  }

  const player = (result.data?.players || []).find(p => p && p.__typename === "Player" && p.slug === slug);
  if (!player) return json({ ok: false, error: "No se ha encontrado un futbolista con ese identificador." }, 404);

  const output = json({
    ok: true,
    source: "Sorare GraphQL API",
    fetchedAt: new Date().toISOString(),
    player: {
      slug: player.slug,
      name: player.displayName,
      club: player.activeClub?.name || null,
      position: player.position,
      l5: player.l5, l10: player.l10, l15: player.l15,
      lastScores: player.lastScores || [],
    },
  }, 200, { "cache-control": "public, max-age=60, s-maxage=600" });

  if (cache && context.waitUntil) context.waitUntil(cache.put(key, output.clone()).catch(() => {}));
  return output;
}
