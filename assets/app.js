// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
});

// Illustrative motivation model:
// pull = interest + value / (1 + k * delay); the task starts when pull >= effort to start.
const PRESETS = {
  game: { interest: 9, value: 2, delay: 0 },
  taxes: { interest: 1, value: 8, delay: 8 },
  tomorrow: { interest: 1, value: 8, delay: 0.25 },
};
const K = { typical: 0.1, adhd: 0.8 };
const BASE_EFFORT = 4.5;
const SCALE_MAX = 12;
const INGREDIENTS = {
  reward: { interest: 2 },
  novelty: { interest: 1.5 },
  urgency: { maxDelay: 0.25 },
  double: { effort: -1 },
  first: { effort: -1.5 },
};

const $ = (id) => document.getElementById(id);
const sliders = { interest: $('interest'), value: $('value'), delay: $('delay') };
let profile = 'adhd';

function setPressed(attr, val) {
  document.querySelectorAll(`[data-${attr}]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === val)));
}

function applyPreset(name) {
  Object.entries(PRESETS[name]).forEach(([k, v]) => { sliders[k].value = v; });
  setPressed('preset', name);
  update();
}

function delayLabel(weeks) {
  if (weeks === 0) return 'right now';
  if (weeks < 1) return `${Math.round(weeks * 7)} day${Math.round(weeks * 7) === 1 ? '' : 's'}`;
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
}

function update() {
  let interest = +sliders.interest.value;
  const value = +sliders.value.value;
  let delay = +sliders.delay.value;
  let effort = BASE_EFFORT;
  const active = [];

  document.querySelectorAll('[data-ing]').forEach((c) => {
    if (!c.checked) return;
    const ing = INGREDIENTS[c.dataset.ing];
    active.push(c.dataset.ing);
    if (ing.interest) interest += ing.interest;
    if (ing.maxDelay !== undefined) delay = Math.min(delay, ing.maxDelay);
    if (ing.effort) effort += ing.effort;
  });

  const future = value / (1 + K[profile] * delay);
  const pull = interest + future;
  const go = pull >= effort;

  $('o-interest').textContent = sliders.interest.value;
  $('o-value').textContent = sliders.value.value;
  $('o-delay').textContent = delayLabel(+sliders.delay.value);

  const fill = $('pull-fill');
  fill.style.width = `${Math.min(100, (pull / SCALE_MAX) * 100)}%`;
  fill.classList.toggle('go', go);
  $('threshold-line').style.left = `${(effort / SCALE_MAX) * 100}%`;

  const verdict = $('verdict');
  verdict.textContent = go ? 'The task gets started.' : 'Stuck: the task keeps getting put off.';
  verdict.className = `verdict ${go ? 'go' : 'stuck'}`;

  const futureShare = pull > 0 ? Math.round((future / pull) * 100) : 0;
  let msg;
  if (go && interest >= 6) msg = 'Most of the pull comes from the task itself being rewarding right now. Deadlines barely matter.';
  else if (go && delay < 1) msg = `The deadline is close, so the outcome's importance finally counts at nearly full strength (${futureShare}% of the pull).`;
  else if (go && active.length) msg = 'The added ingredients supplied what the task was missing: reward now, a closer deadline, or a lower barrier to starting.';
  else if (go) msg = `With gentler discounting, the outcome still feels important from a distance (${futureShare}% of the pull).`;
  else if (profile === 'adhd' && delay >= 1) msg = `The outcome matters, but steep discounting shrinks its pull to ${future.toFixed(1)} out of ${value} at this distance. Try adding ingredients.`;
  else msg = 'Not enough pull yet. Raise the interest, bring the payoff closer, or lower the effort to start.';
  $('explain').textContent = msg;
}

document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
document.querySelectorAll('[data-profile]').forEach((b) => b.addEventListener('click', () => {
  profile = b.dataset.profile;
  setPressed('profile', profile);
  update();
}));
Object.values(sliders).forEach((s) => s.addEventListener('input', () => { setPressed('preset', ''); update(); }));
document.querySelectorAll('[data-ing]').forEach((c) => c.addEventListener('change', update));

applyPreset('taxes');
