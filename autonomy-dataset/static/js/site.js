// Shared behaviour for all pages: mobile menu, header state, scroll-driven hero video.
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

  initScrollVideo();

  // Videos that start playing once they scroll into view and pause when they leave
  var inViewVideos = document.querySelectorAll('[data-autoplay-in-view]');
  if (inViewVideos.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.play().catch(function () {});
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.4 });
    inViewVideos.forEach(function (v) { observer.observe(v); });
  }
});

// Front-page hero: video time follows the scroll position inside .scroll-hero
function initScrollVideo() {
  var section = document.querySelector('.scroll-hero');
  var video = section && section.querySelector('[data-scroll-video]');
  if (!video) return;

  var fade = section.querySelector('[data-scroll-fade]');
  var hint = section.querySelector('[data-scroll-hint]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    section.classList.add('is-static');
    return;
  }

  // Load the whole clip into memory so seeking is instant and smooth
  fetch(video.getAttribute('src'))
    .then(function (r) { return r.blob(); })
    .then(function (blob) {
      video.src = URL.createObjectURL(blob);
      video.load();
    })
    .catch(function () {});

  // iOS only renders seeks after the video has been "played" once
  video.addEventListener('loadedmetadata', function () {
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
  });

  var current = 0;
  var target = 0;
  var ticking = false;

  function progress() {
    var rect = section.getBoundingClientRect();
    var scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  }

  function update() {
    var p = progress();

    if (fade) {
      // Title stays, then fades out over the last part of the clip
      var f = Math.min(1, Math.max(0, (p - 0.55) / 0.35));
      fade.style.opacity = 1 - f;
      fade.style.transform = 'translateY(' + (-40 * f) + 'px)';
    }
    if (hint) hint.style.opacity = p > 0.03 ? 0 : 1;

    if (video.duration) {
      target = p * (video.duration - 0.05);
      // Ease towards the target time so fast scrolling still looks smooth
      current += (target - current) * 0.25;
      if (Math.abs(target - current) < 0.01) current = target;
      if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
        video.currentTime = current;
      }
    }

    if (Math.abs(target - current) > 0.001) {
      requestAnimationFrame(update);
    } else {
      ticking = false;
    }
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  video.addEventListener('loadeddata', requestUpdate);
  requestUpdate();
}
