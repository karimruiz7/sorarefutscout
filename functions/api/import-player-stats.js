// Retrieves public Sorare football scoring averages for at most twenty selected
// player slugs, in one query, while the owner has an authorized test session.
// No card ownership, Arcade eligibility or lineup submission is asserted here.
import {authReady,canonical,privateTestEnabled,testAccessGranted,
 getSession,refreshed,json,SITE} from "../_lib/sorareOAuth.js";

const QUERY="query SorareFutScoutImportScores($slugs: [String!]) { players(slugs: $slugs) { __typename ... on Player { slug displayName position activeClub { slug name } l5: averageScore(type: LAST_FIVE_SO5_AVERAGE_SCORE) l10: averageScore(type: LAST_TEN_PLAYED_SO5_AVERAGE_SCORE) l15: averageScore(type: LAST_FIFTEEN_SO5_AVERAGE_SCORE) } } }";
const slugValid=s=>typeof s==="string"&&s.length<=100&&
 /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const score=value=>typeof value==="number"&&Number.isFinite(value)&&
 value>=0&&value<=100?value:null;

export async function onRequestPost({request,env}){
 if(!canonical(request)||request.headers.get("origin")!==SITE)
  return json({ok:false,error:"origen_no_permitido"},403);
 if(!authReady(env))return json({ok:false,error:"conexion_no_disponible"},503);
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))
  return json({ok:false,error:"prueba_privada_caducada"},403);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return json({ok:false,error:"formato_incorrecto"},415);
 if(Number(request.headers.get("content-length")||"0")>4096)
  return json({ok:false,error:"peticion_demasiado_grande"},413);
 let input;
 try{const body=await request.text();if(body.length>4096)throw Error();
  input=JSON.parse(body);}
 catch(_){return json({ok:false,error:"peticion_invalida"},400);}
 const slugs=input?.slugs;
 if(!Array.isArray(slugs)||slugs.length<1||slugs.length>20||
  !slugs.every(slugValid)||new Set(slugs).size!==slugs.length)
  return json({ok:false,error:"seleccion_no_valida"},400);
 const record=await getSession(env,request);
 if(!record)return json({ok:false,error:"sin_sesion"},401);
 try{await refreshed(env,record);}catch(_){
  return json({ok:false,error:"sesion_caducada"},401);
 }
 const headers={"content-type":"application/json",accept:"application/json"};
 if(env.SORARE_API_KEY)headers.APIKEY=env.SORARE_API_KEY;
 let upstream;
 try{
  upstream=await fetch("https://api.sorare.com/federation/graphql",{
   method:"POST",headers,
   body:JSON.stringify({operationName:"SorareFutScoutImportScores",
    query:QUERY,variables:{slugs}}),
   signal:AbortSignal.timeout(12000)
  });
 }catch(_){return json({ok:false,error:"sorare_no_disponible"},503);}
 if(upstream.status===429){
  const hint=upstream.headers.get("retry-after");
  const seconds=/^\d{1,5}$/.test(hint||"")?Math.min(3600,Math.max(1,Number(hint))):60;
  return json({ok:false,error:"limite_de_sorare",retryAfterSeconds:seconds},429,{"retry-after":String(seconds)});
 }
 if(!upstream.ok)return json({ok:false,error:"sorare_http_"+upstream.status},502);
 let data;
 try{data=await upstream.json();}catch(_){
  return json({ok:false,error:"respuesta_no_valida"},502);
 }
 if(data?.errors?.length)return json({ok:false,error:"consulta_sorare_rechazada"},502);
 if(!Array.isArray(data?.data?.players))
  return json({ok:false,error:"sin_resultados_de_sorare"},502);
 const allow=new Set(slugs);
 const players=data.data.players.filter(p=>p?.__typename==="Player"&&allow.has(p.slug)
  &&["Goalkeeper","Defender","Midfielder","Forward"].includes(p.position))
  .slice(0,20).map(p=>({
   slug:p.slug,
   name:typeof p.displayName==="string"?p.displayName.slice(0,100):"",
   club:typeof p.activeClub?.name==="string"?p.activeClub.name.slice(0,100):"Sin club",
   clubSlug:typeof p.activeClub?.slug==="string"?p.activeClub.slug.slice(0,120):null,
   position:p.position,l5:score(p.l5),l10:score(p.l10),l15:score(p.l15)
  })).filter(p=>p.name);
 return json({ok:true,source:"Sorare public football player statistics",
  players,requested:slugs.length,received:players.length,
  note:"Medias históricas oficiales, no predicciones. No establece elegibilidad Arcade ni propiedad adicional."});
}