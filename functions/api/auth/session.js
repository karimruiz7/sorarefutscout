import {authReady,canonical,json,getSession,refreshed} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return json({ok:false,error:"Dominio no permitido."},403);
 if(!authReady(env))return json({ok:true,connected:false,oauthReady:false});
 try{
  const record=await getSession(env,request);
  if(!record)return json({ok:true,connected:false,oauthReady:true});
  const session=await refreshed(env,record);
  return json({ok:true,connected:true,oauthReady:true,user:{slug:session.slug},
   note:"La colección de cartas se importará en una fase posterior. No se exponen tokens al navegador."});
 }catch(_){return json({ok:true,connected:false,oauthReady:true,note:"Sesión caducada o no disponible."});}
}