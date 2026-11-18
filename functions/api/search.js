// SorareFutScout — búsqueda pública de futbolistas en Sorare.
// Operación GraphQL fija y acotada; sin contraseñas ni tokens personales.
const ENDPOINT = "https://api.sorare.com/federation/graphql";
const SEARCH_QUERY = [
  "query SorareFutScoutSearch($query: String!, $page: Int!, $pageSize: Int!) {",
  " searchPlayers(query: $query, page: $page, pageSize: $pageSize) {",
  "   nbHits nbPages page",
  "   hits { anyPlayer { __typename ... on Player {",
  "     slug displayName position activeClub { name }",
  "     l5: averageScore(type: LAST_FIVE_SO5_AVERAGE_SCORE)",
  "   } } }",
  " }",
  "}"
].join("\n");

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
  const rawPage = url.searchParams.get("page") ?? "0";
  const page = Number(rawPage);

  if (q.length < 2 || q.length > 60 || !/^[\p{L}\p{M}\p{N}\s.'’-]+$/u.test(q)) {
    return respond({ ok: false, error: "Escribe un nombre de al menos 2 letras (máximo 60)." }, 400);
  }
  if (!/^\d{1,2}$/.test(rawPage) || !Number.isInteger(page) || page < 0 || page > 20) {
    return respond({ ok: false, error: "Página de búsqueda no válida." }, 400);
  }

  const cacheKey = new Request(url.origin + "/api/search?q=" + encodeURIComponent(q.toLowerCase()) + "&page=" + page);
  let cache;
  try {
    cache = caches.default;
    const previous = await cache.match(cacheKey);
    if (previous) return previous;
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
    return respond({ ok: false, error: "Límite de consultas de Sorare. Vuelve a intentarlo más tarde." }, 429);
  }
  if (!upstream.ok) {
    return respond({ ok: false, error: "Sorare no ha respondido correctamente.", upstreamStatus: upstream.status }, 502);
  }

  let data;
  try { data = await upstream.json(); }
  catch (_) { return respond({ ok: false, error: "Respuesta ilegible de Sorare." }, 502); }
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
  }, 200, { "cache-control": "public, max-age=60, s-maxage=300" });

  if (cache && context.waitUntil) context.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  return response;
}
