// SorareFutScout — búsqueda pública de futbolistas en Sorare.
// Operación GraphQL fija y acotada; sin contraseñas ni tokens personales.
const ENDPOINT = "https://api.sorare.com/federation/graphql";
const SEARCH_QUERY = [
  "query SorareFutScoutSearch($query: String!, $page: Int!, $pageSize: Int!) {",
  " searchPlayers(query: $query, page: $page, pageSize: $pageSize) {",
  "   nbHits nbPages page",
  "   hits { anyPlayer { __typename ... on Player {",
  "     slug displayName position activeClub { name }",
  '  avatar: pictureUrl(derivative: "avatar")',
  "     l5: averageScore(type: LAST_FIVE_SO5_AVERAGE_SCORE)",
  "     l10: averageScore(type: LAST_TEN_PLAYED_SO5_AVERAGE_SCORE)",
  "     l15: averageScore(type: LAST_FIFTEEN_SO5_AVERAGE_SCORE)",
  "   } } }",
  " }",
  "}"
].join("\n");
const SEARCH_QUERY_WITHOUT_PHOTO = SEARCH_QUERY.replace('avatar: pictureUrl(derivative: "avatar")', "");
// Sorare sends Retry-After on HTTP 429. Accept seconds or a HTTP-date.
function retrySeconds(header) {
  const n = Number(header);
  if (Number.isFinite(n) && n >= 0) return Math.min(3600, Math.max(1, Math.ceil(n)));
  const deadline = header ? Date.parse(header) : NaN;
  if (Number.isFinite(deadline)) return Math.min(3600, Math.max(1, Math.ceil((deadline - Date.now()) / 1000)));
  return 60;
}


function respond(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").trim().replace(/\s+/g, " ");
  const rawPage = url.searchParams.get("page") ?? "1";
  const page = Number(rawPage);

  if (q.length < 2 || q.length > 60 || !/^[\p{L}\p{M}\p{N}\s.'’-]+$/u.test(q)) {
    return respond({ ok: false, error: "Escribe un nombre de al menos 2 letras (máximo 60)." }, 400);
  }
  if (!/^\d{1,2}$/.test(rawPage) || !Number.isInteger(page) || page < 1 || page > 20) {
    return respond({ ok: false, error: "Página de búsqueda no válida." }, 400);
  }

  const cacheKey = new Request(url.origin + "/api/search?v=3&q=" + encodeURIComponent(q.toLowerCase()) + "&page=" + page);
  // One cooldown per Cloudflare data center when Sorare asks us to slow down.
  const cooldownKey = new Request(url.origin + "/api/search?__cooldown=v3");
  let cache;
  try {
    cache = caches.default;
    const previous = await cache.match(cacheKey);
    if (previous) return previous;
    const cooldown = await cache.match(cooldownKey);
    if (cooldown) return cooldown;
  } catch (_) { /* No cache available in local development. */ }

  let upstream;
  try {
    const headers = { "content-type": "application/json", accept: "application/json" };
    if (context.env?.SORARE_API_KEY) headers.APIKEY = context.env.SORARE_API_KEY;
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operationName: "SorareFutScoutSearch",
        query: SEARCH_QUERY,
        variables: { query: q, page, pageSize: 12 },
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch (_) {
    return respond({ ok: false, error: "No hemos podido contactar con Sorare." }, 502);
  }

  if (upstream.status === 429) {
    const seconds = retrySeconds(upstream.headers.get("retry-after"));
    const limited = respond({
      ok: false,
      error: "Sorare ha limitado temporalmente las búsquedas.",
      retryAfter: seconds,
    }, 429, {
      "retry-after": String(seconds),
      "cache-control": "public, max-age=0, s-maxage=" + seconds,
    });
    if (cache && context.waitUntil) {
      context.waitUntil(cache.put(cooldownKey, limited.clone()).catch(() => {}));
    }
    return limited;
  }
  if (!upstream.ok) {
    return respond({ ok: false, error: "Sorare no ha respondido correctamente.", upstreamStatus: upstream.status }, 502);
  }

  let data;
  try { data = await upstream.json(); }
  catch (_) { return respond({ ok: false, error: "Respuesta ilegible de Sorare." }, 502); }
  // If Sorare changes/restricts the optional portrait field, retry without it.
  // Player search and statistics must stay available even if images disappear.
  if (data.errors?.some(error => /pictureUrl|derivative/i.test(String(error?.message || "")))) {
    try {
      const fallbackHeaders = { "content-type": "application/json", accept: "application/json" };
      if (context.env?.SORARE_API_KEY) fallbackHeaders.APIKEY = context.env.SORARE_API_KEY;
      const fallbackResponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: fallbackHeaders,
        body: JSON.stringify({
          operationName: "SorareFutScoutSearch",
          query: SEARCH_QUERY_WITHOUT_PHOTO,
          variables: { query: q, page, pageSize: 12 },
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (fallbackResponse.ok) data = await fallbackResponse.json();
    } catch (_) { /* Keep original error if fallback also fails. */ }
  }
  if (data.errors?.length) {
    return respond({
      ok: false,
      error: "La API de Sorare ha rechazado la búsqueda.",
      detail: String(data.errors[0]?.message || "").slice(0, 220),
    }, 502);
  }

  const result = data.data?.searchPlayers;
  if (!result || !Array.isArray(result.hits)) {
    return respond({ ok: false, error: "Sorare ha devuelto un formato de búsqueda inesperado." }, 502);
  }

  const unique = new Set();
  const players = result.hits.map(item => item?.anyPlayer)
    .filter(p => p?.__typename === "Player" && typeof p.slug === "string")
    .filter(p => { if (unique.has(p.slug)) return false; unique.add(p.slug); return true; })
    .map(p => ({
      slug: p.slug,
      name: p.displayName,
      club: p.activeClub?.name || "Sin club",
      position: p.position || "UNKNOWN",
      l5: typeof p.l5 === "number" ? p.l5 : null,
      l10: typeof p.l10 === "number" ? p.l10 : null,
      l15: typeof p.l15 === "number" ? p.l15 : null,
      avatar: typeof p.avatar === "string" && /^https:\/\//i.test(p.avatar) ? p.avatar : null,
    }));

  const response = respond({
    ok: true,
    source: "Sorare GraphQL API",
    fetchedAt: new Date().toISOString(),
    query: q,
    page: Number.isInteger(result.page) ? result.page : page,
    nbHits: result.nbHits || 0,
    nbPages: result.nbPages || 0,
    players,
  }, 200, { "cache-control": "public, max-age=60, s-maxage=900" });

  if (cache && context.waitUntil) context.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  return response;
}
