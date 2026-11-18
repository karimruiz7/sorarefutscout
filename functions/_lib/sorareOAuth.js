// SorareFutScout · OAuth utilities for Cloudflare Pages Functions.
// Tokens are never sent to browser JavaScript. They are encrypted before KV storage.
// Scope: read-only Sorare OAuth, not a Sorare API key.
export const SITE="https://sorarefutscout.pages.dev";
export const CALLBACK=SITE+"/auth/sorare/callback";
export const SESSION_COOKIE="__Host-sfs_session";
export const STATE_COOKIE="__Host-sfs_oauth_state";
const TTL=7*24*3600;
const te=new TextEncoder(),td=new TextDecoder();
export function authReady(env){
 return Boolean(typeof env?.SORARE_OAUTH_CLIENT_ID==="string"&&env.SORARE_OAUTH_CLIENT_ID.trim()&&
 typeof env?.SORARE_OAUTH_CLIENT_SECRET==="string"&&env.SORARE_OAUTH_CLIENT_SECRET.trim()&&
 env?.SFS_SESSIONS&&typeof env.SFS_SESSIONS.get==="function"&&
 typeof env.SFS_SESSIONS.put==="function"&&typeof env.SFS_SESSIONS.delete==="function");
}
export function canonical(request){return new URL(request.url).origin===SITE;}
export function noStore(extra={}){return {"cache-control":"no-store, private","referrer-policy":"no-referrer",
 "x-content-type-options":"nosniff","x-robots-tag":"noindex","content-security-policy":"default-src 'none'; frame-ancestors 'none'",...extra};}
export function json(value,status=200,extra={}){return new Response(JSON.stringify(value),{
 status,headers:noStore({"content-type":"application/json; charset=utf-8",...extra})
});}
export function redirect(path,status=302,extra={}){
 return new Response(null,{status,headers:noStore({location:SITE+path,...extra})});
}
export function validToken(s){return typeof s==="string"&&s.length>=16&&s.length<=8192;}
export function cookie(request,key){
 const raw=request.headers.get("cookie")||"";
 const item=raw.split(";").map(v=>v.trim()).find(p=>p.startsWith(key+"="));
 return item?item.slice(key.length+1):"";
}
export function cookieHeader(name,value,seconds){
 const base=name+"="+value+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age="+seconds;
 return base;
}
export function randomValue(){
 const raw=crypto.getRandomValues(new Uint8Array(32));
 return toBase64(raw);
}
export function toBase64(bytes){
 let raw="";for(const b of bytes)raw+=String.fromCharCode(b);
 return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
export function fromBase64(value){
 if(!/^[A-Za-z0-9_-]{1,12000}$/.test(value))throw Error("Invalid base64");
 const valueWithPadding=value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"=");
 const raw=atob(valueWithPadding);
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export function equalSafe(a,b){
 if(!/^[A-Za-z0-9_-]{43}$/.test(a)||!/^[A-Za-z0-9_-]{43}$/.test(b))return false;
 let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);
 return v===0;
}
async function keyFromSecret(secret){
 // Domain-separated HKDF: rotating OAuth secret invalidates existing sessions.
 const material=await crypto.subtle.importKey("raw",te.encode(secret),"HKDF",false,["deriveKey"]);
 return crypto.subtle.deriveKey({
  name:"HKDF",hash:"SHA-256",salt:te.encode("SorareFutScout session encryption v1"),
  info:te.encode("KV AES-GCM access and refresh tokens")
 },material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
export async function encrypt(env,data){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await keyFromSecret(env.SORARE_OAUTH_CLIENT_SECRET);
 const sealed=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,te.encode(JSON.stringify(data)));
 return JSON.stringify({v:1,iv:toBase64(iv),ct:toBase64(new Uint8Array(sealed))});
}
export async function decrypt(env,text){
 const parsed=JSON.parse(text);
 if(parsed?.v!==1)throw Error("Unexpected session version");
 const key=await keyFromSecret(env.SORARE_OAUTH_CLIENT_SECRET);
 const raw=await crypto.subtle.decrypt({name:"AES-GCM",iv:fromBase64(parsed.iv)},key,fromBase64(parsed.ct));
 return JSON.parse(td.decode(raw));
}
export async function putSession(env,sid,session){
 const body=await encrypt(env,session);
 await env.SFS_SESSIONS.put("sfs:session:"+sid,body,{expirationTtl:TTL});
}
export async function getSession(env,request){
 const sid=cookie(request,SESSION_COOKIE);
 if(!/^[A-Za-z0-9_-]{43}$/.test(sid))return null;
 const encrypted=await env.SFS_SESSIONS.get("sfs:session:"+sid);
 if(!encrypted)return null;
 try{
  const session=await decrypt(env,encrypted);
  if(!session||!validToken(session.accessToken)||!validToken(session.refreshToken)||
     typeof session.slug!=="string"||session.slug.length>150||!Number.isFinite(session.expireAt))return null;
  return {sid,session};
 }catch(_){return null;}
}
export async function tokenRequest(env,params){
 const body=new URLSearchParams({client_id:env.SORARE_OAUTH_CLIENT_ID,
  client_secret:env.SORARE_OAUTH_CLIENT_SECRET,...params});
 const response=await fetch("https://api.sorare.com/oauth/token",{
  method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","accept":"application/json"},
  body,signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw Error("Sorare rejected OAuth token request");
 const token=await response.json();
 if(!validToken(token.access_token)||!validToken(token.refresh_token)||
    !Number.isFinite(Number(token.expires_in))||Number(token.expires_in)<60)
   throw Error("Sorare returned incomplete OAuth credentials");
 return token;
}
export async function currentUser(env,accessToken){
 const headers={"content-type":"application/json",accept:"application/json",
  authorization:"Bearer "+accessToken};
 if(env.SORARE_API_KEY)headers.APIKEY=env.SORARE_API_KEY;
 const result=await fetch("https://api.sorare.com/graphql",{
  method:"POST",headers,body:JSON.stringify({
   operationName:"SorareFutScoutAuthenticatedUser",
   query:"query SorareFutScoutAuthenticatedUser { currentUser { slug } }"
  }),signal:AbortSignal.timeout(12000)
 });
 if(!result.ok)throw Error("User profile not available");
 const data=await result.json();
 const slug=data?.data?.currentUser?.slug;
 if(data.errors?.length||typeof slug!=="string"||slug.length<2||slug.length>150)throw Error("Invalid user identity");
 return slug;
}
export async function refreshed(env,record){
 const {sid,session}=record;
 if(session.expireAt>Date.now()+120000)return session;
 const token=await tokenRequest(env,{grant_type:"refresh_token",refresh_token:session.refreshToken});
 const updated={...session,accessToken:token.access_token,refreshToken:token.refresh_token,
  expireAt:Date.now()+Number(token.expires_in)*1000};
 await putSession(env,sid,updated);
 return updated;
}
export async function deleteSession(env,request){
 const sid=cookie(request,SESSION_COOKIE);
 if(/^[A-Za-z0-9_-]{43}$/.test(sid))await env.SFS_SESSIONS.delete("sfs:session:"+sid);
}
