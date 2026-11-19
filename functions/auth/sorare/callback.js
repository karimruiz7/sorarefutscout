import {authReady,canonical,cookie,cookieHeader,STATE_COOKIE,SESSION_COOKIE,
 equalSafe,randomValue,tokenRequest,currentUser,putSession,CALLBACK,redirect,noStore,testAccessGranted,privateTestEnabled} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return new Response("No se permite este dominio de retorno.",{status:403,headers:noStore()});
 const params=new URL(request.url).searchParams;
 const cleanup=cookieHeader(STATE_COOKIE,"",0);
 const go=(reason)=>redirect("/mi-club.html?error="+encodeURIComponent(reason),302,{"set-cookie":cleanup});
 if(params.has("error"))return go("denied");
 if(!authReady(env))return go("not_ready");
 if(privateTestEnabled(env)&&!await testAccessGranted(env,request))return go("test_denied");
 const state=params.get("state")||"",saved=cookie(request,STATE_COOKIE);
 if(!equalSafe(state,saved))return go("state");
 const code=params.get("code")||"";
 if(typeof code!=="string"||code.length<10||code.length>4096)return go("invalid_code");
 try{
  const token=await tokenRequest(env,{code,grant_type:"authorization_code",redirect_uri:CALLBACK});
  const slug=await currentUser(env,token.access_token);
  const sid=randomValue();
  const session={slug,accessToken:token.access_token,refreshToken:token.refresh_token,
   expireAt:Date.now()+Number(token.expires_in)*1000};
  await putSession(env,sid,session);
  const h=new Headers(noStore({location:"https://sorarefutscout.pages.dev/mi-club.html?connected=1"}));
  h.append("set-cookie",cleanup);
  h.append("set-cookie",cookieHeader(SESSION_COOKIE,sid,7*24*3600));
  return new Response(null,{status:302,headers:h});
 }catch(_){return go("failed");}
}