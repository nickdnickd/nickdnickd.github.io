(() => {
  const canvas = document.querySelector('#space');
  const ctx = canvas.getContext('2d');
  const $ = (s) => document.querySelector(s);
  const TYPES = [
    {name:'HABITAT KESTREL', short:'HAB', need:'relay', issue:'COMM ARRAY DESYNCHRONIZED', hint:'Telemetry requests a synchronized signal relay.'},
    {name:'REACTOR ANNEX', short:'RX', need:'power', issue:'COOLANT GRID BROWNOUT', hint:'External power will restart the coolant pumps.'},
    {name:'AGRICULTURE DOME', short:'AGR', need:'pulse', issue:'AUTONOMOUS HARVESTER ROGUE', hint:'A focused kinetic pulse can disable its guidance.'},
    {name:'WEATHER STATION', short:'WX', need:'relay', issue:'FORECAST UPLINK LOST', hint:'The station needs an orbital signal relay.'},
    {name:'MASS DRIVER', short:'MD', need:'power', issue:'MAGNETIC CONTAINMENT LOW', hint:'Transfer power before the launch capacitor ruptures.'},
    {name:'DEBRIS APPROACH', short:'OBJ', need:'pulse', issue:'COLLISION VECTOR CONFIRMED', hint:'A kinetic pulse will deflect the object.', isDebris:true}
  ];
  let state, stars=[];
  function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function seedFromText(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
  function missionSeed(){const p=new URLSearchParams(location.search);return p.get('seed')||Math.random().toString(36).slice(2,8).toUpperCase()}
  function init(seed=missionSeed()){
    const r=rng(seedFromText(seed));
    const picked=[TYPES.find(t=>t.isDebris),...TYPES.filter(t=>!t.isDebris).sort(()=>r()-.5).slice(0,3)].sort(()=>r()-.5);
    state={seed,turn:1,maxTurns:18,energy:6,health:100,angle:-Math.PI/2,sites:picked.map((t,i)=>({...t,angle:i*Math.PI/2+(r()-.5)*.35,known:false,resolved:false,failed:false,deadline:t.isDebris?9:7+i*3+Math.floor(r()*2)})),over:false};
    stars=Array.from({length:120},()=>({x:r(),y:r(),a:.15+r()*.55,s:r()*1.3+.2}));
    history.replaceState(null,'',`?seed=${seed}`); $('#seedLabel').textContent=`SEED ${seed}`; log('BOOT','Planetary link established. Four signals detected.'); renderUI(); draw();
  }
  function angularDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))}
  function currentSite(){return state.sites.find(s=>angularDistance(s.angle,state.angle)<.47)}
  function log(tag,msg){const li=document.createElement('li');li.innerHTML=`<b>${tag}</b>${msg}`;$('#log').prepend(li);while($('#log').children.length>5)$('#log').lastChild.remove()}
  function act(action){
    if(state.over)return; const costs={scan:1,relay:2,pulse:3,power:2,coast:0}; const cost=costs[action]; const site=currentSite();
    if(state.energy<cost){log('DENIED','Insufficient energy. Coast to recharge.');return}
    state.energy-=cost;
    if(action==='coast'){state.energy=Math.min(6,state.energy+2);log('CHARGE','Solar collection restored two energy.')}
    else if(!site){log('VOID',`${action.toUpperCase()} transmitted with no surface contact.`)}
    else if(site.failed){log('TOO LATE',`${site.name} can no longer be intercepted.`)}
    else if(action==='scan'){
      site.known=true; log(`S${state.sites.indexOf(site)+1}`,`${site.name}: ${site.issue}.`);
    } else if(!site.known){log('UNKNOWN',`Command reached ${site.name}, but diagnosis was incomplete.`);state.health-=4}
    else if(site.resolved){log('CLEAR',`${site.name} is already stable.`)}
    else if(action===site.need){site.resolved=true;log('SUCCESS',`${site.name} stabilized. Colony risk reduced.`)}
    else {state.health-=8;log('MISMATCH',`Wrong intervention. ${site.issue} persists.`)}
    advance();
  }
  function advance(){
    state.turn++; state.angle+=Math.PI/3;
    state.sites.forEach(s=>{if(!s.resolved&&!s.failed&&state.turn===s.deadline){if(s.isDebris){state.health-=28;s.failed=true;log('IMPACT','Orbital debris struck the colony. Integrity −28%.')}else{state.health-=18;log('FAILURE',`${s.known?s.name:'An unidentified site'} failed. Colony integrity −18%.`);s.deadline+=5}}});
    state.health=Math.max(0,state.health);
    if(state.health<=0||state.turn>state.maxTurns)finish();else{renderUI();draw()}
  }
  function finish(){
    state.over=true;renderUI();draw();const saved=state.sites.filter(s=>s.resolved).length;$('#dialogEyebrow').textContent=state.health>0?'MISSION COMPLETE':'COLONY SIGNAL LOST';$('#dialogTitle').textContent=state.health>0?`${state.health}% of the colony endured.`:'The orbit went quiet.';$('#dialogText').textContent=`You stabilized ${saved} of ${state.sites.length} crises. The same seed always creates the same planet, so you can replay with what you learned.`;$('#beginMission').textContent='REPLAY THIS SEED';$('#briefing').showModal();
  }
  function renderUI(){
    $('#colonyHealth').textContent=state.health;$('#healthMeter').style.width=`${state.health}%`;$('#healthMeter').style.background=state.health<45?'var(--danger)':'var(--safe)';$('#energy').textContent=`${state.energy} / 6`;$('#orbitCount').textContent=`${String(Math.min(state.turn,state.maxTurns)).padStart(2,'0')} / ${state.maxTurns}`;$('#phaseLabel').textContent=['DAWN PHASE','DAY PHASE','DUSK PHASE','NIGHT PHASE'][Math.floor(((state.angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI/2))];
    const site=currentSite();$('#contact').textContent=site?`SECTOR ${state.sites.indexOf(site)+1}`:'DEEP SPACE';$('#targetIndex').textContent=site?`S—${state.sites.indexOf(site)+1}`:'S—';$('#targetName').textContent=site?(site.known?site.name:'UNRESOLVED SIGNAL'):'NO CONTACT';$('#targetDetail').textContent=site?(site.failed?'IMPACT CONFIRMED':site.resolved?'SITE STABLE':site.known?(site.isDebris?`${site.hint} Impact in ${Math.max(0,site.deadline-state.turn)} orbits.`:site.hint):'Deep scan required'):'Awaiting orbital alignment';
    $('#siteList').innerHTML=state.sites.map((s,i)=>`<div class="site ${s.known?'known':''} ${s.resolved?'resolved':''}"><i></i><span>S${i+1} · ${s.known?s.name:'UNRESOLVED SIGNAL'}</span><em>${s.failed?'IMPACT':s.resolved?'STABLE':s.known&&s.isDebris?`T−${Math.max(0,s.deadline-state.turn)}`:s.known?'AT RISK':''}</em></div>`).join('');
    document.querySelectorAll('.command').forEach(b=>{b.disabled=state.over||state.energy<({scan:1,relay:2,pulse:3,power:2,coast:0}[b.dataset.action])});
  }
  function resize(){const d=devicePixelRatio||1;const box=canvas.getBoundingClientRect();canvas.width=box.width*d;canvas.height=box.height*d;ctx.setTransform(d,0,0,d,0,0);draw()}
  function draw(){
    if(!state)return;const w=canvas.clientWidth,h=canvas.clientHeight,cx=w/2,cy=h/2-5,R=Math.min(w,h)*.22,orbit=R*1.62;ctx.clearRect(0,0,w,h);
    stars.forEach(s=>{ctx.fillStyle=`rgba(194,221,210,${s.a})`;ctx.fillRect(s.x*w,s.y*h,s.s,s.s)});
    const glow=ctx.createRadialGradient(cx,cy,R*.6,cx,cy,R*2.2);glow.addColorStop(0,'rgba(61,113,90,.25)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(150,190,175,.16)';ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.beginPath();ctx.ellipse(cx,cy,orbit,orbit*.72,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const pg=ctx.createRadialGradient(cx-R*.38,cy-R*.42,R*.08,cx,cy,R);pg.addColorStop(0,'#93bda0');pg.addColorStop(.38,'#37664f');pg.addColorStop(.75,'#153528');pg.addColorStop(1,'#07140f');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();ctx.fillStyle='rgba(8,18,15,.3)';ctx.beginPath();ctx.ellipse(cx+R*.45,cy,R*.7,R*1.1,0,0,Math.PI*2);ctx.fill();for(let i=0;i<7;i++){ctx.strokeStyle=`rgba(175,205,175,${.05+i*.008})`;ctx.beginPath();ctx.arc(cx,cy-R*.55+i*R*.18,R*(.65+i*.04),.2,2.9);ctx.stroke()}ctx.restore();
    state.sites.forEach((s,i)=>{const x=cx+Math.cos(s.angle)*R*.78,y=cy+Math.sin(s.angle)*R*.78;ctx.fillStyle=s.failed?'#db6f62':s.resolved?'#79c3a3':s.known?'#e2aa6e':'#789087';ctx.beginPath();ctx.arc(x,y,s.known?4:2.5,0,Math.PI*2);ctx.fill();if(s.known){ctx.strokeStyle=s.failed?'rgba(219,111,98,.65)':'rgba(225,169,107,.35)';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#cddbd5';ctx.font='8px DM Mono';ctx.fillText(`S${i+1}`,x+12,y+3)}});
    const debris=state.sites.find(s=>s.isDebris);if(debris&&!debris.resolved&&!debris.failed){const remaining=Math.max(0,debris.deadline-state.turn),progress=1-remaining/(debris.deadline-1),distance=R*(2.55-progress*1.55),dx=cx+Math.cos(debris.angle)*distance,dy=cy+Math.sin(debris.angle)*distance;ctx.strokeStyle=debris.known?'rgba(219,111,98,.62)':'rgba(125,145,139,.24)';ctx.setLineDash(debris.known?[5,5]:[2,8]);ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(cx+Math.cos(debris.angle)*R,cy+Math.sin(debris.angle)*R);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=debris.known?'#db6f62':'#71827d';ctx.save();ctx.translate(dx,dy);ctx.rotate(debris.angle);ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-4);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();ctx.restore();if(debris.known){ctx.fillStyle='#db8b7e';ctx.font='8px DM Mono';ctx.fillText(`OBJECT / T−${remaining}`,dx+10,dy-8)}}
    const sx=cx+Math.cos(state.angle)*orbit,sy=cy+Math.sin(state.angle)*orbit*.72;ctx.strokeStyle='rgba(225,169,107,.35)';ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(cx+Math.cos(state.angle)*R,cy+Math.sin(state.angle)*R);ctx.stroke();ctx.save();ctx.translate(sx,sy);ctx.rotate(state.angle+Math.PI/2);ctx.fillStyle='#e6c18e';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#7d9f99';ctx.fillRect(-23,-3,15,6);ctx.fillRect(8,-3,15,6);ctx.restore();
  }
  document.querySelectorAll('.command').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
  document.addEventListener('keydown',e=>{if($('#briefing').open)return;const map={'1':'scan','2':'relay','3':'pulse','4':'power','5':'coast'};if(map[e.key])act(map[e.key]);if(e.key.toLowerCase()==='n')init(Math.random().toString(36).slice(2,8).toUpperCase())});
  $('#newMission').addEventListener('click',()=>init(Math.random().toString(36).slice(2,8).toUpperCase()));
  $('#beginMission').addEventListener('click',()=>{if(state.over)init(state.seed);$('#briefing').close()});
  addEventListener('resize',resize);init();resize();$('#briefing').showModal();
})();
