"use strict";
// Shared navigation and progressive scroll reveals.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); }
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 15), { passive: true });
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => { el.classList.add('ready'); observer.observe(el); });
}
// Responsive carousel: offscreen cards are excluded from keyboard navigation.
const carousel = document.querySelector('.carousel');
if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const cards = [...track.children];
  const pauseButton = carousel.querySelector('[data-carousel="pause"]');
  let index = 0, paused = reducedMotion.matches, timer;
  function visibleCount() { return window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : 3; }
  function render() {
    const visible = visibleCount();
    index = Math.min(index, cards.length - visible);
    track.style.transform = `translateX(-${index * (cards[0].getBoundingClientRect().width + 25)}px)`;
    carousel.querySelector('.carousel-status').textContent = `${String(index + 1).padStart(2, '0')} — ${String(cards.length).padStart(2, '0')}`;
    cards.forEach((card, i) => {
      const shown = i >= index && i < index + visible;
      card.inert = !shown;
      card.setAttribute('aria-hidden', String(!shown));
      if (shown) card.classList.add('visible');
    });
  }
  function move(step) { index = (index + step + cards.length - visibleCount() + 1) % (cards.length - visibleCount() + 1); render(); }
  function start() {
    clearInterval(timer);
    if (!paused && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) timer = setInterval(() => move(1), 5500);
  }
  function pauseLabel() { pauseButton.textContent = paused ? '▶' : 'Ⅱ'; pauseButton.setAttribute('aria-label', paused ? 'Resume destination rotation' : 'Pause destination rotation'); }
  carousel.querySelectorAll('[data-carousel]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.carousel;
    if (action === 'pause') { paused = !paused; pauseLabel(); } else move(action === 'next' ? 1 : -1);
    start();
  }));
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', () => clearInterval(timer));
  carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) setTimeout(start, 0); });
  document.addEventListener('visibilitychange', () => { document.hidden ? clearInterval(timer) : start(); });
  window.addEventListener('resize', render);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; pauseLabel(); start(); });
  render(); pauseLabel(); start();
}
