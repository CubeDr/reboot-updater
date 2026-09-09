(() => {
  const video = document.querySelector('#hero-video');
  const button = document.querySelector('.hero-film-toggle');
  if (!video || !button) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const connection = navigator.connection;
  let userPaused = false;
  let userStarted = false;
  let visible = true;
  const allowed = () => !userPaused && (userStarted || (!reduced.matches && !connection?.saveData));
  const label = () => {
    const playing = !video.paused && !video.ended;
    button.textContent = playing ? '영상 정지  Ⅱ' : '영상 재생  ▶';
    button.setAttribute('aria-label', playing ? '배경 영상 정지' : '배경 영상 재생');
  };
  const source = () => {
    const next = mobile.matches ? video.dataset.mobile : video.dataset.desktop;
    if (video.getAttribute('src') !== next) { video.src = next; video.load(); }
    else if (video.error) { video.load(); }
  };
  const sync = () => {
    if (!allowed() || document.hidden || !visible) { video.pause(); return; }
    video.muted = true;
    video.autoplay = true;
    video.preload = 'auto';
    source();
    video.play().catch(label);
  };
  button.addEventListener('click', () => {
    if (!video.paused) { userPaused = true; video.pause(); }
    else { userPaused = false; userStarted = true; sync(); }
  });
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  video.addEventListener('error', () => {
    video.pause();
    video.style.opacity = '0';
    button.textContent = '영상 다시 재생  ▶';
  });
  video.addEventListener('playing', () => { video.style.opacity = '1'; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { userStarted = false; sync(); });
  mobile.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, {threshold:0}).observe(video.closest('section'));
  }
  sync();
})();
