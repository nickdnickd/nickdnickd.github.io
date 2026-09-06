(() => {
  const root = document.querySelector('[data-game]'), space = root.querySelector('[data-space]');
  const $ = s => root.querySelector(s);
  const layer = document.createElement('div');
  layer.className = 'cinder-field'; layer.hidden = true;
  layer.innerHTML = `<svg viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><g data-wakes></g></svg>
    <div data-convoy></div><div data-crossings></div>
    <button class="cinder-listen" aria-pressed="false">Feedback · listen</button>
    <div class="cinder-report" aria-live="polite"></div>
    <button class="cinder-dock" hidden>QUIET DOCK <small>NO SCHEDULED ARRIVALS</small></button>
    <div class="patch-follower" hidden>↔<small>PATCH</small></div>`;
  space.append(layer);
  const convoy = layer.querySelector('[data-convoy]'), wakes = layer.querySelector('[data-wakes]');
  const report = layer.querySelector('.cinder-report'), listen = layer.querySelector('.cinder-listen');
  const dock = layer.querySelector('.cinder-dock'), patch = layer.querySelector('.patch-follower');
  const crossings = [{x:.5,y:.30},{x:.5,y:.70}];
  let active=false, clock=0, listening=false, found=false, redirected=false, delivered=false, api, windowOpen=false;
  let inspected = new Set(), histories = Array.from({length:4},()=>[]), sample=0, lock=0, redirectStart=null, redirectedShip=0;
  function place(el,p) { el.style.left=p.x*100+'%'; el.style.top=p.y*100+'%'; }
  function say(title,copy) { $('[data-tutorial]').hidden=false; $('[data-tutorial-title]').textContent=title; $('[data-tutorial-copy]').textContent=copy; }
  function position(i,t) {
    // Two overlapping ellipses; both pass the upper crossing together every 20 seconds.
    const angle=t*Math.PI/10 + (i%2===0 ? -Math.PI/4 : -3*Math.PI/4) + (i>=2?Math.PI:0);
    return {x:(i%2===0?.33:.67)+Math.cos(angle)*(.17*Math.SQRT2), y:.5+Math.sin(angle)*(.20*Math.SQRT2)};
  }
  const ships=Array.from({length:5},(_,i)=>{
    const b=document.createElement('button'); b.className='convoy-contact';
    b.innerHTML=`<span aria-hidden="true">◇</span><small>CARGO ${i+1}</small>`;
    b.setAttribute('aria-label',`Inspect cargo ${i+1}`);
    b.onclick=e=>{e.stopPropagation();
      if(found && !redirected) {
        redirected=true; redirectedShip=i%4; redirectStart=position(redirectedShip,clock); dock.hidden=false;
        report.textContent='PATCH: berth assignment revised. Extremely official.';
        say('ONE MANIFEST CHANGED', 'The tug is taking the quiet dock route. Follow it.');
        return;
      }
      inspected.add(i); report.textContent=i===4?'CARGO 5 · registry valid · propulsion history unavailable.':'CARGO '+(i+1)+' · ore shipment · continuous propulsion history.';
      if(i===4) {clock+=1.5; report.textContent+=' Identity reassigned. Feedback clicks twice.';}
      api.setCourse(position(i%4,clock+.6),'cargo');
    }; convoy.append(b); return b;
  });
  crossings.forEach((p,i)=>{const b=document.createElement('button');b.className='crossing-anchor';b.textContent=i?'H':'G';b.setAttribute('aria-label',`Wait with Feedback at crossing ${i?'H':'G'}`);place(b,p);
    b.onclick=e=>{e.stopPropagation();api.setCourse({x:p.x+.055,y:p.y-.055},'crossing');report.textContent='Holding course to crossing '+(i?'H':'G')+'.';};layer.querySelector('[data-crossings]').append(b);});
  listen.onclick=e=>{e.stopPropagation();listening=!listening;listen.setAttribute('aria-pressed',String(listening));listen.textContent=listening?'Feedback · wakes visible':'Feedback · listen';layer.classList.toggle('listening',listening);report.textContent=listening?'Four engine wakes. Five registered ships.':'Passive traffic view.';};
  dock.onclick=e=>{e.stopPropagation();api.setCourse({x:.87,y:.63},'dock');};
  const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
  window.cinderChapter={
    start(bridge) {
      api=bridge;active=true;layer.hidden=false;root.classList.add('at-cinder');
      $('[data-hidden-route]').hidden=true;$('[data-amplifier-array]').hidden=true;$('[data-readout]').hidden=true;
      $('.location span').textContent='CARILLON / CINDER';
      say('CINDER · FIVE SHIPS, ALL NOMINAL', 'Feedback is listening to something the traffic report missed. Tap a ship to inspect it.');
      report.textContent='CONCORDANCE: irregular routes automatically corrected.';
    },
    reset() {
      active=false;clock=0;listening=false;found=false;redirected=false;delivered=false;lock=0;sample=0;redirectStart=null;inspected.clear();histories=Array.from({length:4},()=>[]);
      layer.hidden=true;root.classList.remove('at-cinder');layer.classList.remove('listening');patch.hidden=true;dock.hidden=true;
      listen.textContent='Feedback · listen';listen.setAttribute('aria-pressed','false');ships.forEach(s=>s.hidden=false);wakes.innerHTML='';
      $('.location span').textContent='BELLWEATHER ORBIT';
    },
    update(dt,follow,craft) {
      if(!active)return;clock+=dt;sample+=dt;
      const p0=position(0,clock), p1=position(1,clock);
      windowOpen=near(p0,p1,.09);
      for(let i=0;i<4;i++) {
        let p=position(i,clock);
        if(redirected && i===redirectedShip) { redirectStart.progress=Math.min(1,(redirectStart.progress||0)+dt/7);const a=redirectStart.progress;p={x:redirectStart.x+(.87-redirectStart.x)*a,y:redirectStart.y+(.63-redirectStart.y)*a}; }
        place(ships[i],p);
        if(sample>.08){histories[i].push(p);if(histories[i].length>80)histories[i].shift();}
      }
      if(sample>.08){sample=0;wakes.innerHTML=histories.map((h,i)=>`<polyline fill="none" stroke="${i%2?'#ffa55e':'#7ce8d8'}" stroke-width="3" points="${h.map(p=>`${p.x*1000},${p.y*700}`).join(' ')}"/>`).join('');}
      const ghost=windowOpen?{x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2}:position(Math.floor(clock/3)%4,clock);
      place(ships[4],ghost);ships[4].classList.toggle('ghost-visible',listening&&windowOpen);
      if(!found && listening && windowOpen && near(follow,ghost,.10)) {
        lock+=dt;
        report.textContent='Feedback holds a fifth voice where two wakes cross…';
        if(lock>.35){found=true;ships[4].hidden=true;patch.hidden=false;$('[data-party]').textContent='PARTY 3 / 4';
          say('PATCH JOINED · ROUTING ACCESS FOUND', 'Tap a cargo tug. Patch can give one shipment a different destination.');
          report.textContent='P.: ROUTE IS CORRECT. MANIFEST IS CORRECT. THE SHIP IS COMPLETELY MADE UP. PLEASE TRY TO KEEP UP.';
        }
      } else if(!found) lock=0;
      if(found)place(patch,{x:craft.x-.09,y:craft.y+.09});
      if(redirected && !delivered && redirectStart.progress===1 && near(craft,{x:.87,y:.63},.10)) {
        delivered=true;say('QUIET DOCK · PRIVATE SOUNDCHECK', 'A recorder wakes as the tug docks. The room on the other end is empty.');
        report.textContent='P.: “You made it. Knew you’d bring the whole ridiculous crew.” Recording date unavailable. Concordance reports: no arrivals.';
        dock.innerHTML='QUIET DOCK <small>RECORDER RECOVERED</small>';
      }
    }
  };
})();
