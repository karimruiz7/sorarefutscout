// SorareFutScout: Search headlines only. Headlines are NOT verified injury statuses.
const MAX_AGE=14*86400000;
function send(data,status=200,extra={}){
 return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",
 "x-content-type-options":"nosniff","cache-control":"no-store",...extra}});
}
function decode(s){return String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
 .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Math.min(1114111,parseInt(n,16))))
 .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Math.min(1114111,parseInt(n,10))))
 .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,n)=>({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "})[n.toLowerCase()])
 .replace(/<[^>]{0,200}>/g,"").replace(/\s+/g," ").trim();}
function tag(v,n){return v.match(new RegExp("<"+n+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+n+">","i"))?.[1]||"";}
function parseRSS(xml){
 const out=[],now=Date.now();
 for(const found of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)){
  const v=found[1],title=decode(tag(v,"title")).slice(0,230);
  const link=decode(tag(v,"link")).slice(0,1024);
  const stamp=Date.parse(decode(tag(v,"pubDate")));
  if(!title||!Number.isFinite(stamp)||stamp<now-MAX_AGE||stamp>now+3600000)continue;
  try{
   const url=new URL(link);
   if(url.protocol!=="https:"||url.hostname!=="news.google.com")continue;
   out.push({title,url:url.href,source:decode(tag(v,"source")).slice(0,90)||"Google Noticias",
    publishedAt:new Date(stamp).toISOString()});
  }catch(_){}
  if(out.length>=8)break;
 }
 return out;
}
function valid(s,max){return typeof s==="string"&&s.length>=2&&s.length<=max&&/^[\p{L}\p{M}\d\s.'-]+$/u.test(s);}
export async function onRequestGet({request,waitUntil}){
 const u=new URL(request.url),name=(u.searchParams.get("name")||"").trim(),
 club=(u.searchParams.get("club")||"").trim();
 if(!valid(name,65)||(club&&!valid(club,85)))return send({ok:false,error:"Nombre o equipo no válido."},400);
 const q='"'+name+'"'+(club?' "'+club+'"':'')+" (lesión OR baja OR sanción OR convocatoria OR titular OR injury OR doubt) when:14d";
 const news=new URL("https://news.google.com/rss/search");
 news.searchParams.set("q",q);news.searchParams.set("hl","es");news.searchParams.set("gl","ES");news.searchParams.set("ceid","ES:es");
 const cacheKey=new Request(u.origin+"/api/news?version=1&name="+encodeURIComponent(name.toLowerCase())+"&club="+encodeURIComponent(club.toLowerCase()));
 let cache;
 try{cache=caches.default;const old=await cache.match(cacheKey);if(old)return old;}catch(_){}
 let upstream;
 try{upstream=await fetch(news.href,{headers:{accept:"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(10000)});}
 catch(_){return send({ok:false,error:"No se ha podido contactar con el proveedor de noticias."},502);}
 if(!upstream.ok)return send({ok:false,error:"El proveedor de noticias no está disponible."},502);
 const xml=await upstream.text();
 if(xml.length>750000||!/<rss[\s>]/i.test(xml)||!/<channel[\s>]/i.test(xml))return send({ok:false,error:"No se recibió un feed de noticias válido."},502);
 const response=send({ok:true,source:"Google Noticias (RSS)",fetchedAt:new Date().toISOString(),player:name,
  news:parseRSS(xml),note:"Titulares de búsqueda; no certifican lesiones, sanciones, disponibilidad ni titularidad."},200,
  {"cache-control":"public, max-age=60, s-maxage=900"});
 if(cache&&typeof waitUntil==="function")waitUntil(cache.put(cacheKey,response.clone()).catch(()=>{}));
 return response;
}
