// Fase 4.2 · Vista previa de cartas autenticadas; ninguna mutación ni venta.
// Los tokens OAuth permanecen exclusivamente en la sesión cifrada del servidor.
import {authReady,canonical,getSession,refreshed,json,privateTestEnabled,
  testAccessGranted} from "../_lib/sorareOAuth.js";

const QUERY="query SorareFutScoutMyFootballCards($after:String) {\n  currentUser {\n    slug\n    cards(first:20, after:$after, sport:FOOTBALL, owned:true, ownedByMe:true) {\n      totalCount\n      pageInfo { endCursor hasNextPage }\n      nodes {\n        assetId slug name rarityTyped seasonYear pictureUrl\n        anyPlayer {\n          slug displayName avatarPictureUrl anyPositions\n          activeClub { name }\n        }\n      }\n    }\n  }\n}";
const safeString=(v,max=180)=>typeof v==="string"?v.slice(0,max):"";
const safeImage=(v)=>{
 if(typeof v!=="string"||v.length>1024)return null;
 try{
  const u=new URL(v);
  return u.protocol==="https:"&&
   (u.hostname==="sorare.com"||u.hostname.endsWith(".sorare.com"))?u.href:null;
 }catch(_){return null;}
};
export async function onRequestGet({request,env}){
 if(!canonical(request))return json({ok:false,error:"dominio_no_permitido"},403);
 if(!authReady(env))return json({ok:false,error:"conexion_no_disponible"},503);
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))
   return json({ok:false,error:"prueba_privada_caducada"},403);
 const url=new URL(request.url);
 const after=url.searchParams.get("after")||null;
 if(after&&!/^[A-Za-z0-9+/=_-]{1,512}$/.test(after))
   return json({ok:false,error:"cursor_no_valido"},400);
 const record=await getSession(env,request);
 if(!record)return json({ok:false,error:"sin_sesion"},401);
 let session;
 try{session=await refreshed(env,record);}
 catch(_){return json({ok:false,error:"sesion_caducada"},401);}
 const headers={
  "content-type":"application/json",
  "accept":"application/json",
  "authorization":"Bearer "+session.accessToken
 };
 if(env.SORARE_API_KEY)headers.APIKEY=env.SORARE_API_KEY;
 let response;
 try{
  response=await fetch("https://api.sorare.com/graphql",{
   method:"POST",headers,
   body:JSON.stringify({operationName:"SorareFutScoutMyFootballCards",
    query:QUERY,variables:{after}}),
   signal:AbortSignal.timeout(25000)
  });
 }catch(error){
  if(error?.name==="TimeoutError"||error?.name==="AbortError")
   return json({ok:false,error:"sorare_tiempo_agotado"},504);
  return json({ok:false,error:"sorare_temporalmente_no_disponible"},503);
 }
 if(response.status===429)return json({ok:false,error:"limite_de_sorare"},429,{
  "retry-after":Math.min(Math.max(Number(response.headers.get("retry-after"))||60,1),300).toString()
 });
 if(!response.ok)return json({ok:false,error:"sorare_http_"+response.status},502);
 let result;
 try{result=await response.json();}
 catch(_){return json({ok:false,error:"respuesta_sorare_invalida"},502);}
 if(result?.errors?.length)return json({
  ok:false,error:"consulta_no_disponible",
  note:"Sorare ha rechazado la consulta de cartas. No se ha importado nada."
 },502);
 const user=result?.data?.currentUser;
 if(!user||user.slug!==session.slug)return json({ok:false,error:"identidad_no_coincide"},403);
 const connection=user.cards;
 if(!connection||!Array.isArray(connection.nodes)||!connection.pageInfo)
   return json({ok:false,error:"coleccion_no_disponible"},502);
 const cards=connection.nodes.slice(0,20).map(c=>{
  const p=c?.anyPlayer;
  if(!p||!safeString(p.slug))return null;
  return {
   cardSlug:safeString(c.slug,220),
   assetId:safeString(c.assetId,220),
   playerSlug:safeString(p.slug,220),
   name:safeString(p.displayName)||safeString(c.name)||"Sin nombre",
   club:safeString(p.activeClub?.name)||"Sin club",
   positions:Array.isArray(p.anyPositions)?p.anyPositions.filter(x=>typeof x==="string").slice(0,3):[],
   rarity:safeString(c.rarityTyped,25),
   season:Number.isInteger(c.seasonYear)?c.seasonYear:null,
   playerPicture:safeImage(p.avatarPictureUrl),
   cardPicture:safeImage(c.pictureUrl)
  };
 }).filter(Boolean);
 const nextCursor=connection.pageInfo.hasNextPage===true&&
  /^[A-Za-z0-9+/=_-]{1,512}$/.test(connection.pageInfo.endCursor||"")?
  connection.pageInfo.endCursor:null;
 return json({
  ok:true,source:"Sorare GraphQL · currentUser.cards",
  mode:"preview",scope:"FOOTBALL",
  account:session.slug,
  count:cards.length,
  totalCount:Number.isInteger(connection.totalCount)?connection.totalCount:null,
  cards,
  pagination:{hasNextPage:Boolean(nextCursor),nextCursor},
  note:"Vista previa de cartas OAuth. Cobertura de Arcade pendiente de verificar. No se han añadido cartas al optimizador."
 });
}