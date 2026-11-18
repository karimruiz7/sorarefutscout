// SorareFutScout — exact club roster from Sorare's football Club.activePlayers.
// Explicit allowlist prevents look-alike names being treated as a club roster.
const ENDPOINT = "https://api.sorare.com/federation/graphql";
const CLUBS = Object.freeze({
  "real-madrid-madrid": "Real Madrid",
  "barcelona-barcelona": "FC Barcelona",
  "atletico-madrid-madrid": "Atlético de Madrid",
  "valencia-valencia": "Valencia CF",
  "real-oviedo-oviedo": "Real Oviedo",
});
const QUERY = [
  "query SorareFutScoutClub($slug: String!, $after: String) {",
  " football { club(slug: $slug) { name slug activePlayers(first: 20, after: $after) {",
  "   nodes { slug displayName position activeClub { name slug }",
  '     avatar: pictureUrl(derivative: "avatar")',
  "     l5: averageScore(type: LAST_FIVE_SO5_AVERAGE_SCORE)",
  "     l10: averageScore(type: LAST_TEN_PLAYED_SO5_AVERAGE_SCORE)",
  "     l15: averageScore(type: LAST_FIFTEEN_SO5_AVERAGE_SCORE)",
  "   }",
  "   pageInfo { hasNextPage endCursor }",
  " } } }",
  "}"
].join("\n");
const QUERY_NO_PHOTO = QUERY.replace('avatar: pictureUrl(derivative: "avatar")', "");

function reply(body,status=200,extra={}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type":"application/json; charset=utf-8",
      "x-content-type-options":"nosniff",
      "cache-control":"no-store",
      ...extra,
    },
  });
}
function retrySeconds(value) {
  const n = Number(value);
  if(Number.isFinite(n) && n > 0) return Math.min(3600,Math.ceil(n));
  const date=value ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? Math.min(3600,Math.max(1,Math.ceil((date-Date.now())/1000))) : 60;
}
async function querySorare(context,query,slug,after) {
  const headers={"content-type":"application/json",accept:"application/json"};
  if(context.env?.SORARE_API_KEY) headers.APIKEY=context.env.SORARE_API_KEY;
  return fetch(ENDPOINT,{
    method:"POST",
    headers,
    body:JSON.stringify({operationName:"SorareFutScoutClub",query,variables:{slug,after}}),
    signal:AbortSignal.timeout(12000),
  });
}
export async function onRequestGet(context) {
  const url=new URL(context.request.url);
  const slug=(url.searchParams.get("slug")||"").trim().toLowerCase();
  const after=(url.searchParams.get("after")||"").trim()||null;
  if(!Object.prototype.hasOwnProperty.call(CLUBS,slug)) {
    return reply({ok:false,error:"Selecciona un equipo compatible desde el listado."},400);
  }
  if(after && (after.length>300 || !/^[A-Za-z0-9_+/=-]+$/.test(after))) {
    return reply({ok:false,error:"Cursor de paginación no válido."},400);
  }
  const cacheKey=new Request(url.origin+"/api/club?v=1&slug="+encodeURIComponent(slug)+(after?"&after="+encodeURIComponent(after):""));
  let cache=null;
  try {
    cache=caches.default;
    const hit=await cache.match(cacheKey);
    if(hit)return hit;
  } catch (_) { /* local preview may not support cache */ }
  let response;
  try { response=await querySorare(context,QUERY,slug,after); }
  catch (_) { return reply({ok:false,error:"No se ha podido contactar con Sorare."},502); }
  if(response.status===429) {
    const wait=retrySeconds(response.headers.get("retry-after"));
    return reply({ok:false,error:"Sorare ha limitado temporalmente las consultas.",retryAfter:wait},429,{"retry-after":String(wait)});
  }
  if(!response.ok) return reply({ok:false,error:"Sorare no ha respondido correctamente.",upstreamStatus:response.status},502);
  let result;
  try{result=await response.json();}catch(_){return reply({ok:false,error:"La respuesta del club no es válida."},502);}
  // An optional image must not break squad retrieval.
  if(result.errors?.some(e=>/pictureUrl|derivative/i.test(String(e?.message||"")))) {
    try {
      const fallback=await querySorare(context,QUERY_NO_PHOTO,slug,after);
      if(fallback.ok) result=await fallback.json();
    } catch (_) { /* Report error below. */ }
  }
  if(result.errors?.length) return reply({ok:false,error:"Sorare ha rechazado la consulta de plantilla.",detail:String(result.errors[0]?.message||"").slice(0,200)},502);
  const club=result.data?.football?.club;
  if(!club || !Array.isArray(club.activePlayers?.nodes)) {
    return reply({ok:false,error:"Sorare no ha devuelto la plantilla de este equipo."},502);
  }
  if(club.slug!==slug) return reply({ok:false,error:"La respuesta no corresponde al club solicitado."},502);
  const seen=new Set();
  let ignored=0;
  const players=[];
  for(const p of club.activePlayers.nodes) {
    if(!p?.slug || seen.has(p.slug))continue;
    seen.add(p.slug);
    if(p.activeClub?.slug && p.activeClub.slug!==slug){ignored++;continue;}
    players.push({
      slug:p.slug,
      name:p.displayName,
      club:club.name,
      position:p.position||"UNKNOWN",
      l5:typeof p.l5==="number"?p.l5:null,
      l10:typeof p.l10==="number"?p.l10:null,
      l15:typeof p.l15==="number"?p.l15:null,
      avatar:typeof p.avatar==="string"&&p.avatar.startsWith("https://")?p.avatar:null,
    });
  }
  const output=reply({
    ok:true,
    source:"Sorare Club.activePlayers",
    fetchedAt:new Date().toISOString(),
    team:{slug,name:club.name},
    players,
    nextCursor:club.activePlayers.pageInfo?.hasNextPage?club.activePlayers.pageInfo.endCursor||null:null,
    ignoredMismatchedClubs:ignored,
    // No claim of being the club's official registered squad.
    rosterDisclaimer:"Plantilla activa según Sorare. No sustituye la convocatoria o inscripción oficial del club.",
  },200,{"cache-control":"public, max-age=60, s-maxage=900"});
  if(cache && context.waitUntil)context.waitUntil(cache.put(cacheKey,output.clone()).catch(()=>{}));
  return output;
}
