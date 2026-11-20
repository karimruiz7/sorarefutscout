// SorareFutScout · Fase 4.5 · Tres experiencias sobre la colección de CADA usuario.
// Common -> exploración independiente; NO acreditan cartas Set de Arcade. Limited/Rare/SR/Unique ->
// candidatos Pro/Arena sujetos a elegibilidad de cada competición.
// Nunca se mezclan cartas de modos distintos ni se garantiza inscripción.
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const tabs=["arcade","pro","arena","libre"];
const requestedMode=()=>{
 const hash=window.location.hash.replace(/^#/,"").toLowerCase();
 return tabs.includes(hash)?hash:null;
};
function explainEntry(){
 const mode=requestedMode();
 const info=document.getElementById("mode-entry");
 if(info){
  const labels={arcade:"Arcade",pro:"Pro · Competitivo",arena:"Arena · Competitivo",libre:"Análisis libre"};
  info.textContent=mode?"Has elegido "+labels[mode]+". Consulta tu colección para ver las recomendaciones de este modo.":"Elige un modo desde «Modos de juego» o consulta tu club para continuar.";
 }
}
const slots=["Portero","Defensa","Centrocampista","Delantero","Extra"];
let active="arcade",allPlayers=[],cardsByPlayer=new Map(),countByRarity={},setInventory=new Map(),completed=false;
const make=(tag,klass,content)=>{
 const node=document.createElement(tag);
 if(klass)node.className=klass;
 if(content!==undefined)node.textContent=content;
 return node;
};
const format=n=>Number.isFinite(n)?n.toLocaleString("es-ES",{maximumFractionDigits:1}):"—";
function portrait(p){
 const alt=make("div","auto-avatar",(p.name||"?").slice(0,2).toUpperCase());
 if(typeof p.avatar==="string"){
  try{
   const url=new URL(p.avatar);
   if(url.protocol==="https:"&&(url.hostname==="sorare.com"||url.hostname.endsWith(".sorare.com"))){
    const img=make("img","auto-avatar");
    img.alt="";img.loading="lazy";img.src=url.href;
    img.addEventListener("error",()=>img.replaceWith(alt),{once:true});
    return img;
   }
  }catch(_){}
 }
 return alt;
}

// DP with exactly one 50% captain bonus (Divination reference only).
// Keeps 8 strongest partial configurations per slot mask and captain state.
// These are heuristic top alternatives, not verified entries into Sorare.
function rankArcade(candidates,metricKey){
 const required=["Goalkeeper","Defender","Midfielder","Forward","Extra"];
 const states=Array.from({length:32},()=>[[],[]]),LIMIT=8;
 states[0][0]=[{sum:0,raw:0,picks:[],captainSlug:null,signature:""}];
 const add=(bucket,entry)=>{
  const duplicate=bucket.findIndex(x=>x.signature===entry.signature);
  if(duplicate>=0){
   if(bucket[duplicate].sum>=entry.sum-1e-8)return;
   bucket.splice(duplicate,1);
  }
  bucket.push(entry);
  bucket.sort((a,b)=>b.sum-a.sum||a.signature.localeCompare(b.signature));
  if(bucket.length>LIMIT)bucket.length=LIMIT;
 };
 for(const p of candidates){
  const score=p[metricKey];
  if(!Number.isFinite(score)||score<0)continue;
  for(let mask=31;mask>=0;mask--){
   for(let captainSet=0;captainSet<=1;captainSet++){
    const previousStates=states[mask][captainSet];
    if(!previousStates.length)continue;
    for(const previous of previousStates){
     for(let slot=0;slot<5;slot++){
      if((mask&(1<<slot))!==0)continue;
      if(required[slot]!=="Extra"&&p.position!==required[slot])continue;
      if(required[slot]==="Extra"&&p.position==="Goalkeeper")continue;
      const updatedMask=mask|(1<<slot);
      const picks=[...previous.picks,{slot,player:p}];
      const signature=picks.map(x=>x.player.slug).sort().join("|");
      add(states[updatedMask][captainSet],{
       sum:previous.sum+score,raw:previous.raw+score,
       picks,captainSlug:previous.captainSlug,signature
      });
      if(!captainSet){
       add(states[updatedMask][1],{
        sum:previous.sum+score*1.5,raw:previous.raw+score,
        picks,captainSlug:p.slug,signature
       });
      }
     }
    }
   }
  }
 }
 return states[31][1].slice(0,3).map(entry=>({
  ...entry,picks:entry.picks.sort((a,b)=>a.slot-b.slot)
 }));
}


const setKey=c=>typeof c?.setSlug==="string"?c.setSlug.trim().toLowerCase():"";
function cardInSet(player,slug){
 return (cardsByPlayer.get(player.slug)||[]).find(c=>setKey(c)===slug)||null;
}
function isDivination(set){
 return !!set&&(set.slug==="divination"||set.name.trim().toLowerCase()==="divination");
}
function readSets(){
 setInventory=new Map();
 for(const cards of cardsByPlayer.values()){
  for(const card of cards){
   const slug=setKey(card);
   if(!slug)continue;
   if(!setInventory.has(slug))
    setInventory.set(slug,{slug,name:typeof card.setName==="string"&&card.setName.trim()?card.setName.trim():slug,cards:0,editions:new Set()});
   const item=setInventory.get(slug);
   item.cards++;
   if(card.edition)item.editions.add(card.edition);
  }
 }
 const select=$("arcade-set");
 select.replaceChildren();
 const sets=[...setInventory.values()].sort((a,b)=>Number(isDivination(b))-Number(isDivination(a))||a.name.localeCompare(b.name,"es"));
 if(!sets.length){
  const opt=make("option","","No se ha identificado ningún Set en esta colección");
  opt.value="";select.append(opt);select.disabled=true;
  return;
 }
 for(const set of sets){
  const opt=make("option","",set.name+" · "+set.cards+" cartas");
  opt.value=set.slug;select.append(opt);
 }
 select.value=sets[0].slug;
 select.disabled=false;
}

function setActive(which,updateHash=true){
 if(!tabs.includes(which))return;
 if(updateHash&&window.location.hash!=="#"+which)window.location.hash="#"+which;
 active=which;
 for(const mode of tabs){
  const btn=$("mode-"+mode);
  btn.setAttribute("aria-pressed",String(mode===active));
 }
 $("arcade-results").hidden=active!=="arcade";
 $("mode-proarena").hidden=active!=="pro"&&active!=="arena";
 $("auto-general").hidden=active!=="libre";
 const modeText={
  arcade:"Arcade · clasifica las cartas por el Set oficial que devuelve Sorare. El Set está identificado, pero el tablero y las reglas de cada nivel siguen pendientes de comprobar.",
  pro:"Pro · candidatos por rareza y Game Week. No se han validado las restricciones del tablero o las cartas In-Season.",
  arena:"Arena · preselección estadística por rareza y Game Week. No se han validado las reglas específicas de Arena ni si una carta ya está en Pro.",
  libre:"Análisis libre · todos los futbolistas recuperados, sin exigir compatibilidad con ninguna competición."
 };
 $("mode-info").textContent=modeText[active];
 $("gw-heading").textContent=active==="arena"?
  "Arena · candidatos por partido y rareza":
  "Pro · candidatos por Game Week y rareza";
}
function render(){
 if(!completed)return;
 const root=$("arcade-lineups");
 root.replaceChildren();
 const selected=setInventory.get($("arcade-set").value);
 const board=$("divination-board");
 board.hidden=!isDivination(selected);
 const totalSets=[...setInventory.values()].reduce((n,s)=>n+s.cards,0);
 const allCards=[...cardsByPlayer.values()].reduce((n,items)=>n+items.length,0);
 $("arcade-inventory").textContent=setInventory.size+" Sets con identificación oficial · "+
  totalSets+" cartas asociadas a un Set · "+(allCards-totalSets)+
  " cartas sin Set declarado en la respuesta. No se confunde rareza Common con un Set.";
 if(!selected){
  $("arcade-set-summary").textContent="Sorare no ha aportado un Set para estas cartas. No podemos afirmar que alguna sea de Divination.";
  root.append(make("div","notice",
   "Sin cartas con Set identificado. El ranking general sigue disponible en «Análisis libre»; no vamos a atribuir cartas Common a Divination sin evidencia."));
  return;
 }
 const eligiblePlayers=allPlayers.filter(player=>cardInSet(player,selected.slug)!==null);
 const divination=isDivination(selected);
 $("arcade-set-summary").textContent="Set «"+selected.name+"» según Sorare: "+
  selected.cards+" cartas, "+eligiblePlayers.length+
  " futbolistas distintos con estadísticas. Esto no confirma disponibilidad para el tablero o nivel activo.";
 const metricKey=$("auto-metric").value;
 const rankings=divination?rankArcade(eligiblePlayers,metricKey):
  (window.SorareAuto?.rank(eligiblePlayers,metricKey)||[]).map(x=>({
   ...x,sum:x.total,raw:x.total,captainSlug:null
  }));
 if(divination)window.SorareBoard?.update(rankings[0]||null,metricKey,eligiblePlayers.length);
 if(!rankings.length){
  root.append(make("div","notice",
   "No hay suficientes futbolistas con cartas de este mismo Set y medias disponibles para formar GK–DF–MD–FW–Extra. No se utilizarán cartas de otros Sets para completar el equipo."));
  return;
 }
 const best=rankings[0].sum;
 rankings.forEach((rank,index)=>{
  const section=make("section","auto-choice");
  const head=make("div","auto-choice-heading");
  head.append(make("h3","",index===0?"Mejor quinteto candidato · "+selected.name:"Alternativa "+(index+1)));
  head.append(make("strong","auto-score",format(rank.sum)+" ref. "+metricKey.toUpperCase()));
  section.append(head);
  section.append(make("p","muted",
   "Suma de medias: "+format(rank.raw)+
   (divination?" · Bonus ilustrativo capitán (+50 %): +"+format(rank.sum-rank.raw)+".":" · Bonus de este Set aún no incorporados.")+
   " No representa puntos futuros ni elegibilidad confirmada."));
  if(index)section.append(make("p","muted","Diferencia respecto al primero: "+
   format(rank.sum-best)+" puntos de referencia"));
  const grid=make("div","auto-five");
  for(const pick of rank.picks){
   const player=pick.player;
   const card=cardInSet(player,selected.slug);
   const slot=make("article","auto-player");
   slot.append(make("span","muted",slots[pick.slot]),portrait(player));
   slot.append(make("strong","",player.name+(player.slug===rank.captainSlug?" · CAPITÁN":"")),make("span","muted",player.club));
   slot.append(make("span","muted",selected.name+" · "+(card?.edition||"Edición sin especificar")));
   slot.append(make("strong","auto-score",format(player[metricKey])));
   grid.append(slot);
  }
  section.append(grid);root.append(section);
 });
}
function reset(){
 completed=false;allPlayers=[];cardsByPlayer=new Map();countByRarity={};setInventory=new Map();
 $("arcade-set").replaceChildren();$("arcade-set").disabled=true;
 $("divination-board").hidden=true;
 window.SorareBoard?.reset();
 $("mode-select").hidden=true;
 $("mode-proarena").hidden=true;
 $("arcade-results").hidden=true;
 $("auto-general").hidden=true;
 $("arcade-lineups").replaceChildren();
}
function start(payload){
 reset();
 allPlayers=Array.isArray(payload?.players)?payload.players:[];
 cardsByPlayer=payload?.ownedCards instanceof Map?payload.ownedCards:new Map();
 for(const cardSet of cardsByPlayer.values()){
  for(const card of cardSet){
   const r=String(card.rarity||"").toLowerCase()||"sin_clasificar";
   countByRarity[r]=(countByRarity[r]||0)+1;
  }
 }
 readSets();
 const commonPlayers=allPlayers.filter(p=>(cardsByPlayer.get(p.slug)||[]).some(c=>c.rarity==="common")).length;
 const proPlayers=allPlayers.filter(p=>(cardsByPlayer.get(p.slug)||[])
  .some(c=>["limited","rare","super_rare","unique"].includes(String(c.rarity||"").toLowerCase()))).length;
 const remaining=Object.entries(countByRarity)
 .filter(([rarity])=>!["common","limited","rare","super_rare","unique"].includes(rarity))
 .reduce((sum,[,count])=>sum+count,0);
 $("mode-arcade").textContent="Arcade · "+setInventory.size+" Sets";
 $("mode-pro").textContent="Pro · "+proPlayers;
 $("mode-arena").textContent="Arena · "+proPlayers;
 $("mode-libre").textContent="Análisis libre · "+allPlayers.length;
 $("mode-counts").textContent=
  "Cartas recuperadas por rareza: "+(countByRarity.common||0)+" Common, "+
  ["limited","rare","super_rare","unique"].reduce((sum,r)=>sum+(countByRarity[r]||0),0)+
  " competitivas"+(remaining?", "+remaining+" de categoría no identificada":"")+
  ". Ninguna carta se ha certificado para los tableros Arcade, Pro o Arena.";
 completed=true;
 $("mode-select").hidden=false;
 render();
 setActive(requestedMode()||(commonPlayers?"arcade":proPlayers?"pro":"libre"),false);
}
$("arcade-set").addEventListener("change",render);
for(const mode of tabs)$("mode-"+mode).addEventListener("click",()=>setActive(mode));
window.addEventListener("hashchange",()=>{
 explainEntry();
 const mode=requestedMode();
 if(completed&&mode)setActive(mode,false);
});
explainEntry();
window.SorareModes={start,reset,render,setActive};
})();
