import {authReady,canonical,cookieHeader,noStore,randomValue,CALLBACK,STATE_COOKIE,testAccessGranted,privateTestEnabled} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return new Response("Abre SorareFutScout desde su dominio público principal.",{status:403,headers:noStore()});
 if(!authReady(env))return new Response("La conexión de cuentas Sorare aún no está disponible. Falta configurar OAuth y KV.",{
  status:503,headers:noStore({"content-type":"text/plain; charset=utf-8"})});
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))return new Response("Acceso restringido: desbloquea la prueba privada desde Mi club.",{status:403,headers:noStore()});
 const state=randomValue();
 const target=new URL("https://sorare.com/oauth/authorize");
 target.searchParams.set("client_id",env.SORARE_OAUTH_CLIENT_ID);
 target.searchParams.set("redirect_uri",CALLBACK);
 target.searchParams.set("response_type","code");
 target.searchParams.set("scope","");
 target.searchParams.set("state",state);
 return new Response(null,{status:302,headers:noStore({
  location:target.href,"set-cookie":cookieHeader(STATE_COOKIE,state,600)
 })});
}