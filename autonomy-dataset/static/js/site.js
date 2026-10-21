// Shared behaviour for all LOAM pages: mobile menu, header state, video modal.
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

  // Transparent header over the front-page video turns solid on scroll
  if (header && header.classList.contains('is-overlay')) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Full-quality video player in a modal
  var modal = document.querySelector('.modal');
  if (modal) {
    var player = modal.querySelector('video');
    var close = function () {
      modal.classList.remove('is-open');
      player.pause();
    };
    document.querySelectorAll('[data-open-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.classList.add('is-open');
        player.currentTime = 0;
        player.play();
      });
    });
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }
});
