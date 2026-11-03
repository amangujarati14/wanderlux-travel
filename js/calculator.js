"use strict";
const DAILY_RATES = Object.freeze({ Bali: 90, Paris: 180, Maldives: 250, Switzerland: 210, Dubai: 160, Japan: 170 });
// Accommodation is a per-traveller/day supplement; activities are once per traveller.
function calculateTrip({ destination, travellers, days, multiplier, accommodation, guided, activities }) {
  if (!Object.hasOwn(DAILY_RATES, destination) || !Number.isInteger(travellers) || travellers < 1 || travellers > 20 || !Number.isInteger(days) || days < 1 || days > 30 || ![0.8, 1, 1.8].includes(multiplier) || ![0, 35, 85].includes(accommodation)) throw new Error('Invalid trip preferences');
  const base = DAILY_RATES[destination] * travellers * days * multiplier;
  const stay = accommodation * travellers * days;
  const tours = guided ? 25 * travellers * days : 0;
  const extras = activities ? 60 * travellers : 0;
  return { base, stay, tours, extras, total: base + stay + tours + extras };
}
window.calculateTrip = calculateTrip;
const calculator = document.querySelector('#calculator-form');
const result = document.querySelector('#calculator-result');
calculator.elements.style.value = '1';
const usd = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
function calcError(id, message) {
  const el = document.getElementById(id);
  el.setAttribute('aria-invalid', String(Boolean(message)));
  document.getElementById(id + '-error').textContent = message;
}
calculator.addEventListener('submit', event => {
  event.preventDefault();
  let valid = true;
  for (const [id, max] of [['travellers', 20], ['days', 30]]) {
    const value = Number(calculator.elements[id].value);
    const error = !Number.isInteger(value) || value < 1 || value > max ? `Enter a whole number from 1 to ${max}.` : '';
    calcError(id, error); if (error) valid = false;
  }
  if (!valid) { calculator.querySelector('[aria-invalid="true"]').focus(); return; }
  const destination = calculator.elements.destination.value;
  const travellers = Number(calculator.elements.travellers.value);
  const days = Number(calculator.elements.days.value);
  const multiplier = Number(calculator.elements.style.value);
  const accommodation = Number(calculator.elements.accommodation.value);
  const cost = calculateTrip({ destination, travellers, days, multiplier, accommodation, guided: calculator.elements.guided.checked, activities: calculator.elements.activities.checked });
  const style = { 0.8: 'Budget', 1: 'Standard', 1.8: 'Luxury' }[multiplier];
  result.innerHTML = `<p class="estimate-summary">${destination} · ${travellers} traveller${travellers === 1 ? '' : 's'} · ${days} day${days === 1 ? '' : 's'} · ${style}</p><dl class="breakdown"><div><dt>Base: ${usd(DAILY_RATES[destination])} × ${travellers} × ${days} × ${multiplier}</dt><dd>${usd(cost.base)}</dd></div><div><dt>Accommodation supplement</dt><dd>${usd(cost.stay)}</dd></div><div><dt>Guided tours</dt><dd>${usd(cost.tours)}</dd></div><div><dt>Additional activities</dt><dd>${usd(cost.extras)}</dd></div></dl><p class="eyebrow">ESTIMATED TOTAL · USD</p><div class="estimate-total">${usd(cost.total)}</div>`;
  result.classList.remove('result-animate'); void result.offsetWidth; result.classList.add('result-animate');
  const imageIndex = { Bali: 0, Paris: 1, Maldives: 2, Switzerland: 3, Dubai: 4, Japan: 5 }[destination];
  document.querySelector('#estimate-image').src = `assets/images/destination-${imageIndex}.jpg`;
  document.querySelector('#estimate-image').alt = `${destination} travel inspiration`;
  document.querySelector('#estimate-enquiry').href = `appointment.html?destination=${encodeURIComponent(destination)}`;
});
calculator.addEventListener('input', () => { if (result.querySelector('.estimate-total')) result.innerHTML = '<p>Preferences changed. Calculate again for an updated estimate.</p>'; });
calculator.addEventListener('reset', () => {
  ['travellers', 'days'].forEach(id => calcError(id, ''));
  result.innerHTML = '<p>Choose your preferences and calculate to see your personalised estimate.</p>';
  document.querySelector('#estimate-image').src = 'assets/images/destination-0.jpg';
  document.querySelector('#estimate-image').alt = 'Bali tropical escape';
  document.querySelector('#estimate-enquiry').href = 'appointment.html';
});
