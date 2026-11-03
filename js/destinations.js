"use strict";
const search = document.querySelector('#destination-search');
const region = document.querySelector('#region-filter');
const category = document.querySelector('#category-filter');
const params = new URLSearchParams(location.search);
search.value = params.get('q') || '';
if ([...category.options].some(option => option.value === params.get('category'))) category.value = params.get('category');
function filterDestinations() {
  const term = search.value.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll('#destination-grid .destination-card').forEach((card, index) => {
    const d = window.WANDERLUX_DESTINATIONS[index];
    const match = (!term || `${d.name} ${d.country} ${d.description}`.toLowerCase().includes(term)) && (!region.value || d.region === region.value) && (!category.value || d.category === category.value);
    card.hidden = !match;
    if (match) { count++; card.classList.add('visible'); }
  });
  document.querySelector('#result-count').textContent = `${count} destination${count === 1 ? '' : 's'} to inspire your next journey`;
  document.querySelector('#no-results').hidden = count !== 0;
}
[search, region, category].forEach(el => el.addEventListener('input', filterDestinations));
document.querySelector('#destination-filter').addEventListener('submit', e => e.preventDefault());
document.querySelector('#destination-filter').addEventListener('reset', () => setTimeout(filterDestinations, 0));
filterDestinations();
