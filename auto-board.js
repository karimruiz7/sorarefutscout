// SorareFutScout · Fase 4.6 · Divination board as a MANUAL, local reference.
// No scraping, no claim of official Set eligibility, progression or lives sync.
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const stages=[
  {points:260,reward:"2.000 Essence"},
  {points:300,reward:"5.000 Essence"},
  {points:360,reward:"10 Gems"},
  {points:400,reward:"30 Gems"},
  {points:440,reward:"100 € · bonus adicional"},
  {points:480,reward:"1.000 € · bonus adicional"}
 ];
 let active=0,lives=Array(6).fill(4),rank=null,metric="l5",available=0;
 const make=(tag,klass,txt)=>{
  const item=document.createElement(tag);if(klass)item.className=klass;
  if(txt!==undefined)item.textContent=txt;return item;
 };
 const fmt=n=>Number.isFinite(n)?n.toLocaleString("es-ES",{maximumFractionDigits:1}):"—";
 const hearts=n=>"♥".repeat(n)+"♡".repeat(4-n);
 function draw(){
  const container=$("divination-steps");
  container.replaceChildren();
  stages.forEach((s,i)=>{
   const button=make("button","divination-step");
   button.type="button";
   button.setAttribute("aria-pressed",String(active===i));
   button.append(
    make("span","divination-level","Nivel "+(i+1)),
    make("strong","divination-target",s.points+" puntos"),
    make("span","divination-reward",s.reward),
    make("span","divination-hearts",hearts(lives[i]))
   );
   button.addEventListener("click",()=>{
    active=i;draw();
   });
   container.append(button);
  });
  $("divination-selected").textContent="Nivel "+(active+1)+" · objetivo "+stages[active].points+
   " puntos · "+lives[active]+" de 4 vidas registradas manualmente.";
  $("divination-lives").value=String(lives[active]);
  const note=$("divination-reference");
  if(!rank){
   note.textContent="Sin quinteto de referencia entre los futbolistas con cartas del Set Divination identificado. "+
    "Puede faltar alguna posición o media, y queda pendiente validar el tablero y sus reglas.";
   return;
  }
  const target=stages[active].points;
  const diff=rank.sum-target;
  const captain=rank.picks.find(p=>p.player.slug===rank.captainSlug)?.player;
  note.textContent="Referencia sobre medias históricas "+metric.toUpperCase()+
   ": "+fmt(rank.raw)+" puntos base + "+fmt(rank.sum-rank.raw)+
   " de capitán"+(captain?" ("+captain.name+")":"")+
   " = "+fmt(rank.sum)+". Distancia al objetivo: "+(diff>=0?"+":"")+fmt(diff)+
   " puntos. Las cartas pertenecen al Set Divination según Sorare; NO garantiza que estén habilitadas para este nivel, ni predice puntos. No incorpora bonus de edición.";
 }
 function update(choice,metricKey,count){
  rank=choice&&Number.isFinite(choice.sum)?choice:null;
  metric=typeof metricKey==="string"?metricKey:"l5";
  available=Number(count)||0;
  $("divination-status").textContent="Tablero Divination de referencia (vidas y nivel sin sincronización). "+
   available+" futbolistas con cartas del Set Divination identificadas por Sorare. Elegibilidad específica pendiente.";
  draw();
 }
 function reset(){
  active=0;lives=Array(6).fill(4);rank=null;metric="l5";available=0;
  $("divination-steps").replaceChildren();
  $("divination-selected").textContent="Los niveles se pueden seleccionar manualmente tras analizar las cartas.";
  $("divination-reference").textContent="Completa la consulta para comparar las medias con cada objetivo.";
  $("divination-status").textContent="Esta herramienta aún no conoce automáticamente tu nivel ni tus vidas.";
 }
 $("divination-lives").addEventListener("change",()=>{
  const n=Number($("divination-lives").value);
  if(Number.isInteger(n)&&n>=0&&n<=4){lives[active]=n;draw();}
 });
 reset();
 draw();
 window.SorareBoard={update,reset};
})();
