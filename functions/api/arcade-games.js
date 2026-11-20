// Fase 4.10: partidos del Set SOLO en el día local elegido por la persona.
// Se exige la misma sesión OAuth privada que la consulta de cartas.
// Esta ruta NO consulta ni devuelve información privada de la cuenta.
import {authReady,canonical,getSession,privateTestEnabled,testAccessGranted,json} from "../_lib/sorareOAuth.js";
const API="https://api.sorare.com/graphql";
const QUERY=`query SorareFutScoutSetGames($slug:String!,$from:ISO8601DateTime!,$to:ISO8601DateTime!) {
 cardSet { cardSet(slug:$slug,sport:FOOTBALL) {
  slug name competitionGames(fromDate:$from,toDate:$to) {
   competition { slug name }
   games { id date homeTeam { slug name } awayTeam { slug name } }
  }
 } }
}`;
const safe=(value,n=120)=>typeof value==="string"?value.slice(0,n):"";
function validDay(text){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text||""))return null;
 const d=new Date(text+"T00:00:00.000Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===text?d:null;
}
function validUtcInstant(value){
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return null;
 const ms=Date.parse(value);
 return Number.isFinite(ms)&&new Date(ms).toISOString()===value?ms:null;
}
function retryAfter(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>0?Math.min(3600,Math.ceil(n)):60;
}
export async function onRequestGet({request,env}){
 if(!canonical(request))return json({ok:false,error:"dominio_no_permitido"},403);
 if(!authReady(env))return json({ok:false,error:"conexion_no_disponible"},503);
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))
  return json({ok:false,error:"prueba_privada_caducada"},403);
 if(!await getSession(env,request))return json({ok:false,error:"sin_sesion"},401);
 const url=new URL(request.url);
 const slug=(url.searchParams.get("set")||"").trim().toLowerCase();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>90)
  return json({ok:false,error:"set_no_valido"},400);
 const day=validDay(url.searchParams.get("day"));
 if(!day)return json({ok:false,error:"fecha_no_valida"},400);
 const today=new Date();
 const todayUtc=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
 if(day.getTime()<todayUtc-86400000||day.getTime()>todayUtc+60*86400000)
  return json({ok:false,error:"fecha_fuera_de_rango"},400);
 // The browser sends the start/end of the selected local day as UTC instants.
 // This covers 23h and 25h daylight-saving days and prevents next-day fixtures
 // being accidentally included because the API supports up-to-48h windows.
 const fromMs=validUtcInstant(url.searchParams.get("from"));
 const toMs=validUtcInstant(url.searchParams.get("to"));
 const duration=toMs-fromMs;
 if(fromMs===null||toMs===null||duration<23*3600000||duration>25*3600000||
    Math.abs(fromMs-day.getTime())>14*3600000)
  return json({ok:false,error:"ventana_dia_no_valida"},400);
 const fromISO=new Date(fromMs).toISOString(),toISO=new Date(toMs).toISOString();
 const headers={"content-type":"application/json",accept:"application/json"};
 if(env.SORARE_API_KEY)headers.APIKEY=env.SORARE_API_KEY;
 let upstream;
 try{
  upstream=await fetch(API,{
   method:"POST",headers,
   body:JSON.stringify({operationName:"SorareFutScoutSetGames",
    query:QUERY,variables:{slug,from:fromISO,to:toISO}}),
   signal:AbortSignal.timeout(20000)
  });
 }catch(_){return json({ok:false,error:"sorare_no_disponible"},503);}
 if(upstream.status===429){
  const secs=retryAfter(upstream.headers.get("retry-after"));
  return json({ok:false,error:"limite_de_sorare",retryAfterSeconds:secs},429,{"retry-after":String(secs)});
 }
 if(!upstream.ok)return json({ok:false,error:"sorare_http_"+upstream.status},502);
 let data;
 try{data=await upstream.json();}catch(_){return json({ok:false,error:"respuesta_invalida"},502);}
 if(data?.errors?.length)return json({ok:false,error:"esquema_sorare_rechazado"},502);
 const set=data?.data?.cardSet?.cardSet;
 if(!set||set.slug!==slug||!Array.isArray(set.competitionGames))
  return json({ok:false,error:"set_no_disponible"},404);
 const gameMap=new Map();
 for(const item of set.competitionGames){
  for(const game of item?.games||[]){
   const gameTime=Date.parse(game?.date);
   if(typeof game?.id!=="string"||!Number.isFinite(gameTime)||
      gameTime<fromMs||gameTime>=toMs)continue;
   const h=game.homeTeam,a=game.awayTeam;
   if(!h?.slug||!a?.slug)continue;
   gameMap.set(game.id,{
    id:safe(game.id,180),date:safe(game.date,40),
    competition:safe(item?.competition?.name),
    home:{slug:safe(h.slug),name:safe(h.name)},
    away:{slug:safe(a.slug),name:safe(a.name)}
   });
  }
 }
 const games=[...gameMap.values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(games.length>500)return json({ok:false,error:"demasiados_partidos"},502);
 return json({ok:true,set:{slug,name:safe(set.name)},day:day.toISOString().slice(0,10),
  windowStart:fromISO,windowEnd:toISO,games,count:games.length,
  source:"Sorare cardSet.competitionGames",note:"Encuentros contabilizables por el Set para la ventana consultada; no confirma que cada futbolista juegue, sea titular o pueda inscribirse."});
}
