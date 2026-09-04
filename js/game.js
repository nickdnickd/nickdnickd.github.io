(() => {
  const root = document.querySelector('[data-game]');
  const space = root.querySelector('[data-space]');
  const craftEl = root.querySelector('[data-craft]');
  const feedbackEl = root.querySelector('[data-object="feedback"]');
  const companionEl = root.querySelector('[data-companion]');
  const courseEl = root.querySelector('[data-course]');
  const destinationEl = root.querySelector('[data-destination]');
  const tutorial = root.querySelector('[data-tutorial]');
  const calibration = root.querySelector('[data-calibration]');
  const trace = root.querySelector('[data-trace]');
  const readout = root.querySelector('[data-readout]');
  const calmEl = root.querySelector('[data-calm]');
  const statusEl = root.querySelector('[data-status]');
  const partyEl = root.querySelector('[data-party]');
  const rangeEl = root.querySelector('[data-feedback-range]');
  const noiseEl = root.querySelector('[data-noise-label]');
  const waveEl = root.querySelector('[data-waveform]');
  const $ = (selector) => root.querySelector(selector);

  const state = {
    mode: 'intro',
    craft: { x: .12, y: .5 },
    target: null,
    targetKind: null,
    feedback: { x: .73, y: .2, angle: -1.02 },
    lastTime: performance.now(),
    lastCommand: 0,
    proximityAt: 0,
    joined: false,
    audioOn: false,
    musicTimer: null,
    audioContext: null,
    songStep: 0
  };

  const waveHeights = [20,42,76,34,58,88,45,70,28,82,48,67,32,91,55,38,72,25,63,84,41,69,31,78];
  waveEl.innerHTML = waveHeights.map((h) => `<i style="--h:${h}%"></i>`).join('');

  function feedbackPosition(angle = state.feedback.angle) {
    return {
      x: .525 + Math.cos(angle) * .365,
      y: .52 + Math.sin(angle) * .305
    };
  }

  function percentDistance(a, b) {
    const rect = space.getBoundingClientRect();
    return Math.hypot((a.x - b.x) * rect.width, (a.y - b.y) * rect.height);
  }

  function setElementPosition(el, point) {
    el.style.left = `${point.x * 100}%`;
    el.style.top = `${point.y * 100}%`;
  }

  function toSvg(point) {
    return { x: point.x * 1000, y: point.y * 700 };
  }

  function drawCourse() {
    if (!state.target || state.mode === 'intro') {
      courseEl.setAttribute('d', '');
      destinationEl.classList.remove('active');
      return;
    }
    const a = toSvg(state.craft);
    const b = toSvg(state.target);
    courseEl.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    destinationEl.setAttribute('cx', b.x);
    destinationEl.setAttribute('cy', b.y);
    destinationEl.classList.add('active');
  }

  function setCourse(point, kind = 'space') {
    if (state.mode === 'intro' || state.joined) return;
    state.target = {
      x: Math.max(.045, Math.min(.955, point.x)),
      y: Math.max(.07, Math.min(.92, point.y))
    };
    state.targetKind = kind;
    state.lastCommand = performance.now();
    craftEl.classList.add('moving');
    feedbackEl.classList.toggle('locked', kind === 'feedback');
    statusEl.textContent = kind === 'feedback' ? 'INTERCEPT COMMITTED' : 'COURSE COMMITTED';
    if (state.mode === 'proximity') {
      state.proximityAt = performance.now();
      $('[data-calibration-title]').textContent = 'TOO LOUD. IT PULLED AWAY.';
      $('[data-calibration-copy]').textContent = 'Let go of the controls. Match its drift.';
    }
    drawCourse();
  }

  function begin() {
    state.mode = 'navigating';
    root.dataset.state = 'navigating';
    $('[data-intro]').hidden = true;
    tutorial.hidden = false;
    statusEl.textContent = 'FREE NAVIGATION';
    $('[data-music-state]').textContent = 'VOICE 01 · PLAYING';
    startMusic();
  }

  function enterProximity() {
    if (state.mode === 'proximity') return;
    state.mode = 'proximity';
    root.dataset.state = 'proximity';
    state.target = null;
    state.targetKind = null;
    state.proximityAt = performance.now();
    craftEl.classList.remove('moving');
    feedbackEl.classList.remove('locked');
    tutorial.hidden = true;
    calibration.hidden = false;
    statusEl.textContent = 'PROXIMITY AUDIO OPEN';
    drawCourse();
  }

  function completeEncounter() {
    state.joined = true;
    state.mode = 'joined';
    root.dataset.state = 'joined';
    calibration.hidden = true;
    feedbackEl.classList.add('joined');
    companionEl.hidden = false;
    partyEl.textContent = 'PARTY 2 / 4';
    statusEl.textContent = 'HIDDEN ROUTE RECOVERED';
    $('[data-music-state]').textContent = 'VOICE 01 + FEEDBACK · PLAYING';
    trace.hidden = false;
    playJoinChord();
  }

  function inspect(kind) {
    const messages = {
      relay: ['OBJECT SCAN', 'KESTREL—4', 'Registered courier relay. Forty-one days of perfect diagnostics. It has nothing interesting to say.'],
      tug: ['OBJECT SCAN', 'CINDER TUG', 'Automated mining tow. Its manifests are painfully complete—except for one missing live-audio recorder.']
    };
    const message = messages[kind];
    if (!message) return;
    $('[data-readout-kicker]').textContent = message[0];
    $('[data-readout-title]').textContent = message[1];
    $('[data-readout-copy]').textContent = message[2];
    readout.hidden = false;
  }

  function reset() {
    state.mode = 'intro';
    state.craft = { x: .12, y: .5 };
    state.target = null;
    state.targetKind = null;
    state.feedback.angle = -1.02;
    state.feedback = { ...state.feedback, ...feedbackPosition(-1.02) };
    state.joined = false;
    state.proximityAt = 0;
    root.dataset.state = 'intro';
    $('[data-intro]').hidden = false;
    tutorial.hidden = true;
    calibration.hidden = true;
    trace.hidden = true;
    readout.hidden = true;
    companionEl.hidden = true;
    feedbackEl.classList.remove('joined', 'locked');
    craftEl.classList.remove('moving');
    partyEl.textContent = 'PARTY 1 / 4';
    statusEl.textContent = 'AWAITING PILOT';
    calmEl.style.width = '0%';
    setElementPosition(craftEl, state.craft);
    setElementPosition(feedbackEl, state.feedback);
    drawCourse();
  }

  function animate(now) {
    const dt = Math.min(.035, (now - state.lastTime) / 1000);
    state.lastTime = now;

    if (state.mode !== 'intro' && state.mode !== 'proximity' && !state.joined) {
      state.feedback.angle += dt * .12;
      Object.assign(state.feedback, feedbackPosition());
    }

    if (state.target && !state.joined) {
      const dx = state.target.x - state.craft.x;
      const dy = state.target.y - state.craft.y;
      const distance = Math.hypot(dx, dy);
      const speed = .19;
      if (distance < .006) {
        state.craft = { ...state.target };
        const arrivedKind = state.targetKind;
        state.target = null;
        state.targetKind = null;
        craftEl.classList.remove('moving');
        destinationEl.classList.remove('active');
        statusEl.textContent = 'HOLDING POSITION';
        if (arrivedKind === 'relay' || arrivedKind === 'tug') inspect(arrivedKind);
      } else {
        state.craft.x += dx / distance * speed * dt;
        state.craft.y += dy / distance * speed * dt;
        craftEl.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
      }
    }

    const feedbackDistance = percentDistance(state.craft, state.feedback);
    rangeEl.textContent = `RANGE ${Math.round(feedbackDistance)} km`;
    if (!state.joined && state.mode === 'navigating' && feedbackDistance < 68) enterProximity();

    if (state.mode === 'proximity') {
      state.feedback.x = state.craft.x + .07;
      state.feedback.y = state.craft.y - .045 + Math.sin(now / 420) * .008;
      const calm = Math.max(0, Math.min(1, (now - state.proximityAt) / 3600));
      calmEl.style.width = `${calm * 100}%`;
      noiseEl.textContent = `FEEDBACK ${Math.round((1 - calm) * 100)}%`;
      waveEl.style.opacity = `${.35 + (1 - calm) * .65}`;
      if (calm > .35) {
        $('[data-calibration-title]').textContent = 'IT IS MATCHING YOUR DRIFT.';
        $('[data-calibration-copy]').textContent = 'No command needed. Stay with it.';
      }
      if (calm >= 1) completeEncounter();
    }

    setElementPosition(craftEl, state.craft);
    setElementPosition(feedbackEl, state.feedback);
    if (state.joined) {
      const follow = { x: state.craft.x - .055, y: state.craft.y + .055 + Math.sin(now / 500) * .006 };
      setElementPosition(companionEl, follow);
    }
    drawCourse();
    requestAnimationFrame(animate);
  }

  function audioContext() {
    if (!state.audioContext) state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioContext.state === 'suspended') state.audioContext.resume();
    return state.audioContext;
  }

  function tone(frequency, start, duration, type = 'square', volume = .025) {
    const context = audioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function tickMusic() {
    if (!state.audioOn) return;
    const context = audioContext();
    const melody = [293.66,349.23,440,392,349.23,293.66,261.63,293.66,349.23,440,523.25];
    const step = state.songStep % 11;
    tone(melody[step], context.currentTime, .13, 'square', .017);
    if (state.joined) {
      const bass = [73.42,73.42,87.31,87.31,65.41,65.41,73.42,73.42,98,87.31,73.42];
      tone(bass[step], context.currentTime, .17, 'triangle', .032);
      if ([0,3,6,8].includes(step)) tone(105 + step * 2, context.currentTime, .055, 'sawtooth', .012);
    }
    state.songStep += 1;
  }

  function startMusic() {
    state.audioOn = true;
    root.classList.add('music-on');
    audioContext();
    clearInterval(state.musicTimer);
    tickMusic();
    state.musicTimer = setInterval(tickMusic, 205);
  }

  function stopMusic() {
    state.audioOn = false;
    root.classList.remove('music-on');
    clearInterval(state.musicTimer);
  }

  function playJoinChord() {
    if (!state.audioOn) return;
    const at = audioContext().currentTime;
    [146.83, 220, 293.66, 369.99].forEach((note, index) => tone(note, at + index * .055, .65, index ? 'square' : 'triangle', .022));
  }

  space.addEventListener('click', (event) => {
    if (event.target.closest('button,aside')) return;
    const rect = space.getBoundingClientRect();
    setCourse({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
  });

  feedbackEl.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.mode === 'intro' || state.joined) return;
    const lead = feedbackPosition(state.feedback.angle + .29);
    setCourse(lead, 'feedback');
    tutorial.querySelector('[data-tutorial-title]').textContent = 'COURSE LOCKED AHEAD OF TARGET';
    tutorial.querySelector('[data-tutorial-copy]').textContent = 'Let the recorder come to you. Repeated corrections will make it bolt.';
  });

  root.querySelectorAll('[data-object="relay"],[data-object="tug"]').forEach((object) => {
    object.addEventListener('click', (event) => {
      event.stopPropagation();
      const rect = space.getBoundingClientRect();
      const objectRect = object.getBoundingClientRect();
      setCourse({ x: (objectRect.left + objectRect.width / 2 - rect.left) / rect.width, y: (objectRect.top + objectRect.height / 2 - rect.top) / rect.height }, object.dataset.object);
    });
  });

  $('[data-begin]').addEventListener('click', begin);
  $('[data-restart]').addEventListener('click', reset);
  $('[data-close-readout]').addEventListener('click', () => { readout.hidden = true; });
  $('[data-close-trace]').addEventListener('click', () => { trace.hidden = true; tutorial.hidden = false; $('[data-tutorial-title]').textContent = 'A SECOND VOICE CHANGED THE ARRANGEMENT'; $('[data-tutorial-copy]').textContent = 'Feedback is following you. A faint route beyond Bellweather is now audible.'; });
  $('[data-sound]').addEventListener('click', () => {
    if (state.audioOn) {
      stopMusic();
      $('[data-music-state]').textContent = 'MUTED';
    } else {
      startMusic();
      $('[data-music-state]').textContent = state.joined ? 'VOICE 01 + FEEDBACK · PLAYING' : 'VOICE 01 · PLAYING';
    }
  });

  reset();
  requestAnimationFrame(animate);
})();
