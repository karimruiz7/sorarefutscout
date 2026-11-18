import {authReady,canonical,cookieHeader,noStore,SESSION_COOKIE,
 getSession,deleteSession} from "../../_lib/sorareOAuth.js";
export async function onRequestPost({request,env}){
 if(!canonical(request)||request.headers.get("origin")!=="https://sorarefutscout.pages.dev")
  return new Response(null,{status:403,headers:noStore()});
 if(!authReady(env))return new Response(null,{status:503,headers:noStore()});
 try{
  const record=await getSession(env,request);
  if(record?.session?.accessToken){
   const payload=new URLSearchParams({client_id:env.SORARE_OAUTH_CLIENT_ID,
    client_secret:env.SORARE_OAUTH_CLIENT_SECRET,token:record.session.accessToken});
   try{await fetch("https://api.sorare.com/oauth/revoke",{
    method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
    body:payload,signal:AbortSignal.timeout(6000)
   });}catch(_){}
  }
  await deleteSession(env,request);
 }catch(_){return new Response(null,{status:503,headers:noStore()});}
 return new Response(null,{status:204,headers:noStore({
  "set-cookie":cookieHeader(SESSION_COOKIE,"",0)
 })});
}