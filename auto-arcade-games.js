// Fase 4.9 · Partidos puntuables del Set desde Sorare; consulta a petición.
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const make=(tag,cls,value)=>{
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(value!==undefined)n.textContent=value;return n;
 };
 let activeSet="",allPlayers=[],cardMap=new Map(),last=null,loading=false,callVersion=0;
 const nfmt=n=>Number.isFinite(n)?n.toLocaleString("es-ES",{maximumFractionDigits:1}):"—";
 function resetResult(msg){
  $("arcade-games-results").replaceChildren();
  $("arcade-games-status").className="notice";
  $("arcade-games-status").textContent=msg;
 }
 function selectSet(slug,players,cards){
  if(Array.isArray(players))allPlayers=players;
  if(cards instanceof Map)cardMap=cards;
  if(slug===activeSet)return render();
  activeSet=typeof slug==="string"?slug:"";
  callVersion++;last=null;
  $("arcade-check-games").disabled=!activeSet||loading;
  resetResult(activeSet?"Selecciona una fecha y consulta los partidos puntuables de «"+activeSet+"».":"No hay Set identificado para comprobar partidos.");
 }
 function render(){
  const root=$("arcade-games-results");root.replaceChildren();
  if(!last||!activeSet||last.set?.slug!==activeSet)return;
  const upcoming=last.games.filter(g=>Date.parse(g.date)>Date.now());
  const fixtureByClub=new Map();
  for(const g of upcoming){
   for(const slug of [g.home?.slug,g.away?.slug]){
    if(!slug)continue;
    if(!fixtureByClub.has(slug))fixtureByClub.set(slug,[]);
    fixtureByClub.get(slug).push(g);
   }
  }
  const players=allPlayers.filter(p=>p.clubSlug&&fixtureByClub.has(p.clubSlug)&&
   (cardMap.get(p.slug)||[]).some(card=>String(card.setSlug||"").toLowerCase()===activeSet));
  const uniqueMatches=new Set(players.flatMap(p=>fixtureByClub.get(p.clubSlug).map(g=>g.id)));
  const summary=make("p","muted",last.games.length+" encuentros del Set en la ventana consultada · "+
   upcoming.length+" con inicio futuro · "+players.length+
   " futbolistas de tu colección con club coincidente y estadísticas. "+
   "La coincidencia del club NO garantiza que el futbolista participe en ese encuentro.");
  root.append(summary);
  if(players.length){
   const ranked=activeSet==="divination"?
    (window.SorareModes?.rankDivination(players,$("auto-metric").value)||[]):
    (window.SorareAuto?.rank(players,$("auto-metric").value)||[]).map(p=>({
     ...p,sum:p.total,raw:p.total,captainSlug:null
    }));
   if(!ranked.length)root.append(make("div","notice",
    "Todavía no hay cinco futbolistas con partidos registrados que cubran las posiciones requeridas. No completamos el equipo con cartas sin partido de este Set."));
   else{
    const slots=["Portero","Defensa","Centrocampista","Delantero","Extra"];
    ranked.forEach((lineup,index)=>{
     const section=make("section","auto-choice");
     const heading=make("div","auto-choice-heading");
     heading.append(make("h3","",index?"Alternativa "+(index+1):"Quinteto con clubes en partidos puntuables"));
     heading.append(make("strong","auto-score",nfmt(lineup.sum)+" referencia "+$("auto-metric").value.toUpperCase()));
     section.append(heading);
     section.append(make("p","muted","Solo fechas y clubes confirmados como encuentros del Set. "+
      "Suma de medias "+nfmt(lineup.raw)+"; el bonus de capitán, cuando procede, es solo ilustrativo."));
     const grid=make("div","auto-five");
     for(const item of lineup.picks){
      const p=item.player,card=(cardMap.get(p.slug)||[]).find(c=>String(c.setSlug||"").toLowerCase()===activeSet);
      const g=fixtureByClub.get(p.clubSlug)?.[0];
      const node=make("article","auto-player");
      node.append(make("span","muted",slots[item.slot]),
       make("strong","",p.name+(p.slug===lineup.captainSlug?" · CAPITÁN":"")),
       make("span","muted",p.club),
       make("span","muted",(g?.home?.name||"?")+" - "+(g?.away?.name||"?")),
       make("span","muted",g?.date?new Date(g.date).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"}):"Fecha desconocida"),
       make("span","muted",card?.edition||"Edición no indicada"),
       make("strong","auto-score",nfmt(p[$("auto-metric").value])));
      grid.append(node);
     }
     section.append(grid);root.append(section);
    });
   }
  }
  const matches=make("div","arcade-match-list");
  for(const game of last.games.filter(g=>uniqueMatches.has(g.id)).slice(0,20)){
   matches.append(make("span","",(game.home?.name||"?")+" - "+(game.away?.name||"?")+" · "+
    new Date(game.date).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})));
  }
  if(matches.children.length)root.append(matches);
 }
 async function check(){
  if(loading||!activeSet)return;
  const day=$("arcade-day").value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)){
   resetResult("Selecciona una fecha válida para consultar el calendario.");return;
  }
  if(last?.set?.slug===activeSet&&last?.day===day){
   render();return;
  }
  const version=++callVersion;
  loading=true;$("arcade-check-games").disabled=true;
  resetResult("Consultando los partidos puntuables de «"+activeSet+"» directamente en Sorare…");
  try{
   const url="/api/arcade-games?set="+encodeURIComponent(activeSet)+"&day="+encodeURIComponent(day);
   const response=await fetch(url,{credentials:"same-origin",cache:"no-store"});
   const data=await response.json();
   if(version!==callVersion)return;
   if(!response.ok||!data?.ok)throw Error(
    data?.error==="limite_de_sorare"?"Sorare ha limitado temporalmente estas consultas. Respeta la pausa indicada antes de reintentarlo.":
    data?.error==="prueba_privada_caducada"?"La prueba privada ha caducado. Renueva su acceso desde Mi club.":
    "No se han podido recuperar los partidos ("+String(data?.error||"HTTP "+response.status).slice(0,80)+").");
   if(!Array.isArray(data.games)||data.set?.slug!==activeSet)throw Error("Sorare no ha devuelto el calendario esperado.");
   last=data;
   $("arcade-games-status").className="notice good";
   $("arcade-games-status").textContent="Consulta completada: "+data.count+
    " encuentros del Set en la ventana de 48 horas. Se comprueban clubes, no titularidades.";
   render();
  }catch(error){
   if(version!==callVersion)return;
   last=null;rootEmpty();
   $("arcade-games-status").className="notice error";
   $("arcade-games-status").textContent=error?.message||"Fallo al consultar el calendario de Sorare.";
  }finally{
   loading=false;$("arcade-check-games").disabled=!activeSet;
  }
 }
 function rootEmpty(){$("arcade-games-results").replaceChildren();}
 const day=new Date();const localDay=new Date(day.getTime()-day.getTimezoneOffset()*60000).toISOString().slice(0,10);
 $("arcade-day").value=localDay;
 $("arcade-check-games").addEventListener("click",check);
 $("arcade-day").addEventListener("change",()=>{last=null;rootEmpty();});
 window.SorareGameDays={selectSet,render,check};
})();
