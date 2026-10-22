// Shared behaviour for all pages: mobile menu, header state, maximizable hero video.
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
    // Close the mobile menu after picking a link
    header.querySelectorAll('.nav-menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  initHeroVideo();
  initVideoModal();
});

// Front-page background video: lighter file on phones, and a retry when autoplay is blocked
function initHeroVideo() {
  var video = document.querySelector('[data-hero-video]');
  if (!video) return;

  var small = window.matchMedia('(max-width: 768px)').matches;
  var src = (small && video.dataset.srcMobile) || video.dataset.src;
  if (src && !video.getAttribute('src')) video.src = src;

  // Some browsers only honour the property, not the attribute, for muted autoplay
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');

  function tryPlay() {
    if (document.querySelector('.modal.is-open')) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  tryPlay();
  video.addEventListener('canplay', function () {
    if (video.paused) tryPlay();
  }, { once: true });

  // Browsers in battery or data saving mode block autoplay until the first interaction
  var events = ['touchstart', 'pointerdown', 'scroll', 'keydown'];
  function onFirstInteraction() {
    if (video.paused) tryPlay();
    events.forEach(function (e) { window.removeEventListener(e, onFirstInteraction); });
  }
  events.forEach(function (e) {
    window.addEventListener(e, onFirstInteraction, { passive: true });
  });

  // Resume after switching tabs or apps
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && video.paused) tryPlay();
  });
}

// Front-page hero: open the looping background video large, with controls
function initVideoModal() {
  var modal = document.querySelector('.modal');
  if (!modal) return;

  var player = modal.querySelector('video');
  var background = document.querySelector('[data-hero-video]');

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Continue where the background video currently is
    var start = background ? background.currentTime : 0;
    var resume = function () {
      player.currentTime = start;
      player.play().catch(function () {});
    };
    if (player.readyState >= 1) {
      resume();
    } else {
      player.preload = 'auto';
      player.addEventListener('loadedmetadata', resume, { once: true });
      player.load();
    }
    if (background) background.pause();
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    player.pause();
    if (background) {
      background.currentTime = player.currentTime;
      background.play().catch(function () {});
    }
  }

  document.querySelectorAll('[data-open-video]').forEach(function (btn) {
    btn.addEventListener('click', open);
  });
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}
