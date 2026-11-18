// SorareFutScout — consulta pública del próximo partido SO5-elegible de una selección.
// Una única operación GraphQL para hasta 12 futbolistas. No se envían credenciales.
const API="https://api.sorare.com/federation/graphql";
const QUERY=[
  "query SorareFutScoutNextGames($slugs: [String!]) {",
  " players(slugs: $slugs) {",
  "   __typename",
  "   ... on Player {",
  "     slug",
  "     activeClub { slug name }",
  "     nextGame(so5FixtureEligible: true) {",
  "       date",
  "       homeTeam { name slug }",
  "       awayTeam { name slug }",
  "       so5Fixture { displayName gameWeek startDate endDate }",
  "     }",
  "   }",
  " }",
  "}"
].join("\n");
function json(body,status=200,extra={}) {
 return new Response(JSON.stringify(body),{status,headers:{
  "content-type":"application/json; charset=utf-8",
  "x-content-type-options":"nosniff",
  "cache-control":"no-store",
  ...extra,
 }});
}
function retrySeconds(value){
 const num=Number(value);
 if(Number.isFinite(num)&&num>0)return Math.min(3600,Math.ceil(num));
 const d=value?Date.parse(value):NaN;
 return Number.isFinite(d)?Math.min(3600,Math.max(1,Math.ceil((d-Date.now())/1000))):60;
}
export async function onRequestGet(context) {
 const url=new URL(context.request.url);
 const raw=(url.searchParams.get("slugs")||"").trim().toLowerCase();
 const slugs=raw.split(",").filter(Boolean);
 if(slugs.length===0||slugs.length>12||raw.length>1200||
    slugs.some(s=>s.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))||
    new Set(slugs).size!==slugs.length) {
   return json({ok:false,error:"Selecciona entre 1 y 12 identificadores de jugadores distintos."},400);
 }
 const sorted=[...slugs].sort();
 const key=new Request(url.origin+"/api/next-games?v=2&slugs="+encodeURIComponent(sorted.join(",")));
 let cache=null;
 try{
   cache=caches.default;
   const cached=await cache.match(key);
   if(cached)return cached;
 }catch(_){}
 let upstream;
 try{
   const headers={"content-type":"application/json",accept:"application/json"};
   if(context.env?.SORARE_API_KEY)headers.APIKEY=context.env.SORARE_API_KEY;
   upstream=await fetch(API,{
     method:"POST",headers,
     body:JSON.stringify({operationName:"SorareFutScoutNextGames",query:QUERY,variables:{slugs:sorted}}),
     signal:AbortSignal.timeout(12000),
   });
 }catch(_){return json({ok:false,error:"No se ha podido contactar con la API de Sorare."},502);}
 if(upstream.status===429){
   const seconds=retrySeconds(upstream.headers.get("retry-after"));
   return json({ok:false,error:"Sorare ha limitado temporalmente las consultas.",retryAfter:seconds},429,{"retry-after":String(seconds)});
 }
 if(!upstream.ok)return json({ok:false,error:"Sorare no ha respondido correctamente.",upstreamStatus:upstream.status},502);
 let data;
 try{data=await upstream.json();}
 catch(_){return json({ok:false,error:"Respuesta no válida de la API de Sorare."},502);}
 if(data.errors?.length)return json({ok:false,error:"Sorare ha rechazado la consulta de próximos partidos.",detail:String(data.errors[0]?.message||"").slice(0,220)},502);
 if(!Array.isArray(data.data?.players))return json({ok:false,error:"Sorare no ha devuelto una lista de jugadores."},502);
 const bySlug=new Map(data.data.players.filter(p=>p?.__typename==="Player"&&typeof p.slug==="string").map(p=>[p.slug,p]));
 const now=Date.now();
 const fixtures=sorted.map(slug=>{
   const p=bySlug.get(slug),g=p?.nextGame;
   const when=g?.date ? Date.parse(g.date):NaN;
   const valid=Number.isFinite(when)&&when>=now-2*3600000&&when<now+180*86400000;
   const f=g?.so5Fixture;
   return {
     slug,
     status:!p?"unavailable":!g?"none":valid?"scheduled":"unavailable",
     clubSlug:p?.activeClub?.slug||null,
     // Next SO5-eligible game, NOT guaranteed Arcade/Pro eligibility.
     game:valid?{
       date:new Date(when).toISOString(),
       home:g.homeTeam?.name||null,
       away:g.awayTeam?.name||null,
       homeSlug:g.homeTeam?.slug||null,
       awaySlug:g.awayTeam?.slug||null,
       gw:typeof f?.gameWeek==="number"?f.gameWeek:null,
       fixtureName:f?.displayName||null,
       fixtureStart:f?.startDate||null,
       fixtureEnd:f?.endDate||null,
     }:null,
   };
 });
 const result=json({
   ok:true,source:"Sorare GraphQL (nextGame so5FixtureEligible)",
   fetchedAt:new Date().toISOString(),fixtures,
   note:"Próximo encuentro puntuable según Sorare. No garantiza participación, titularidad ni elegibilidad de una carta en un torneo.",
 },200,{"cache-control":"public, max-age=60, s-maxage=900"});
 if(cache&&context.waitUntil)context.waitUntil(cache.put(key,result.clone()).catch(()=>{}));
 return result;
}
