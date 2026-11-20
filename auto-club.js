// SorareFutScout · Fase 4.3 · Análisis voluntario de la colección completa.
// Solo lectura. Las cartas, sus estadísticas y los resultados viven en la pestaña actual.
// La clasificación es estadística, no acredita elegibilidad para Arcade/Pro/Arena.
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const names={Goalkeeper:"Portero",Defender:"Defensa",Midfielder:"Centrocampista",Forward:"Delantero"};
 const slots=[
  {name:"Portero",pos:"Goalkeeper"},
  {name:"Defensa",pos:"Defender"},
  {name:"Centrocampista",pos:"Midfielder"},
  {name:"Delantero",pos:"Forward"},
  {name:"Extra",pos:"Extra"}
 ];
 const MAX_PAGES=200, MAX_RETRIES=3;
 let working=false,players=[],choices=[],cardCount=0,complete=false,ownedCards=new Map();
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const fmt=n=>Number.isFinite(n)?n.toLocaleString("es-ES",{maximumFractionDigits:1}):"—";
 const newEl=(tag,className,content)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(content!==undefined)el.textContent=content;
  return el;
 };
 const progress=(message,percent)=>{
  $("auto-status").hidden=false;
  $("auto-status").textContent=message;
  $("auto-progress").hidden=false;
  $("auto-progress").value=Math.max(0,Math.min(100,percent));
 };
 const fail=msg=>{
  $("auto-status").hidden=false;
  $("auto-status").textContent=msg;
  $("auto-status").className="notice error";
 };
 async function request(url,options={}){
  for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
   let response,data;
   try{
    response=await fetch(url,{...options,credentials:"same-origin",cache:"no-store"});
    data=await response.json();
   }catch(error){
    if(attempt===MAX_RETRIES)throw Error("Error de conexión al consultar Sorare. No se han generado recomendaciones parciales.");
    progress("Problema de conexión. Reintentando la consulta…",$("auto-progress").value);
    await sleep(1500*(attempt+1));continue;
   }
   if(response.status===429||data?.error==="limite_de_sorare"){
    const header=Number(response.headers.get("retry-after"));
    const seconds=Number.isFinite(header)&&header>0?header:
     Number(data?.retryAfterSeconds)>0?Number(data.retryAfterSeconds):60;
    if(attempt===MAX_RETRIES||seconds>300)
     throw Error("Sorare ha limitado temporalmente las consultas. Prueba de nuevo más adelante. No se mostrará una alineación calculada con una colección incompleta.");
    const secondsSafe=Math.max(1,Math.ceil(seconds));
    for(let remaining=secondsSafe;remaining>0;remaining--){
     progress("Sorare solicita esperar "+remaining+" s antes de continuar. El análisis seguirá automáticamente…",$("auto-progress").value);
     await sleep(1000);
    }
    continue;
   }
   if(!response.ok||!data?.ok){
    if(data?.error==="prueba_privada_caducada"){
     $("renew-test").hidden=false;
     throw Error("El permiso de la beta privada ha caducado. Renueva el acceso desde Mi club sin desconectar tu cuenta Sorare y vuelve a iniciar el análisis.");
    }
    if(response.status===502||response.status===503||response.status===504){
     if(attempt<MAX_RETRIES){
      progress("Respuesta temporal de Sorare. Reintentando…",$("auto-progress").value);
      await sleep(1800*(attempt+1));continue;
     }
    }
    throw Error("La consulta no se ha completado ("+String(data?.error||"HTTP "+response.status).slice(0,80)+"). No se han generado recomendaciones parciales.");
   }
   return data;
  }
  throw Error("No se pudo completar la consulta a Sorare.");
 }
 function possibilities(collection,metricKey=metric()){
  const states=Array.from({length:32},()=>[]);
  states[0]=[{sum:0,picks:[],signature:""}];
  const LIMIT=8;
  const insert=(bucket,candidate)=>{
   const found=bucket.findIndex(item=>item.signature===candidate.signature);
   if(found>=0){
    if(bucket[found].sum>=candidate.sum-1e-9)return;
    bucket.splice(found,1);
   }
   bucket.push(candidate);
   bucket.sort((a,b)=>b.sum-a.sum||a.signature.localeCompare(b.signature));
   if(bucket.length>LIMIT)bucket.length=LIMIT;
  };
  for(const player of collection){
   const value=player[metricKey];
   if(typeof value!=="number"||!Number.isFinite(value))continue;
   for(let mask=31;mask>=0;mask--){
    for(const previous of states[mask]){
     for(let slot=0;slot<5;slot++){
      if(mask&(1<<slot))continue;
      if(slots[slot].pos!=="Extra"&&slots[slot].pos!==player.position)continue;
      if(slots[slot].pos==="Extra"&&player.position==="Goalkeeper")continue;
      const picks=[...previous.picks,{slot,player}];
      const signature=picks.map(x=>x.player.slug).sort().join("|");
      insert(states[mask|(1<<slot)],{
       sum:previous.sum+value,picks,signature
      });
     }
    }
   }
  }
  return states[31].slice(0,3).map(item=>({
   ...item,picks:item.picks.sort((a,b)=>a.slot-b.slot)
  }));
 }
 function metric(){return $("auto-metric").value;}
 function photo(player){
  const fallback=newEl("div","auto-avatar",player.name.slice(0,2).toUpperCase());
  if(player.avatar){
   try{
    const u=new URL(player.avatar);
    if(u.protocol==="https:"&&(u.hostname==="sorare.com"||u.hostname.endsWith(".sorare.com"))){
     const img=newEl("img","auto-avatar");
     img.src=u.href;img.alt="";img.loading="lazy";
     img.addEventListener("error",()=>img.replaceWith(fallback),{once:true});
     return img;
    }
   }catch(_){}
  }
  return fallback;
 }
 function showResults(){
  choices=possibilities(players);
  const root=$("auto-lineups");root.replaceChildren();
  const metricName=metric().toUpperCase();
  if(!choices.length){
   root.append(newEl("div","notice error",
    "No hay cinco futbolistas diferentes con estadísticas suficientes para las posiciones SO5. No se ha inventado ninguna alineación."));
   return;
  }
  const best=choices[0].sum;
  choices.forEach((choice,index)=>{
   const section=newEl("section","auto-choice");
   const heading=newEl("div","auto-choice-heading");
   heading.append(newEl("h3","",index===0?"Mejor quinteto":"Alternativa "+(index+1)));
   heading.append(newEl("strong","auto-score",fmt(choice.sum)+" puntos · "+metricName));
   section.append(heading);
   if(index) section.append(newEl("p","muted","Diferencia respecto a la primera: "+fmt(choice.sum-best)+" puntos de media acumulada"));
   const grid=newEl("div","auto-five");
   for(const pick of choice.picks){
    const item=newEl("article","auto-player");
    item.append(newEl("span","muted",slots[pick.slot].name),photo(pick.player));
    item.append(newEl("strong","",pick.player.name));
    item.append(newEl("span","muted",pick.player.club));
    item.append(newEl("strong","auto-score",fmt(pick.player[metric()])));
    grid.append(item);
   }
   section.append(grid);root.append(section);
  });
 }
 async function run(){
  if(working)return;
  working=true;complete=false;players=[];choices=[];cardCount=0;ownedCards=new Map();
  window.SorareGW?.reset();
  window.SorareModes?.reset();
  $("load").disabled=true;
  $("preview").disabled=true;
  $("auto-results").hidden=false;
  $("auto-lineups").replaceChildren();
  $("auto-metric").disabled=true;
  $("auto-status").className="notice";
  $("auto-summary").textContent="Analizando tu colección completa…";
  try{
   let after=null,account=null,pages=0,expected=null;
   const seenCards=new Set(),uniquePlayers=new Map(),visitedCursors=new Set();
   while(true){
    if(pages>=MAX_PAGES)throw Error("Límite de seguridad de páginas alcanzado. No se han calculado quintetos con una colección incompleta.");
    progress("Recuperando cartas de tu cuenta: "+cardCount+(expected?" de "+expected:"")+"…",
     expected?Math.min(48,cardCount/expected*48):Math.min(40,pages));
    const url="/api/my-cards"+(after?"?after="+encodeURIComponent(after):"");
    const data=await request(url);
    if(!account)account=data.account;
    if(!data.account||account!==data.account)throw Error("La cuenta de Sorare ha cambiado durante la consulta. Inicia de nuevo el análisis.");
    pages++;
    if(Number.isInteger(data.totalCount))expected=data.totalCount;
    if(!Array.isArray(data.cards)||!data.pagination)throw Error("Sorare devolvió una página de cartas incompleta.");
    for(const card of data.cards){
     const id=card.assetId||card.cardSlug;
     if(!id||seenCards.has(id))continue;
     seenCards.add(id);cardCount++;
     if(!card.playerSlug)continue;
     if(!ownedCards.has(card.playerSlug))ownedCards.set(card.playerSlug,[]);
     ownedCards.get(card.playerSlug).push({
      assetId:id,rarity:String(card.rarity||"").toLowerCase(),season:card.season,cardSlug:card.cardSlug||"",
      setId:typeof card.cardSet?.id==="string"?card.cardSet.id:null,
      setSlug:typeof card.cardSet?.slug==="string"?card.cardSet.slug:null,
      setName:typeof card.cardSet?.name==="string"?card.cardSet.name:null,
      edition:typeof card.cardEditionName==="string"?card.cardEditionName:null
     });
     if(!uniquePlayers.has(card.playerSlug)){
      uniquePlayers.set(card.playerSlug,{
       slug:card.playerSlug,name:card.name||"Jugador",
       club:card.club||"Sin club",avatar:card.playerPicture||null
      });
     }
    }
    if(!data.pagination.hasNextPage)break;
    const next=data.pagination.nextCursor;
    if(!next||visitedCursors.has(next))throw Error("La paginación de Sorare no ha avanzado. Análisis detenido para evitar resultados incompletos.");
    visitedCursors.add(next);after=next;
    await sleep(800);
   }
   if(!uniquePlayers.size)throw Error("Sorare no ha devuelto futbolistas compatibles para analizar.");
   const entries=[...uniquePlayers.values()];
   const resolved=new Map();
   const batches=Math.ceil(entries.length/20);
   for(let i=0;i<batches;i++){
    progress("Cartas recuperadas: "+cardCount+". Consultando estadísticas: bloque "+(i+1)+" de "+batches+"…",
     50+Math.round(i/batches*49));
    const batch=entries.slice(i*20,(i+1)*20);
    const data=await request("/api/import-player-stats",{
     method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({slugs:batch.map(p=>p.slug)})
    });
    if(!Array.isArray(data.players))throw Error("Sorare no devolvió estadísticas válidas.");
    for(const p of data.players){
     const owned=uniquePlayers.get(p.slug);
     if(!owned)continue;
     resolved.set(p.slug,{...owned,...p,
      avatar:owned.avatar,l5:p.l5,l10:p.l10,l15:p.l15
     });
    }
    if(i<batches-1)await sleep(900);
   }
   players=[...resolved.values()];
   complete=true;
   progress("Análisis estadístico completado.",100);
   const lacking=entries.length-resolved.size;
   $("auto-summary").textContent=cardCount+" cartas leídas · "+entries.length+
    " futbolistas distintos · "+players.length+" con ficha estadística"+
    (lacking?" · "+lacking+" sin ficha":"");
   showResults();
   $("auto-metric").disabled=false;
   window.SorareModes?.start({players,ownedCards,cardCount});
   window.SorareGW?.start({players,ownedCards,cardCount});
  }catch(err){
   complete=false;players=[];choices=[];
   $("auto-lineups").replaceChildren();
   fail(err?.message||"No se ha podido completar el análisis.");
   $("auto-summary").textContent="Análisis interrumpido. No se muestran quintetos calculados con datos parciales.";
  }finally{
   working=false;
   $("load").disabled=false;
   $("preview").disabled=false;
  }
 }
 $("auto-metric").addEventListener("change",()=>{if(complete)showResults();window.SorareModes?.render();window.SorareGW?.render();});
 window.SorareAuto={run,rank:(data,metricKey)=>possibilities(data,metricKey)};
})();
