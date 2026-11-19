import {authReady,privateTestEnabled,canonical,noStore,json,cookieHeader,TEST_COOKIE,
 testAccessGranted,makeTestTicket,testSecretMatches} from "../../_lib/sorareOAuth.js";
export async function onRequestGet({request,env}){
 if(!canonical(request))return json({ok:false},403);
 const available=authReady(env)&&privateTestEnabled(env);
 return json({ok:true,testAvailable:available,granted:available&&await testAccessGranted(env,request)});
}
export async function onRequestPost({request,env}){
 if(!canonical(request)||request.headers.get("origin")!=="https://sorarefutscout.pages.dev")
  return json({ok:false,error:"Origen no autorizado."},403);
 if(!authReady(env)||!privateTestEnabled(env))return json({ok:false,error:"Prueba privada no disponible."},404);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return json({ok:false},415);
 const size=Number(request.headers.get("content-length")||0);
 if(size>2048)return json({ok:false},413);
 let body;
 try{const raw=await request.text();if(raw.length>2048)return json({ok:false},413);body=JSON.parse(raw);}
 catch(_){return json({ok:false,error:"Solicitud incorrecta."},400);}
 if(!await testSecretMatches(env,body?.passphrase))return json({ok:false,error:"Clave de prueba incorrecta."},403);
 const ticket=await makeTestTicket(env);
 return json({ok:true,granted:true},200,{"set-cookie":cookieHeader(TEST_COOKIE,ticket,1800)});
}