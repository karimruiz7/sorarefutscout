import {authReady,canonical,cookie,cookieHeader,STATE_COOKIE,SESSION_COOKIE,
 equalSafe,randomValue,tokenRequest,currentUser,putSession,CALLBACK,redirect,noStore,testAccessGranted,privateTestEnabled} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return new Response("No se permite este dominio de retorno.",{status:403,headers:noStore()});
 const params=new URL(request.url).searchParams;
 const cleanup=cookieHeader(STATE_COOKIE,"",0);
 const go=(reason,phase="",detail="")=>{
   const p=new URLSearchParams({error:reason});
   if(["token","profile","storage"].includes(phase))p.set("phase",phase);
   if(/^(?:token_http_[1-5][0-9]{2}|profile_http_[1-5][0-9]{2}|token_incomplete|token_invalid_json|profile_invalid_json|profile_graphql_error|profile_missing_user)$/.test(detail))p.set("detail",detail);
   return redirect("/mi-club.html?"+p.toString(),302,{"set-cookie":cleanup});
 };
 if(params.has("error"))return go("denied");
 if(!authReady(env))return go("not_ready");
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))return go("test_denied");
 const state=params.get("state")||"",saved=cookie(request,STATE_COOKIE);
 if(!equalSafe(state,saved))return go("state");
 const code=params.get("code")||"";
 if(typeof code!=="string"||code.length<10||code.length>4096)return go("invalid_code");
 let phase="token";
 try{
  const token=await tokenRequest(env,{code,grant_type:"authorization_code",redirect_uri:CALLBACK});
  phase="profile";
  const slug=await currentUser(env,token.access_token);
  phase="storage";
  const sid=randomValue();
  const session={slug,accessToken:token.access_token,refreshToken:token.refresh_token,
   expireAt:Date.now()+Number(token.expires_in)*1000};
  await putSession(env,sid,session);
  const h=new Headers(noStore({location:"https://sorarefutscout.pages.dev/mi-club.html?connected=1"}));
  h.append("set-cookie",cleanup);
  h.append("set-cookie",cookieHeader(SESSION_COOKIE,sid,7*24*3600));
  return new Response(null,{status:302,headers:h});
 }catch(err){
  // Avoid repeated code exchanges. OAuth authorization codes are single-use.
  if(phase==="token"&&err?.message==="token_http_429")return go("rate_limited");
  // Return only a fixed phase and a tightly whitelisted error label.
  return go("failed",phase,typeof err?.message==="string"?err.message:"");
 }
}