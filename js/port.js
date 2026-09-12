(() => {
  'use strict';
  const root = document.querySelector('[data-game]'), $ = s => root.querySelector(s);
  const layer = document.createElement('section');
  layer.className = 'port'; layer.hidden = true;
  layer.setAttribute('aria-label', 'Explore Cinder port');
  layer.innerHTML = `
    <div class="port-heading"><b>CINDER · AFTER HOURS</b><span>Tap a place to walk there.</span></div>
    <div class="port-map-wrap"><div class="port-map">
      <img class="port-art" src="${new URL('../images/cinder-port.png', document.currentScript.src).href}" alt="An orbital port: connected docks and a workshop, with a lit room across an empty gap.">
      <svg viewBox="0 0 100 100" aria-hidden="true"><path class="port-walkway" d="M23 32 L24 65 L60 65"/><path class="port-crossing" d="M60 65 L78 28"/></svg>
      <button class="port-place" data-place="dock" style="--x:23%;--y:32%">Cargo dock<small>CALL SPEAKER</small></button>
      <button class="port-place" data-place="shop" style="--x:24%;--y:65%">Repair shop<small>LIGHTS STILL ON</small></button>
      <button class="port-place" data-place="landing" style="--x:60%;--y:65%">Old landing<small>SPEAKER SILENT</small></button>
      <button class="port-place isolated" data-place="studio" style="--x:78%;--y:28%">Listening room<small>ACROSS THE GAP</small></button>
      <div class="port-ferry" aria-label="Service ferry"><span>▰</span><small>FERRY</small></div>
      <div class="port-person" aria-label="Your position"><i></i><small>YOU</small></div>
      <div class="port-sound" aria-live="polite"></div>
    </div></div>
    <div class="port-inspect">
      <div class="port-copy" aria-live="polite"><h2></h2><p></p></div>
      <div class="port-actions"></div>
      <div class="port-tool"><span>AMPLIFIER <small data-recording>EMPTY TAPE</small></span><button data-record>● Record</button><button data-replay disabled>▷ Replay</button></div>
    </div>`;
  $('[data-space]').append(layer);
  const q = s => layer.querySelector(s), positions = {dock:{x:.23,y:.32}, shop:{x:.24,y:.65}, landing:{x:.60,y:.65}, studio:{x:.78,y:.28}};
  const edges = {dock:['shop'],shop:['dock','landing'],landing:['shop'],studio:[]};
  let active = false, location = 'dock', person = {...positions.dock}, ferry = {...positions.studio};
  let route = [], destination = '', ferryTarget = 'studio', ferryPurpose = '', riding = false, tape = false, connected = false, visitedStudio = false, clock = 0, captionUntil = 0, muted = false, context, notes = [], version = 0;
  function place(el,p){el.style.left = p.x*100+'%';el.style.top=p.y*100+'%';}
  function copy(title, text){q('h2').textContent=title;q('.port-copy p').textContent=text;}
  function caption(text){q('.port-sound').textContent=text;captionUntil=clock+4;}
  function action(label, fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;q('.port-actions').append(b);}
  function audioReady(){
    if(muted)return;
    try { const Audio = window.AudioContext || window.webkitAudioContext;if(!Audio)return;context ||= new Audio();context.resume().catch(()=>caption('Sound unavailable — the chime is also shown on the map.')); } catch {caption('Sound unavailable — the chime is also shown on the map.');}
  }
  function chime(){
    caption('♪  LOW · HIGH · MIDDLE'); audioReady(); if(!context || muted)return;
    [392,587.33,493.88].forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.29;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.connect(g);g.connect(context.destination);o.start(t);o.stop(t+.52);notes.push(o);o.onended=()=>{o.disconnect();g.disconnect();notes=notes.filter(n=>n!==o);};});
  }
  function render(){
    q('.port-actions').replaceChildren();
    q('[data-recording]').textContent=tape?'DOCK CHIME · 3 NOTES':'EMPTY TAPE';
    q('[data-replay]').disabled=!tape || riding || route.length>0;
    q('[data-record]').disabled=riding || route.length>0;
    layer.querySelectorAll('[data-place]').forEach(b=>{b.classList.toggle('here',b.dataset.place===location&&!route.length);b.setAttribute('aria-current',b.dataset.place===location?'location':'false');});
    if(route.length){copy('On your way',`Walking to the ${destination === 'shop'?'repair shop':destination==='dock'?'cargo dock':'old landing'}.`);return;}
    if(riding){copy('Crossing the gap','The dock lights fall away. There is still a light on in the room ahead.');return;}
    if(location==='dock'){
      copy('The cargo dock','A call button sits beside a small speaker. Beyond the locked freight railing, a ferry moves between berths. Across the gap: a room with its lights still on.');
      action('Press call button',()=>{chime();connected=false;ferryTarget='dock';ferryPurpose='cargo';copy('A familiar little chime','The ferry turns toward the speaker. It docks behind the freight railing, where you cannot board.');});
    }else if(location==='shop'){
      copy('The repair shop','Coiled cables. Flight cases. A bass pick wedged beneath a wobbly table leg. Someone has been keeping this place running.');
      action('Try the amplifier',()=>{copy('Record. Carry. Replay.','The amplifier keeps one sound until you replace it. Its speaker can play that sound somewhere else. Nothing here is loud enough to save.');});
      action('Look at the workbench',()=>{copy('An unfinished repair','A cracked speaker cone lies beside a work order: “OLD PASSENGER LANDING — replacement overdue.” Through the window, you can see its matching housing.');});
      action('Look at the flight case',()=>{copy('Survive This City','The lettering is half peeled away. You recognize the name before you finish reading it. Whoever brought this here kept using it.');});
    }else if(location==='landing'){
      copy('The old passenger landing',connected?'The ferry waits beside the open boarding step. Its cabin light reaches all the way to your shoes.':'An empty berth, an open boarding step, and a speaker just like the one at the cargo dock. The room across the gap is close enough to see into. Not close enough to reach.');
      action('Press call button',()=>{caption('click…');copy('Only a click','The button moves. The speaker cone does not. Across the gap, the ferry stays where it is.');});
      if(connected)action('Board ferry',()=>cross('studio'));
    }else{
      copy('The listening room','A mixing desk faces the port. Two chairs, one pulled away. A pair of headphones rests on a flight case. This was a place to sit together, not just to work.');
      action('Listen at the desk',()=>{
        const a=$('[data-music-feedback]');a.volume=.26;a.muted=muted;const token=version;
        if(!muted)a.play().then(()=>{if(token!==version)a.pause();}).catch(()=>caption('Tap ♪ PLAY to enable sound.'));
        copy('This Will Destroy You','The name of your old EP is written on a case beside the desk. For a moment, you can almost picture him deciding where everyone should sit. There is no new message. Just something familiar, still here.');
        $('[data-music-state]').textContent=muted?'MUTED':'LISTENING ROOM · TWO VOICES';
      });
      action('Look through the window',()=>copy('Beyond Cinder','Another planet hangs beyond the port. A pencilled route on the desk continues toward it. That is where this prototype ends—for now, you can stay and listen, or take the ferry back.'));
      action('Return to old landing',()=>cross('landing'));
    }
  }
  function walk(target){
    audioReady();if(riding)return;
    if(target==='studio'&&location!=='studio'){copy('A light across the gap','There is no walkway to that room. You can make out a small ferry berth beneath its windows.');return;}
    if(location==='studio'&&target!=='studio'){copy('The return crossing','The ferry is waiting. Board it to return to the old landing.');q('.port-actions').replaceChildren();action('Return to old landing',()=>cross('landing'));return;}
    if(route.length)return; // Finish this short walk before inspecting another location.
    const queue=[[location]],seen=new Set();let path;
    while(queue.length){const p=queue.shift(),last=p[p.length-1];if(last===target){path=p;break;}if(seen.has(last))continue;seen.add(last);for(const next of edges[last])queue.push([...p,next]);}
    if(!path)return;destination=target;route=path.slice(1);render();
  }
  function cross(target){riding=true;route=[];ferry={...person};ferryTarget=target;ferryPurpose='passenger';connected=false;render();}
  layer.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>walk(b.dataset.place));
  q('[data-record]').onclick=()=>{
    if(route.length||riding)return;
    if(location!=='dock'){caption(tape?'No new sound. Dock chime kept.':'Only quiet here. Tape still empty.');return;}
    tape=true;chime();connected=false;ferryTarget='dock';ferryPurpose='cargo';render();copy('Dock chime saved','Three notes on the tape. The ferry turns toward the cargo berth again.');
  };
  q('[data-replay]').onclick=()=>{
    if(!tape||route.length||riding)return;chime();
    if(location==='landing'){
      ferryTarget='landing';ferryPurpose='summoned';connected=false;
      copy('The ferry turns','Its running lights swing toward you. The old landing’s speaker is still broken. Your amplifier is not.');
    }else if(location==='dock'){connected=false;ferryTarget='dock';ferryPurpose='cargo';copy('The ferry answers','It approaches the cargo berth behind the railing.');}
    else caption('♪ LOW · HIGH · MIDDLE — the sound carries into the room.');
  };
  // Controls belong to this chapter, not the orbital flight controls underneath.
  layer.addEventListener('click',e=>e.stopPropagation());
  function move(p,to,dt,speed){const dx=to.x-p.x,dy=to.y-p.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}return d<=speed*dt;}
  window.cinderChapter={
    start(){active=true;layer.hidden=false;root.classList.add('at-cinder','at-port');$('[data-hidden-route]').hidden=true;$('[data-amplifier-array]').hidden=true;$('[data-readout]').hidden=true;$('[data-tutorial]').hidden=true;$('.location span').textContent='CINDER / ORBITAL PORT';$('[data-status]').textContent='DOCKED · EXPLORING';$('[data-music-feedback]').pause();const a=$('[data-music-base]'),token=version;a.volume=.13;muted=false;a.muted=false;audioReady();a.play().then(()=>{if(token!==version){a.pause();return;}$('[data-sound]').textContent='♪ OFF';$('[data-music-state]').textContent='CINDER · QUIET ARRANGEMENT';root.classList.add('music-on');}).catch(()=>{if(token!==version)return;muted=true;$('[data-sound]').textContent='♪ PLAY';caption('Tap ♪ PLAY for sound. Chimes also appear as captions.');});render();place(q('.port-person'),person);place(q('.port-ferry'),ferry);},
    sound(){if(!active)return false;muted=!muted;const a=$('[data-music-base]'),b=$('[data-music-feedback]');a.muted=b.muted=muted;if(muted){notes.forEach(o=>{try{o.stop();}catch{}});a.pause();b.pause();}else{audioReady();a.volume=.13;const token=version;a.play().then(()=>{if(token!==version)a.pause();}).catch(()=>caption('Audio did not start. Try ♪ PLAY again.'));}$('[data-sound]').textContent=muted?'♪ PLAY':'♪ OFF';$('[data-music-state]').textContent=muted?'MUTED':'CINDER · QUIET ARRANGEMENT';root.classList.toggle('music-on',!muted);return true;},
    reset(){active=false;version++;layer.hidden=true;root.classList.remove('at-cinder','at-port');notes.forEach(o=>{try{o.stop();}catch{}});location='dock';person={...positions.dock};ferry={...positions.studio};route=[];destination='';ferryTarget='studio';ferryPurpose='';riding=false;tape=false;connected=false;visitedStudio=false;clock=0;muted=false;q('.port-sound').textContent='';q('.port-crossing').classList.remove('open');$('[data-music-base]').muted=$('[data-music-feedback]').muted=false;$('.location span').textContent='BELLWEATHER ORBIT';},
    update(dt){if(!active)return;clock+=dt;
      if(route.length&&move(person,positions[route[0]],dt,.3)){location=route.shift();if(!route.length)render();}
      if(move(ferry,positions[ferryTarget],dt,.13)){
        if(ferryPurpose==='cargo'){ferryPurpose='';ferryTarget='studio';}
        else if(ferryPurpose==='summoned'){ferryPurpose='';connected=true;if(location==='landing'&&!route.length)render();caption('The ferry lowers its boarding step.');}
        else if(ferryPurpose==='passenger'){location=ferryTarget;person={...positions[location]};riding=false;ferryPurpose='';connected=location==='landing';visitedStudio ||= location==='studio';q('.port-crossing').classList.add('open');render();}
      }
      if(riding)person={...ferry};place(q('.port-person'),person);place(q('.port-ferry'),ferry);
      q('.port-ferry').classList.toggle('boarding',connected);if(clock>captionUntil)q('.port-sound').textContent='';
    }
  };
})();
