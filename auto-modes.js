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
let active="arcade",allPlayers=[],cardsByPlayer=new Map(),countByRarity={},completed=false;
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

const isCommon=player=>(cardsByPlayer.get(player.slug)||[])
 .some(card=>String(card.rarity||"").toLowerCase()==="common");
function setActive(which,updateHash=true){
 if(!tabs.includes(which))return;
 if(updateHash&&window.location.hash!=="#"+which)window.location.hash=which;
 active=which;
 for(const mode of tabs){
  const btn=$("mode-"+mode);
  btn.setAttribute("aria-pressed",String(mode===active));
 }
 $("arcade-results").hidden=active!=="arcade";
 $("mode-proarena").hidden=active!=="pro"&&active!=="arena";
 $("auto-general").hidden=active!=="libre";
 const modeText={
  arcade:"Arcade · exploración provisional entre cartas Common. Sorare distingue Common y cartas de Set: sin el identificador del Set activo, ninguna carta aparece como verificada para Arcade.",
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
 const commons=allPlayers.filter(isCommon);
 const root=$("arcade-lineups");
 root.replaceChildren();
 const rankings=rankArcade(commons,$("auto-metric").value);
 window.SorareBoard?.update(rankings[0]||null,$("auto-metric").value,commons.length);
 $("arcade-inventory").textContent=
  (countByRarity.common||0)+" cartas Common detectadas · "+commons.length+
  " futbolistas distintos con estadísticas y al menos una Common. "+
  "El tipo Common NO acredita pertenencia a un Set de Arcade. Son candidatos estadísticos por estudiar, no cartas validadas para competir.";
 if(!rankings.length){
  root.append(make("div","notice",
   "No hay un quinteto completo GK–DF–MD–FW–Extra entre las cartas Common analizadas. No añadimos cartas Limited ni jugadores que no se hayan encontrado en esta colección."));
  return;
 }
 const best=rankings[0].sum;
 rankings.forEach((rank,index)=>{
  const section=make("section","auto-choice");
  const head=make("div","auto-choice-heading");
  head.append(make("h3","",index===0?"Quinteto exploratorio con capitán":"Alternativa "+(index+1)));
  head.append(make("strong","auto-score",format(rank.sum)+" ref. "+$("auto-metric").value.toUpperCase()));
  section.append(head);
  section.append(make("p","muted","Suma de medias: "+format(rank.raw)+" · Bonus ilustrativo capitán (+50 %): +"+format(rank.sum-rank.raw)+". No incluye edición de carta ni resultado real."));
  if(index)section.append(make("p","muted","Diferencia respecto al primero: "+
   format(rank.sum-best)+" puntos de referencia"));
  const grid=make("div","auto-five");
  for(const pick of rank.picks){
   const player=pick.player;
   const slot=make("article","auto-player");
   slot.append(make("span","muted",slots[pick.slot]),portrait(player));
   slot.append(make("strong","",player.name+(player.slug===rank.captainSlug?" · CAPITÁN":"")),make("span","muted",player.club));
   slot.append(make("span","muted","Common · Set no verificado"));
   slot.append(make("strong","auto-score",format(player[$("auto-metric").value])));
   grid.append(slot);
  }
  section.append(grid);root.append(section);
 });
}
function reset(){
 completed=false;allPlayers=[];cardsByPlayer=new Map();countByRarity={};
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
 const commonPlayers=allPlayers.filter(isCommon).length;
 const proPlayers=allPlayers.filter(p=>(cardsByPlayer.get(p.slug)||[])
  .some(c=>["limited","rare","super_rare","unique"].includes(String(c.rarity||"").toLowerCase()))).length;
 const remaining=Object.entries(countByRarity)
 .filter(([rarity])=>!["common","limited","rare","super_rare","unique"].includes(rarity))
 .reduce((sum,[,count])=>sum+count,0);
 $("mode-arcade").textContent="Arcade · revisar";
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
for(const mode of tabs)$("mode-"+mode).addEventListener("click",()=>setActive(mode));
window.addEventListener("hashchange",()=>{
 explainEntry();
 const mode=requestedMode();
 if(completed&&mode)setActive(mode,false);
});
explainEntry();
window.SorareModes={start,reset,render,setActive};
})();
