// SorareFutScout · Fase 4.4. Game Weeks: orientación, NO elegibilidad certificada.
// Solo lee la API pública de próximos partidos; nunca modifica cartas o alineaciones.
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const SCARCITIES=["limited","rare","super_rare","unique"];
const SCARCITY_LABEL={limited:"Limited",rare:"Rare",super_rare:"Super Rare",unique:"Unique"};
const MAX_RETRIES=3,MAX_WAIT_SECONDS=300;
let generation=0,ready=false,fixtures=new Map(),players=[],ownedCards=new Map(),catalog=[];
const el=(tag,cls,value)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!==undefined)node.textContent=value;
 return node;
};
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
const points=n=>Number.isFinite(n)?n.toLocaleString("es-ES",{maximumFractionDigits:1}):"—";
function update(message,isError=false,percent=null){
 const status=$("gw-status");
 status.hidden=false;
 status.className=isError?"notice error":"notice";
 status.textContent=message;
 if(percent!==null){
  $("gw-progress").hidden=false;
  $("gw-progress").value=Math.max(0,Math.min(100,percent));
 }
}
function reset(){
 generation++;ready=false;fixtures=new Map();players=[];ownedCards=new Map();catalog=[];
 $("gw-results").hidden=true;
 $("gw-week").replaceChildren();
 $("gw-rarity").replaceChildren();
 $("gw-lineups").replaceChildren();
 $("gw-progress").hidden=true;
 $("gw-status").hidden=true;
 $("gw-week").disabled=true;$("gw-rarity").disabled=true;
}
function imageFor(p){
 const fallback=el("div","auto-avatar",(p.name||"?").slice(0,2).toUpperCase());
 if(p.avatar){
  try{
   const url=new URL(p.avatar);
   if(url.protocol==="https:"&&(url.hostname==="sorare.com"||url.hostname.endsWith(".sorare.com"))){
    const img=el("img","auto-avatar");img.alt="";img.loading="lazy";img.src=url.href;
    img.addEventListener("error",()=>img.replaceWith(fallback),{once:true});return img;
   }
  }catch(_){}
 }
 return fallback;
}
async function getFixtures(slugs,token,pct){
 for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
  if(generation!==token)return null;
  let response,data;
  try{
   response=await fetch("/api/next-games?slugs="+encodeURIComponent(slugs.join(",")),
    {credentials:"same-origin",cache:"no-store"});
   data=await response.json();
  }catch(_){
   if(attempt===MAX_RETRIES)throw Error("Fallo de red al consultar el calendario de Sorare.");
   update("Conexión temporalmente interrumpida. Reintentando calendario…",false,pct);
   await delay((attempt+1)*1600);continue;
  }
  if(response.status===429||data?.reason==="rate_limit"){
   const seconds=Number(response.headers.get("retry-after"))||
    Number(data?.retryAfter)||60;
   if(attempt===MAX_RETRIES||seconds>MAX_WAIT_SECONDS){
    throw Error("Sorare ha limitado las consultas del calendario. El análisis por Game Week ha quedado incompleto; no se presentarán resultados como definitivos.");
   }
   for(let remaining=Math.max(1,Math.ceil(seconds));remaining>0;remaining--){
    if(generation!==token)return null;
    update("Sorare ha pedido una pausa: "+remaining+" s. Conservamos tu análisis estadístico.",false,pct);
    await delay(1000);
   }
   continue;
  }
  if(!response.ok||!data?.ok){
   if(response.status>=500&&attempt<MAX_RETRIES){
    update("Sorare no responde al calendario. Reintentando…",false,pct);
    await delay((attempt+1)*2000);continue;
   }
   throw Error("No se ha completado el calendario ("+String(data?.error||"HTTP "+response.status).slice(0,95)+").");
  }
  if(!Array.isArray(data.fixtures))throw Error("Sorare devolvió un calendario con formato inesperado.");
  return data.fixtures;
 }
 throw Error("No ha sido posible consultar el calendario.");
}
function getOwned(p,scarcity){
 return (ownedCards.get(p.slug)||[]).filter(c=>c.rarity===scarcity)
  .sort((a,b)=>((b.season||0)-(a.season||0)))[0]||null;
}
function option(value,text){const n=el("option","",text);n.value=value;return n;}
function render(){
 if(!ready)return;
 const root=$("gw-lineups");root.replaceChildren();
 const value=$("gw-week").value,scarcity=$("gw-rarity").value;
 if(!value||!scarcity)return;
 const weekNumber=Number(value);
 const eligible=players.filter(p=>
  getOwned(p,scarcity)!==null&&fixtures.get(p.slug)?.status==="scheduled"&&
  fixtures.get(p.slug)?.game?.gw===weekNumber);
 const ranked=window.SorareAuto?.rank(eligible,$("auto-metric").value)||[];
 const summary=$("gw-summary");
 summary.textContent="GW "+weekNumber+" · "+SCARCITY_LABEL[scarcity]+" · "+
  eligible.length+" futbolistas distintos con próximo partido registrado en esta GW. "+
  "La elegibilidad real de cartas y competiciones sigue pendiente de verificar.";
 if(!ranked.length){
  root.append(el("div","notice",
   "Con los futbolistas comprobados no hay suficientes cartas de esta rareza, con partido registrado en la GW, estadísticas disponibles y posiciones SO5 compatibles. No se completa el quinteto con jugadores de otra semana."));
  return;
 }
 const first=ranked[0].sum;
 ranked.forEach((selection,index)=>{
  const card=el("section","auto-choice");
  const head=el("div","auto-choice-heading");
  head.append(el("h3","",index===0?"Quinteto candidato por GW":"Alternativa "+(index+1)));
  head.append(el("strong","auto-score",points(selection.sum)+" puntos · "+$("auto-metric").value.toUpperCase()));
  card.append(head);
  if(index)card.append(el("p","muted","Diferencia respecto al primero: "+points(selection.sum-first)+" puntos de medias acumuladas"));
  const grid=el("div","auto-five");
  for(const pick of selection.picks){
   const player=pick.player,details=fixtures.get(player.slug)?.game;
   const cardData=getOwned(player,scarcity);
   const box=el("article","auto-player");
   box.append(el("span","muted",["Portero","Defensa","Centrocampista","Delantero","Extra"][pick.slot]));
   box.append(imageFor(player),el("strong","",player.name));
   box.append(el("span","muted",SCARCITY_LABEL[scarcity]+" · Temporada "+(cardData?.season??"sin confirmar")));
   box.append(el("span","muted",(details?.home||"?")+" - "+(details?.away||"?")));
   box.append(el("strong","auto-score",points(player[$("auto-metric").value])));
   grid.append(box);
  }
  card.append(grid);root.append(card);
 });
}
async function start(payload){
 reset();
 const token=generation;
 players=Array.isArray(payload?.players)?payload.players:[];
 ownedCards=payload?.ownedCards instanceof Map?payload.ownedCards:new Map();
 $("gw-results").hidden=false;
 const byRarity=Object.fromEntries(SCARCITIES.map(r=>[r,0]));
 const slugs=[];
 for(const p of players){
  const cardSet=ownedCards.get(p.slug)||[];
  const kinds=new Set(cardSet.map(c=>c.rarity).filter(c=>SCARCITIES.includes(c)));
  for(const k of kinds)byRarity[k]++;
  if(kinds.size)slugs.push(p.slug);
 }
 const inventory=SCARCITIES.map(k=>SCARCITY_LABEL[k]+": "+byRarity[k]).join(" · ");
 $("gw-inventory").textContent="Futbolistas distintos con cartas Pro conocidas: "+slugs.length+
  " · "+inventory+". Estas cifras no acreditan la elegibilidad de cada carta.";
 if(!slugs.length){
  update("No aparecen cartas Limited, Rare, Super Rare o Unique entre los futbolistas analizados. No podemos construir una alineación Pro/Arena verificable con estas cartas. Arcade requiere comprobar el Set y las misiones concretas.",false);
  $("gw-summary").textContent="Tus quintetos L5/L10/L15 permanecen visibles arriba como análisis estadístico.";
  return;
 }
 const chunks=[];
 for(let i=0;i<slugs.length;i+=12)chunks.push(slugs.slice(i,i+12));
 try{
  update("Consultando el próximo partido SO5 registrado por Sorare para "+slugs.length+
   " futbolistas con cartas Pro…",false,0);
  for(let i=0;i<chunks.length;i++){
   if(generation!==token)return;
   const pct=Math.round(i/chunks.length*100);
   update("Analizando Game Weeks: grupo "+(i+1)+" de "+chunks.length+"…",false,pct);
   const results=await getFixtures(chunks[i],token,pct);
   if(!results)return;
   for(const obj of results)if(typeof obj?.slug==="string")fixtures.set(obj.slug,obj);
   if(i<chunks.length-1)await delay(1300);
  }
  if(generation!==token)return;
  const grouped=new Map();
  for(const value of fixtures.values()){
   const g=value.game,gw=g?.gw;
   if(value.status!=="scheduled"||!Number.isInteger(gw))continue;
   const d=Date.parse(g.date);
   if(!Number.isFinite(d))continue;
   const prev=grouped.get(gw);
   if(prev===undefined||d<prev)grouped.set(gw,d);
  }
  const weeks=[...grouped.entries()].sort((a,b)=>a[1]-b[1]);
  if(!weeks.length){
   update("Calendario consultado, pero Sorare no ha devuelto una próxima Game Week identificable para estas cartas.",false,100);
   $("gw-summary").textContent="No hay quintetos por Game Week verificables con estos datos.";
   return;
  }
  for(const k of SCARCITIES)if(byRarity[k])$("gw-rarity").append(option(k,SCARCITY_LABEL[k]+" ("+byRarity[k]+" futbolistas)"));
  for(const [gw,d] of weeks){
   $("gw-week").append(option(String(gw),"GW "+gw+" · desde "+new Date(d).toLocaleDateString("es-ES")));
  }
  $("gw-rarity").disabled=false;$("gw-week").disabled=false;
  ready=true;
  update("Calendario consultado para "+fixtures.size+" futbolistas. Selecciona Game Week y rareza; solo mostramos candidatos, no elegibilidad confirmada.",false,100);
  render();
 }catch(error){
  if(generation!==token)return;
  fixtures=new Map();ready=false;
  update((error?.message||"No se ha podido consultar la Game Week.")+
    " El quinteto estadístico general sigue disponible.",true);
  $("gw-summary").textContent="Calendario incompleto: ningún quinteto GW calculado.";
 }
}
$("gw-week").addEventListener("change",render);
$("gw-rarity").addEventListener("change",render);
window.SorareGW={start,reset,render};
})();
