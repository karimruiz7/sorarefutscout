// Keeps game-mode links and current state synchronized without reloading collection data.
(()=>{
 "use strict";
 const modes=["arcade","pro","arena"];
 const sync=()=>{
  const isClub=location.pathname.replace(/\/$/,"").endsWith("/mis-cartas.html");
  const current=isClub&&modes.includes(location.hash.slice(1))?location.hash.slice(1):isClub?"arcade":null;
  document.querySelectorAll("nav .modos-menu").forEach(menu=>{
   menu.classList.toggle("current",isClub);
   for(const link of menu.querySelectorAll("a[data-game-mode]")){
    if(link.dataset.gameMode===current)link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
   }
  });
 };
 document.addEventListener("DOMContentLoaded",sync);
 window.addEventListener("hashchange",sync);
 document.addEventListener("click",event=>{
  document.querySelectorAll("nav .modos-menu[open]").forEach(menu=>{
   if(!menu.contains(event.target))menu.open=false;
  });
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape")document.querySelectorAll("nav .modos-menu[open]").forEach(menu=>menu.open=false);
 });
})();
