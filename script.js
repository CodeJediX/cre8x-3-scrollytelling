(() => {
  const story = document.querySelector('.scroll-film');
  const video = document.getElementById('storyVideo');
  const beats = [...document.querySelectorAll('.story-beat')];
  const progressBar = document.getElementById('scrollProgress');
  const readout = document.querySelector('.chapter-readout');
  const frameReadout = document.getElementById('frameReadout');
  const header = document.getElementById('siteHeader');
  const filmSticky = document.querySelector('.film-sticky');
  const loadingEl = document.getElementById('filmLoading');
  const chapterDots = document.getElementById('chapterDots');
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');
  const preloaderProgress = document.getElementById('preloaderProgress');
  const preloaderStatus = document.getElementById('preloaderStatus');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FPS = 24;
  const PRELOADER_MIN_MS = reducedMotion ? 100 : 1250;
  const PRELOADER_MAX_MS = 5000;
  const bootStarted = performance.now();

  let duration = 0;
  let totalFrames = 1;
  let targetTime = 0;
  let ready = false;
  let seekQueued = false;
  let pageRaf = 0;
  let preloaderValue = 0;
  let preloaderFinished = false;

  function paintPreloader(value) {
    preloaderValue = Math.min(100, Math.max(preloaderValue, value));
    if (preloaderCount) preloaderCount.textContent = String(Math.round(preloaderValue)).padStart(3, '0');
    if (preloaderProgress) preloaderProgress.style.transform = `scaleX(${preloaderValue / 100})`;
  }

  function runBootMeter() {
    if (preloaderFinished) return;
    const elapsed = performance.now() - bootStarted;
    paintPreloader(Math.min(94, 10 + elapsed / 32));
    requestAnimationFrame(runBootMeter);
  }

  function finishPreloader(status = 'SYSTEM READY / ENTER THE FORGE') {
    if (preloaderFinished) return;
    preloaderFinished = true;
    paintPreloader(100);
    if (preloaderStatus) preloaderStatus.textContent = status;

    const wait = Math.max(0, PRELOADER_MIN_MS - (performance.now() - bootStarted));
    setTimeout(() => {
      preloader?.classList.add('is-exiting');
      document.body.classList.remove('is-loading');
      setTimeout(() => preloader?.setAttribute('aria-hidden', 'true'), 950);
    }, wait + 180);
  }

  requestAnimationFrame(runBootMeter);
  setTimeout(() => finishPreloader('SEQUENCE READY / SCROLL TO BEGIN'), PRELOADER_MAX_MS);

  if (!story || !video || !filmSticky) {
    finishPreloader();
    return;
  }

  function setScrollLength() {
    if (!duration) return;
    const track = Math.max(duration * 120, window.innerHeight * 4.2);
    story.style.height = `${Math.round(window.innerHeight + track)}px`;
  }

  function progressForStory() {
    const rect = story.getBoundingClientRect();
    const scrollable = Math.max(story.offsetHeight - window.innerHeight, 1);
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  }

  function buildChapterDots() {
    if (!chapterDots || chapterDots.children.length) return;
    beats.forEach((beat, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'chapter-dot';
      dot.setAttribute('aria-label', `Jump to chapter ${index + 1}`);
      dot.addEventListener('click', () => {
        const start = Number(beat.dataset.start || 0);
        const scrollable = story.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: story.offsetTop + start * scrollable,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });
      });
      chapterDots.appendChild(dot);
    });
  }

  function updateStoryUI(progress) {
    let activeIndex = beats.length - 1;
    beats.forEach((beat, index) => {
      const start = Number(beat.dataset.start || 0);
      const end = Number(beat.dataset.end || 1);
      const active = progress >= start && progress < end;
      beat.classList.toggle('is-active', active);
      if (active) activeIndex = index;
    });

    if (readout) {
      readout.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(beats.length).padStart(2, '0')}`;
    }
    if (chapterDots) {
      [...chapterDots.children].forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
    }
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    filmSticky.style.setProperty('--p', String(progress));
    filmSticky.classList.toggle('is-scrubbing', progress > 0.005 && progress < 0.995);

    if (frameReadout && duration) {
      const frame = Math.min(totalFrames, Math.max(1, Math.round(targetTime * FPS) + 1));
      frameReadout.textContent = `F ${String(frame).padStart(3, '0')} / ${String(totalFrames).padStart(3, '0')}`;
    }
  }

  function requestSeek() {
    if (!ready || seekQueued || video.seeking || video.readyState < 2) return;
    seekQueued = true;

    requestAnimationFrame(() => {
      seekQueued = false;
      if (video.seeking || video.readyState < 2) return;
      const clamped = Math.min(Math.max(targetTime, 0), Math.max(duration - 0.04, 0));
      if (Math.abs(video.currentTime - clamped) < 0.008) return;
      try {
        video.currentTime = clamped;
      } catch (_) {
        // A newer target remains queued by the next scroll or seeked event.
      }
    });
  }

  function updateScrollStory() {
    if (!ready) return;
    const progress = progressForStory();
    targetTime = progress * Math.max(duration - 0.04, 0);
    updateStoryUI(progress);
    requestSeek();
  }

  function updateParallax() {
    if (reducedMotion) return;
    const vh = window.innerHeight;
    document.querySelectorAll('[data-parallax]').forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const speed = Number(node.dataset.parallax) || 0.1;
      const mid = rect.top + rect.height / 2 - vh / 2;
      node.style.transform = `translate3d(0, ${mid * -speed}px, 0)`;
    });
  }

  const duality = document.querySelector('.duality');
  const dualMask = document.querySelector('.duality-mask');
  function updateDuality() {
    if (!duality || !dualMask) return;
    const rect = duality.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const travel = Math.max(rect.height - innerHeight * 0.35, 1);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    dualMask.style.setProperty('--reveal', (0.18 + progress * 0.76).toFixed(3));
  }

  function paintPage() {
    pageRaf = 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 20);
    updateScrollStory();
    updateParallax();
    updateDuality();
  }

  function schedulePagePaint() {
    if (!pageRaf) pageRaf = requestAnimationFrame(paintPage);
  }

  function markVideoReady() {
    if (ready || !Number.isFinite(video.duration) || video.duration <= 0) return;
    duration = video.duration;
    totalFrames = Math.max(1, Math.round(duration * FPS));
    ready = true;
    setScrollLength();
    buildChapterDots();
    filmSticky.classList.add('is-ready');
    loadingEl?.classList.add('is-done');
    targetTime = progressForStory() * Math.max(duration - 0.04, 0);
    schedulePagePaint();
    finishPreloader();
  }

  video.addEventListener('loadedmetadata', markVideoReady);
  video.addEventListener('loadeddata', markVideoReady);
  video.addEventListener('canplay', markVideoReady);
  video.addEventListener('progress', () => {
    if (!video.duration || !video.buffered.length) return;
    const ratio = video.buffered.end(video.buffered.length - 1) / video.duration;
    paintPreloader(Math.min(96, 28 + ratio * 65));
  });
  video.addEventListener('seeked', () => {
    if (Math.abs(targetTime - video.currentTime) > 0.018) requestSeek();
  });
  video.addEventListener('error', () => {
    filmSticky.classList.add('is-ready', 'is-fallback');
    if (loadingEl) {
      loadingEl.innerHTML = '<span>Cinematic unavailable — continuing with the visual sequence.</span>';
      setTimeout(() => loadingEl.classList.add('is-done'), 1100);
    }
    finishPreloader('VISUAL FALLBACK READY / ENTER THE FORGE');
  });

  if (video.readyState >= 1) markVideoReady();
  try { video.load(); } catch (_) { /* preload may already be active */ }

  const unlockOnce = async () => {
    try {
      await video.play();
      video.pause();
      requestSeek();
    } catch (_) { /* the poster remains visible until seeking is allowed */ }
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('touchstart', unlockOnce);
    window.removeEventListener('wheel', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('touchstart', unlockOnce, { passive: true });
  window.addEventListener('wheel', unlockOnce, { passive: true, once: true });

  window.addEventListener('scroll', schedulePagePaint, { passive: true });
  window.addEventListener('resize', () => {
    setScrollLength();
    schedulePagePaint();
  }, { passive: true });

  document.querySelectorAll('.timeline-row').forEach((row, index) => {
    if (!row.dataset.delay) row.dataset.delay = String(index * 75);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = reducedMotion ? 0 : Number(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));

  if (matchMedia('(pointer:fine)').matches && !reducedMotion) {
    document.querySelectorAll('.glass-interactive').forEach((surface) => {
      surface.addEventListener('pointermove', (event) => {
        const rect = surface.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        surface.style.setProperty('--mx', `${x.toFixed(1)}%`);
        surface.style.setProperty('--my', `${y.toFixed(1)}%`);
      }, { passive: true });
      surface.addEventListener('pointerleave', () => {
        surface.style.setProperty('--mx', '50%');
        surface.style.setProperty('--my', '50%');
      }, { passive: true });
    });
  }

  const glow = document.querySelector('.cursor-glow');
  if (matchMedia('(pointer:fine)').matches && glow && !reducedMotion) {
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let targetX = x;
    let targetY = y;
    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.style.opacity = '1';
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    (function followPointer() {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      glow.style.transform = `translate3d(${x - 224}px, ${y - 224}px, 0)`;
      requestAnimationFrame(followPointer);
    })();
  }

  document.querySelectorAll('.volt-line').forEach((line, index) => {
    line.style.animationDelay = `${index * 0.35}s`;
  });

  schedulePagePaint();
})();
