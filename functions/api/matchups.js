// SorareFutScout — last five completed matches for verified opponent club slugs.
// Public GraphQL query, max 8 clubs, no arbitrary operations or credentials.
const API="https://api.sorare.com/federation/graphql";
const respond=(body,status=200,other={})=>new Response(JSON.stringify(body),{status,headers:{
  "content-type":"application/json; charset=utf-8","x-content-type-options":"nosniff",
  "cache-control":"no-store",...other
}});
function build(slugs){
  const declarations=slugs.map((_,i)=>"$s"+i+": String!").join(", ");
  const base="slug name lastFiveGames { date homeScore awayScore homeTeam { slug } awayTeam { slug } }";
  const fields=slugs.map((_,i)=>"c"+i+": club(slug: $s"+i+") { "+base+" }").join("\n");
  const variables=Object.fromEntries(slugs.map((slug,i)=>["s"+i,slug]));
  return {query:"query SFSOpponentStats("+declarations+") { football { "+fields+" } }",variables};
}
function retrySeconds(value){
  const n=Number(value);
  if(Number.isFinite(n)&&n>0)return Math.min(3600,Math.ceil(n));
  const time=value?Date.parse(value):NaN;
  return Number.isFinite(time)?Math.min(3600,Math.max(1,Math.ceil((time-Date.now())/1000))):60;
}
function toStats(club,slug){
  if(!club || club.slug!==slug)return {slug,available:false,reason:"Sin datos fiables en Sorare"};
  const now=Date.now();
  const games=(club.lastFiveGames||[]).filter(game=>{
    const t=Date.parse(game?.date||"");
    return Number.isFinite(t)&&t<now-3600000&&
      Number.isInteger(game?.homeScore)&&Number.isInteger(game?.awayScore)&&
      game.homeScore>=0&&game.awayScore>=0&&
      (game.homeTeam?.slug===slug||game.awayTeam?.slug===slug);
  }).slice(0,5);
  if(games.length<3)return {slug,club:club.name,available:false,gamesCount:games.length,reason:"Menos de tres resultados confirmados"};
  let scored=0,conceded=0;
  const recent=games.map(game=>{
    const home=game.homeTeam?.slug===slug;
    const gf=home?game.homeScore:game.awayScore;
    const ga=home?game.awayScore:game.homeScore;
    scored+=gf;conceded+=ga;
    return {date:game.date,goalsFor:gf,goalsAgainst:ga};
  });
  return {
    slug,club:club.name,available:true,gamesCount:games.length,
    goalsForPerGame:Math.round(scored/games.length*100)/100,
    goalsAgainstPerGame:Math.round(conceded/games.length*100)/100,
    recent,
  };
}
export async function onRequestGet(context){
  const url=new URL(context.request.url);
  const raw=(url.searchParams.get("slugs")||"").trim().toLowerCase();
  const slugs=raw.split(",").filter(Boolean);
  if(slugs.length<1||slugs.length>8||raw.length>850||
    slugs.some(s=>s.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))||
    slugs.length!==new Set(slugs).size){
    return respond({ok:false,error:"Solicita entre 1 y 8 clubes con identificadores válidos y sin duplicados."},400);
  }
  slugs.sort();
  const key=new Request(url.origin+"/api/matchups?v=1&slugs="+encodeURIComponent(slugs.join(",")));
  let cache;
  try{cache=caches.default;const old=await cache.match(key);if(old)return old;}catch(_){}
  const {query,variables}=build(slugs);
  let upstream;
  try{
    const headers={"content-type":"application/json",accept:"application/json"};
    if(context.env?.SORARE_API_KEY)headers.APIKEY=context.env.SORARE_API_KEY;
    upstream=await fetch(API,{
      method:"POST",headers,
      body:JSON.stringify({operationName:"SFSOpponentStats",query,variables}),
      signal:AbortSignal.timeout(15000),
    });
  }catch(_){return respond({ok:false,error:"No se pudo contactar con Sorare."},502);}
  if(upstream.status===429){
    const seconds=retrySeconds(upstream.headers.get("retry-after"));
    return respond({ok:false,error:"Sorare ha limitado temporalmente las peticiones.",retryAfter:seconds},429,{"retry-after":String(seconds)});
  }
  if(!upstream.ok)return respond({ok:false,error:"Sorare no ha respondido correctamente.",upstreamStatus:upstream.status},502);
  let data;
  try{data=await upstream.json();}catch(_){return respond({ok:false,error:"La respuesta de Sorare no es válida."},502);}
  if(data.errors?.length)return respond({ok:false,error:"Sorare rechazó la consulta de enfrentamientos.",detail:String(data.errors[0]?.message||"").slice(0,240)},502);
  if(!data.data?.football)return respond({ok:false,error:"Sorare no ha devuelto datos de clubes."},502);
  const opponents=slugs.map((slug,i)=>toStats(data.data.football["c"+i],slug));
  const output=respond({
    ok:true,source:"Sorare GraphQL Club.lastFiveGames",
    fetchedAt:new Date().toISOString(),opponents,
    note:"Los goles a favor y en contra son datos históricos, no probabilidades ni puntuaciones previstas.",
  },200,{"cache-control":"public, max-age=60, s-maxage=3600"});
  if(cache&&context.waitUntil)context.waitUntil(cache.put(key,output.clone()).catch(()=>{}));
  return output;
}
