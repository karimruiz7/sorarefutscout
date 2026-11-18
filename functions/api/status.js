// Diagnóstico público limitado: no devuelve valores secretos ni credenciales.
// Confirma solo si Cloudflare inyectó el binding en la función.
export async function onRequestGet(context) {
  const key=context.env?.SORARE_API_KEY;
  const configured=typeof key==="string" && key.trim().length>0;
  return new Response(JSON.stringify({
    ok:true,
    apiKeyConfigured:configured,
    note:"Solo indica presencia del secreto en Cloudflare; no valida la clave contra Sorare ni acredita permisos OAuth."
  }),{
    status:200,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store, private",
      "x-content-type-options":"nosniff",
      "x-robots-tag":"noindex"
    }
  });
}