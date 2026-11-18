import {authReady,canonical,json,validContact} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return json({ok:false,error:"Usa el dominio público principal."},403);
 return json({ok:true,oauthReady:authReady(env),apiKeyConfigured:typeof env?.SORARE_API_KEY==="string"&&env.SORARE_API_KEY.length>0,
  requiredForOAuth:["SORARE_OAUTH_CLIENT_ID","SORARE_OAUTH_CLIENT_SECRET","SFS_SESSIONS (KV)","SFS_PRIVACY_CONTACT"],
  contact:validContact(env?.SFS_PRIVACY_CONTACT)?env.SFS_PRIVACY_CONTACT:null,
  note:"La clave API pública del servidor no sustituye las credenciales OAuth. La importación de cartas aún no está activa."});
}