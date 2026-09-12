(() => {
  'use strict';
  const root=document.querySelector('[data-game]'),$=s=>root.querySelector(s);
  const asset=name=>new URL('../images/'+name,document.currentScript.src).href;
  const background=new Image(),sprites=new Image();
  background.src=asset('cinder-stage.png');sprites.src=asset('stage-sprites.png');
  const layer=document.createElement('section');layer.className='stage-play';layer.hidden=true;
  layer.innerHTML=`<div class="stage-title"><span>CINDER · THE EMPTY STAGE</span><button data-undo disabled>↶ Undo</button></div>
    <div class="stage-view"><canvas width="480" height="560" tabindex="0" aria-label="Walk with arrow keys or WASD. Walk against the equipment case to push it. Z undoes a move."></canvas><p class="stage-caption" aria-live="polite"></p></div>
    <div class="stage-controls"><p>Hold an arrow to walk.<br><span>Keyboard: arrows / WASD · Z undo</span></p><div class="stage-pad" aria-label="Movement controls"><button data-dir="up" aria-label="Walk up">▲</button><button data-dir="left" aria-label="Walk left">◀</button><button data-dir="down" aria-label="Walk down">▼</button><button data-dir="right" aria-label="Walk right">▶</button></div></div>`;
  $('[data-space]').append(layer);
  const q=s=>layer.querySelector(s),canvas=q('canvas'),ctx=canvas.getContext('2d'),world=StageWorld.create();
  const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
  let active=false,held=null,pointer=null,repeat=0,elapsed=0,gateLift=0,muted=false,token=0,captionTime=0;
  let last=world.snapshot(),visual={player:{...last.player},box:{...last.box}},audioContext;
  function caption(text){q('.stage-caption').textContent=text;captionTime=elapsed+4;}
  function clearInput(){held=null;pointer=null;repeat=0;layer.querySelectorAll('[data-dir]').forEach(b=>b.classList.remove('pressed'));}
  function tone(open){
    if(muted)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext ||= new Audio();audioContext.resume().catch(()=>{});
      const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;
      o.type='sine';o.frequency.setValueAtTime(open?220:165,t);o.frequency.linearRampToValueAtTime(open?330:110,t+.16);
      g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.22);o.onended=()=>{o.disconnect();g.disconnect();};
    }catch{}
  }
  function refresh(){
    const next=world.snapshot(),prior=last;last=next;q('[data-undo]').disabled=!next.canUndo;
    if(next.open!==prior.open){tone(next.open);caption(next.open?'The gate rolls open.':'The gate rolls shut.');}
    if(next.reached&&!prior.reached){caption('Survive This City. You know this setup.');startMusic();}
    if(!next.reached&&prior.reached){token++;$('[data-music-feedback]').pause();$('[data-music-state]').textContent='CINDER · QUIET ARRANGEMENT';}
  }
  function step(direction){const [dx,dy]=vectors[direction];world.move(dx,dy);refresh();}
  function undo(){clearInput();world.undo();refresh();visual={player:{...last.player},box:{...last.box}};draw();}
  q('[data-undo]').onclick=undo;
  layer.querySelectorAll('[data-dir]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(pointer!==null)return;pointer=e.pointerId;b.setPointerCapture(e.pointerId);held=b.dataset.dir;repeat=.24;b.classList.add('pressed');step(held);});
    const release=e=>{if(e.pointerId===pointer)clearInput();};
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  });
  window.addEventListener('keydown',e=>{if(!active||e.target.closest('input,textarea'))return;const dir=keys[e.key];if(dir){e.preventDefault();if(!e.repeat){held=dir;repeat=.24;step(dir);}}else if(e.key.toLowerCase()==='z'){e.preventDefault();if(!e.repeat)undo();}});
  window.addEventListener('keyup',e=>{if(keys[e.key]===held)clearInput();});
  window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
  layer.addEventListener('click',e=>e.stopPropagation());
  async function startMusic(){
    const current=++token,a=$('[data-music-base]'),b=$('[data-music-feedback]');
    if(muted)return;a.muted=b.muted=false;a.volume=.12;b.volume=.25;
    try{await a.play();if(current!==token||!active)return;
      if(last.reached){b.currentTime=a.currentTime;await b.play();}
      if(current!==token||!active)return;
      $('[data-sound]').textContent='♪ OFF';$('[data-music-state]').textContent=last.reached?'THE STAGE · TWO VOICES':'CINDER · QUIET ARRANGEMENT';root.classList.add('music-on');
    }catch{if(current!==token)return;muted=true;a.pause();b.pause();$('[data-sound]').textContent='♪ PLAY';caption('Sound is off. Tap ♪ PLAY to listen.');}
  }
  function tile(x,y,color){ctx.fillStyle=color;ctx.fillRect(x*40,y*40,40,40);}
  function sprite(cell,p,w,h){
    if(!sprites.complete||!sprites.naturalWidth)return;
    const half=sprites.naturalWidth/2;
    ctx.drawImage(sprites,cell*half,0,half,sprites.naturalHeight,(p.x+.5)*40-w/2,(p.y+.5)*40-h*.7,w,h);
  }
  function draw(){
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,480,560);
    if(background.complete&&background.naturalWidth)ctx.drawImage(background,0,0,480,560);
    else{ctx.fillStyle='#15232e';ctx.fillRect(0,0,480,560);}
    // Visible collision boundary and gate: the geometry is the actual obstacle.
    ctx.fillStyle='#07111da8';ctx.fillRect(0,0,40,560);ctx.fillRect(440,0,40,560);ctx.fillRect(0,520,480,40);
    ctx.strokeStyle=last.open?'#b4e8a4':'#ac8656';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(260,340);ctx.lineTo(340,340);ctx.lineTo(340,230);ctx.stroke();
    ctx.fillStyle=last.open?'#76b886':'#524b42';ctx.fillRect(243,323,34,34);ctx.strokeStyle=last.open?'#d7ffbe':'#ddc895';ctx.lineWidth=2;ctx.strokeRect(243,323,34,34);
    ctx.fillStyle='#c9c4a0';for(let i=0;i<3;i++)ctx.fillRect(248,329+i*8,24,2);
    for(let x=1;x<=10;x++){
      if(x===8)continue;
      ctx.fillStyle='#161e28';ctx.fillRect(x*40,205,40,24);ctx.strokeStyle='#8d989b';ctx.lineWidth=2;ctx.strokeRect(x*40,205,40,24);
      for(let b=0;b<4;b++){ctx.beginPath();ctx.moveTo(x*40+b*10,206);ctx.lineTo(x*40+b*10,228);ctx.stroke();}
    }
    ctx.save();ctx.beginPath();ctx.rect(320,196,40,40);ctx.clip();
    ctx.fillStyle='#9eaaa8';ctx.fillRect(321,201-gateLift*42,38,33);
    ctx.fillStyle='#303b41';for(let i=0;i<4;i++)ctx.fillRect(325+i*9,204-gateLift*42,4,28);ctx.restore();
    ctx.fillStyle=last.open?'#a6ffb2':'#ffbe71';ctx.fillRect(316,201,4,6);ctx.fillRect(360,201,4,6);
    sprite(1,visual.box,42,38);sprite(0,visual.player,38,48);
    // Small in-world label identifies the object without an inspection menu.
    ctx.font='9px monospace';ctx.textAlign='center';ctx.fillStyle='#eee4cd';ctx.fillText('STC',(visual.box.x+.5)*40,(visual.box.y+.5)*40+2);
  }
  window.cinderChapter={
    start(){active=true;layer.hidden=false;root.classList.add('at-cinder','stage-active');$('[data-intro]').hidden=true;$('[data-tutorial]').hidden=true;$('[data-readout]').hidden=true;$('[data-amplifier-array]').hidden=true;$('[data-hidden-route]').hidden=true;$('.location span').textContent='CINDER / EMPTY STAGE';$('[data-status]').textContent='ON FOOT';$('[data-music-feedback]').pause();muted=false;startMusic();draw();},
    reset(){active=false;token++;clearInput();world.reset();last=world.snapshot();visual={player:{...last.player},box:{...last.box}};gateLift=0;elapsed=0;muted=false;layer.hidden=true;q('[data-undo]').disabled=true;q('.stage-caption').textContent='';root.classList.remove('at-cinder','stage-active');$('.location span').textContent='BELLWEATHER ORBIT';$('[data-music-base]').muted=$('[data-music-feedback]').muted=false;},
    sound(){if(!active)return false;muted=!muted;if(muted){token++;$('[data-music-base]').pause();$('[data-music-feedback]').pause();$('[data-sound]').textContent='♪ PLAY';$('[data-music-state]').textContent='MUTED';root.classList.remove('music-on');}else startMusic();return true;},
    update(dt){if(!active)return;elapsed+=dt;if(held){repeat-=dt;if(repeat<=0){step(held);repeat=.16;}}
      const t=Math.min(1,dt*22);for(const name of ['player','box'])for(const axis of ['x','y'])visual[name][axis]+=(last[name][axis]-visual[name][axis])*t;
      gateLift+=(Number(last.open)-gateLift)*Math.min(1,dt*14);
      if(elapsed>captionTime)q('.stage-caption').textContent='';draw();
    }
  };
})();
