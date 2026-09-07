(() => {
  const root=document.querySelector('[data-game]'), $=s=>root.querySelector(s), space=$('[data-space]');
  const layer=document.createElement('div');layer.className='cinder-field';layer.hidden=true;
  layer.innerHTML=`<div data-buoys></div><button class="maintenance">◇<small>MAINTENANCE</small></button><button class="broadcast" aria-pressed="false">Feedback · broadcast</button><button class="all-channels">Hear all channels</button><div class="phrase-display"><span data-phrase>Soundcheck</span><progress max="8" value="0" aria-label="Soundcheck phrase position"></progress></div><div class="cinder-report" aria-live="polite"></div><div class="patch-follower" hidden>↔<small>PATCH</small></div>`;
  space.append(layer);
  const report=layer.querySelector('.cinder-report'), tugEl=layer.querySelector('.maintenance'), broadcast=layer.querySelector('.broadcast'), patch=layer.querySelector('.patch-follower');
  const positions=[{x:.26,y:.38},{x:.47,y:.65},{x:.73,y:.43}],home={x:.84,y:.23},labels=['01 · BASS','02 · PERCUSSION','04 · UNSCHEDULED'];
  const streams=['bass','drums','answer'].map(name=>{const a=document.createElement('audio');a.src=new URL(`../audio/cinder-${name}.mp3`,document.currentScript.src).href;a.loop=true;a.preload='auto';layer.append(a);return a;});
  let active=false,api,clock=0,lastPhase=0,cycle=0,solo=-1,calling=false,lured=false,found=false,cut=false,failed=false,answerTime=0,tug={...home},muted=false,audioReady=false,playToken=0;
  const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
  const place=(el,p)=>{el.style.left=p.x*100+'%';el.style.top=p.y*100+'%';};
  const say=(title,copy)=>{$('[data-tutorial]').hidden=false;$('[data-tutorial-title]').textContent=title;$('[data-tutorial-copy]').textContent=copy;};
  function mix(craft={x:.5,y:.5}){streams.forEach((a,i)=>{a.muted=muted||(solo>=0&&solo!==i)||(i===2&&cut&&!found);a.volume=i===2?.65:.24+Math.max(0,1-Math.hypot(craft.x-positions[i].x,craft.y-positions[i].y)*1.6)*.32;});}
  async function play(){const token=++playToken;try{await Promise.all(streams.map(a=>a.play()));if(token!==playToken)return;audioReady=true;$('[data-music-state]').textContent='CINDER · LIVE SOUNDCHECK';$('[data-sound]').textContent='♪ OFF';root.classList.add('music-on');}catch{if(token!==playToken)return;audioReady=false;report.textContent='Tap ♪ PLAY to hear the soundcheck.';$('[data-sound]').textContent='♪ PLAY';}}
  const buoys=positions.map((p,i)=>{const b=document.createElement('button');b.className='sound-buoy';b.innerHTML=`<span>◉</span><small>${labels[i]}</small>`;b.setAttribute('aria-label',`Listen to ${labels[i]} and approach buoy`);place(b,p);b.onclick=e=>{e.stopPropagation();solo=i;mix();api.setCourse(p,'sound-buoy');buoys.forEach((el,j)=>el.classList.toggle('solo',i===j));report.textContent=i===2?'Tape on channel 04: DO NOT MUTE. YES, EVEN IF IT DOES THAT. — P.':labels[i]+' · isolated. Tap “Hear all channels” for the arrangement.';};layer.querySelector('[data-buoys]').append(b);return b;});
  layer.querySelector('.all-channels').onclick=e=>{e.stopPropagation();solo=-1;buoys.forEach(b=>b.classList.remove('solo'));mix();};
  tugEl.onclick=e=>{e.stopPropagation();report.textContent='CONCORDANCE MAINTENANCE: UNSCHEDULED INPUT — AUTOMATICALLY MUTED. Priority: nearest active interference source.';};
  broadcast.onclick=e=>{e.stopPropagation();calling=!calling;broadcast.setAttribute('aria-pressed',String(calling));broadcast.textContent=calling?'Feedback · broadcasting':'Feedback · broadcast';if(!calling)lured=false;report.textContent=calling?'Feedback sends a loud test signal.':'Feedback falls quiet.';};
  window.cinderChapter={
    start(bridge){api=bridge;active=true;layer.hidden=false;root.classList.add('at-cinder');$('[data-hidden-route]').hidden=true;$('[data-amplifier-array]').hidden=true;$('[data-readout]').hidden=true;$('.location span').textContent='CINDER / AUTOMATED SOUNDCHECK';$('[data-music-base]').pause();$('[data-music-feedback]').pause();say('SOMEONE LEFT THE SOUNDCHECK RUNNING','Tap a buoy to approach and listen to its channel. Tap open space to fly.');report.textContent='Two scheduled channels. One unscheduled input.';play();},
    sound(){if(!active)return false;if(!audioReady){muted=false;play();}else{muted=!muted;mix();$('[data-sound]').textContent=muted?'♪ PLAY':'♪ OFF';root.classList.toggle('music-on',!muted);$('[data-music-state]').textContent=muted?'MUTED':'CINDER · LIVE SOUNDCHECK';}return true;},
    reset(){active=false;playToken++;streams.forEach(a=>{a.pause();a.currentTime=0;});clock=0;lastPhase=0;cycle=0;solo=-1;calling=false;lured=false;found=false;cut=false;failed=false;answerTime=0;tug={...home};muted=false;audioReady=false;layer.hidden=true;patch.hidden=true;root.classList.remove('at-cinder');broadcast.textContent='Feedback · broadcast';broadcast.setAttribute('aria-pressed','false');buoys.forEach(b=>b.classList.remove('solo','cut','answering'));$('.location span').textContent='BELLWEATHER ORBIT';},
    update(dt,follow,craft){
      if(!active)return;clock+=dt;
      const phase=audioReady&&!streams[0].paused?streams[0].currentTime%8:clock%8;
      if(phase<lastPhase){cycle++;failed=false;answerTime=0;cut=false;}lastPhase=phase;
      if(calling&&near(tug,follow,.24))lured=true;
      const target=lured?follow:(phase>3.45&&phase<7?positions[2]:home);
      const dx=target.x-tug.x,dy=target.y-tug.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*(lured?.18:.12));
      if(d){tug.x+=dx/d*step;tug.y+=dy/d*step;}place(tugEl,tug);tugEl.classList.toggle('tracking',lured);
      const answering=phase>=4&&phase<6.8;
      if(answering&&!found){if(near(tug,positions[2],.075)){if(!cut)report.textContent='CHANNEL 04 MUTED · unscheduled input corrected.';cut=true;failed=true;}if(!cut)answerTime+=dt;}
      if(phase>=6.8&&phase<7.3&&!found&&!failed&&answerTime>2.4){found=true;cut=false;solo=-1;buoys.forEach(b=>b.classList.remove('solo'));patch.hidden=false;$('[data-party]').textContent='PARTY 3 / 4';say('THE ANSWER FINALLY FINISHES. PATCH JOINS.','Channel 04 stays in the arrangement. Its answer returns every phrase.');report.textContent='P.: CHANNEL 4 — DO NOT MUTE. YES, EVEN IF IT DOES THAT. Patch saved a private soundcheck. Timestamp unreadable.';}
      buoys[2].classList.toggle('cut',cut&&!found);buoys[2].classList.toggle('answering',answering&&!cut);buoys[2].querySelector('small').textContent=found?'04 · PATCH':cut?'04 · MUTED':'04 · UNSCHEDULED';
      layer.querySelector('progress').value=phase;layer.querySelector('[data-phrase]').textContent=answering?(cut&&!found?'Answer interrupted':'Answering…'):'Soundcheck · repeating';
      if(cycle>=3&&!found&&!calling&&phase<.05)report.textContent='The tug always arrives at the same phrase. Its receiver turns toward Feedback when he broadcasts nearby.';
      if(found)place(patch,{x:craft.x-.09,y:craft.y+.09});
      if(audioReady)streams.slice(1).forEach(a=>{if(Math.abs(a.currentTime-streams[0].currentTime)>.12)a.currentTime=streams[0].currentTime;});mix(craft);
    }
  };
})();
