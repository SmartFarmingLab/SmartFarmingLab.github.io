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

  initVideoModal();
});

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
