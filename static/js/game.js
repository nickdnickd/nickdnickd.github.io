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
  const baseAudio = root.querySelector('[data-music-base]');
  const feedbackAudio = root.querySelector('[data-music-feedback]');
  const soundButton = root.querySelector('[data-sound]');
  const anchorEls = [...root.querySelectorAll('[data-anchor]')];
  const $ = (selector) => root.querySelector(selector);

  const state = {
    mode: 'intro',
    craft: { x: .12, y: .5 },
    target: null,
    targetKind: null,
    feedback: { x: .73, y: .2, angle: -1.02 },
    lastTime: performance.now(),
    lastCommand: 0,
    fleeUntil: 0,
    proximityAt: 0,
    joined: false,
    audioOn: false
  };

  const waveHeights = [20,42,76,34,58,88,45,70,28,82,48,67,32,91,55,38,72,25,63,84,41,69,31,78];
  const anchors = {
    A: { x: .216, y: .344, angle: -2.6 },
    B: { x: .532, y: .215, angle: -1.55 },
    C: { x: .844, y: .354, angle: -.55 },
    D: { x: .838, y: .689, angle: .55 },
    E: { x: .514, y: .825, angle: 1.6 },
    F: { x: .209, y: .672, angle: 2.6 }
  };
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
    const now = performance.now();
    const isRapidCorrection = now - state.lastCommand < 1700;
    const isNearFeedback = percentDistance(state.craft, state.feedback) < 300;
    if (state.mode === 'navigating' && isRapidCorrection && isNearFeedback) {
      state.fleeUntil = now + 2600;
      state.feedback.angle += .12;
      feedbackEl.classList.add('fleeing');
      tutorial.hidden = false;
      $('[data-tutorial-title]').textContent = 'FEEDBACK HEARD THE CORRECTION — IT BOLTED';
      $('[data-tutorial-copy]').textContent = 'Chasing makes it faster. Commit ahead of it, then leave the controls alone.';
    }
    state.target = {
      x: Math.max(.045, Math.min(.955, point.x)),
      y: Math.max(.07, Math.min(.92, point.y))
    };
    state.targetKind = kind;
    anchorEls.forEach((anchor) => anchor.classList.toggle('selected', kind === `anchor-${anchor.dataset.anchor}`));
    state.lastCommand = now;
    craftEl.classList.add('moving');
    feedbackEl.classList.toggle('locked', kind === 'feedback' || kind.startsWith('anchor-'));
    statusEl.textContent = kind.startsWith('anchor-') ? `${kind.replace('anchor-', 'ANCHOR ')} COMMITTED` : kind === 'feedback' ? 'INTERCEPT COMMITTED' : 'COURSE COMMITTED';
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
    startFeedbackStem();
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
    stopMusic();
    baseAudio.currentTime = 0;
    feedbackAudio.currentTime = 0;
    state.mode = 'intro';
    state.craft = { x: .12, y: .5 };
    state.target = null;
    state.targetKind = null;
    state.feedback.angle = -1.02;
    state.feedback = { ...state.feedback, ...feedbackPosition(-1.02) };
    state.joined = false;
    state.proximityAt = 0;
    state.fleeUntil = 0;
    root.dataset.state = 'intro';
    $('[data-intro]').hidden = false;
    tutorial.hidden = true;
    calibration.hidden = true;
    trace.hidden = true;
    readout.hidden = true;
    companionEl.hidden = true;
    feedbackEl.classList.remove('joined', 'locked', 'fleeing');
    anchorEls.forEach((anchor) => anchor.classList.remove('selected', 'next'));
    craftEl.classList.remove('moving');
    partyEl.textContent = 'PARTY 1 / 4';
    statusEl.textContent = 'AWAITING PILOT';
    $('[data-music-state]').textContent = 'VOICE 01 · STANDBY';
    calmEl.style.width = '0%';
    setElementPosition(craftEl, state.craft);
    setElementPosition(feedbackEl, state.feedback);
    drawCourse();
  }

  function animate(now) {
    const dt = Math.min(.035, (now - state.lastTime) / 1000);
    state.lastTime = now;

    if (state.mode !== 'intro' && state.mode !== 'proximity' && !state.joined) {
      const fleeing = now < state.fleeUntil;
      state.feedback.angle += dt * (fleeing ? .78 : .21);
      feedbackEl.classList.toggle('fleeing', fleeing);
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
        statusEl.textContent = arrivedKind?.startsWith('anchor-') ? `WAITING AT ${arrivedKind.replace('anchor-', 'ANCHOR ')}` : 'HOLDING POSITION';
        if (arrivedKind === 'relay' || arrivedKind === 'tug') inspect(arrivedKind);
      } else {
        state.craft.x += dx / distance * speed * dt;
        state.craft.y += dy / distance * speed * dt;
        craftEl.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
      }
    }

    const feedbackDistance = percentDistance(state.craft, state.feedback);
    const fleeing = now < state.fleeUntil;
    rangeEl.textContent = fleeing ? `FLEEING ×3.7 · ${Math.round(feedbackDistance)} km` : `RANGE ${Math.round(feedbackDistance)} km`;
    if (state.mode === 'navigating') {
      const tau = Math.PI * 2;
      const current = ((state.feedback.angle % tau) + tau) % tau;
      let nextName = null;
      let nextDistance = Infinity;
      Object.entries(anchors).forEach(([name, anchor]) => {
        const angle = ((anchor.angle % tau) + tau) % tau;
        const distance = (angle - current + tau) % tau;
        if (distance < nextDistance) {
          nextDistance = distance;
          nextName = name;
        }
      });
      anchorEls.forEach((anchor) => anchor.classList.toggle('next', anchor.dataset.anchor === nextName));
    }
    if (!state.joined && state.mode === 'navigating' && now >= state.fleeUntil && feedbackDistance < 68) enterProximity();

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

  async function startMusic() {
    state.audioOn = true;
    root.classList.add('music-on');
    baseAudio.volume = .9;
    feedbackAudio.volume = .62;
    soundButton.textContent = '♪ OFF';
    try {
      await baseAudio.play();
      if (state.joined) startFeedbackStem();
      $('[data-music-state]').textContent = state.joined ? 'VOICE 01 + FEEDBACK · PLAYING' : 'VOICE 01 · PLAYING';
    } catch (error) {
      state.audioOn = false;
      root.classList.remove('music-on');
      soundButton.textContent = '♪ PLAY';
      $('[data-music-state]').textContent = 'TAP PLAY FOR SOUND';
    }
  }

  function stopMusic() {
    state.audioOn = false;
    root.classList.remove('music-on');
    baseAudio.pause();
    feedbackAudio.pause();
    soundButton.textContent = '♪ PLAY';
  }

  function startFeedbackStem() {
    if (!state.audioOn) return;
    feedbackAudio.currentTime = baseAudio.currentTime;
    feedbackAudio.play().catch(() => {
      soundButton.textContent = '♪ PLAY';
      $('[data-music-state]').textContent = 'TAP PLAY TO ADD FEEDBACK';
    });
  }

  space.addEventListener('click', (event) => {
    if (event.target.closest('button,aside')) return;
    const rect = space.getBoundingClientRect();
    setCourse({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
  });

  feedbackEl.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.mode === 'intro' || state.joined) return;
    const lead = feedbackPosition(state.feedback.angle + .75);
    setCourse(lead, 'feedback');
    tutorial.querySelector('[data-tutorial-title]').textContent = 'COURSE LOCKED AHEAD OF TARGET';
    tutorial.querySelector('[data-tutorial-copy]').textContent = 'For more control, choose any labeled anchor on its orbit. Repeated corrections make it bolt.';
  });

  anchorEls.forEach((anchorEl) => {
    anchorEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.mode === 'intro' || state.joined) return;
      const name = anchorEl.dataset.anchor;
      setCourse(anchors[name], `anchor-${name}`);
      tutorial.hidden = false;
      $('[data-tutorial-title]').textContent = `COURSE SET FOR ANCHOR ${name}`;
      $('[data-tutorial-copy]').textContent = 'P—7 will wait there. Pick another anchor too quickly and Feedback will hear the correction.';
    });
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
