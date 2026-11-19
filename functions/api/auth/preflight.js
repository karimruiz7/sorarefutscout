// SorareFutScout: diagnóstico de configuración, sin revelar valores.
export async function onRequestGet({env}) {
  const hasText=(v)=>typeof v==="string"&&v.trim().length>0;
  const checks={
    apiKey:hasText(env?.SORARE_API_KEY),
    clientId:hasText(env?.SORARE_OAUTH_CLIENT_ID),
    clientSecret:hasText(env?.SORARE_OAUTH_CLIENT_SECRET),
    privacyContact:hasText(env?.SFS_PRIVACY_CONTACT),
    sessionStorage:Boolean(
      env?.SFS_SESSIONS &&
      typeof env.SFS_SESSIONS.get==="function" &&
      typeof env.SFS_SESSIONS.put==="function" &&
      typeof env.SFS_SESSIONS.delete==="function"
    )
  };
  return new Response(JSON.stringify({
    ok:true,
    infrastructureReady:Object.values(checks).every(Boolean),
    oauthEnabled:env?.SFS_OAUTH_ENABLED==="true",
    checks,
    note:"Solo se comprueba la presencia de las vinculaciones. No verifica las credenciales con Sorare ni escribe en KV."
  }), {
    status:200,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"private, no-store",
      "x-content-type-options":"nosniff",
      "x-robots-tag":"noindex",
      "referrer-policy":"no-referrer"
    }
  });
}
