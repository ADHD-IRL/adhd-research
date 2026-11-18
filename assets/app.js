// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
function setNav(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close' : 'Menu';
  document.body.classList.toggle('nav-open', open);
}
toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); } });
document.addEventListener('click', (e) => {
  if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
});
window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setNav(false); });

// Label table cells so tables can stack into cards on phones
document.querySelectorAll('table.matrix').forEach((t) => {
  const heads = [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim());
  t.querySelectorAll('tbody tr').forEach((tr) => {
    [...tr.children].forEach((cell, i) => { if (cell.tagName === 'TD' && heads[i]) cell.dataset.label = heads[i]; });
  });
});

// Contents bar: highlight the section in view
const tocLinks = [...document.querySelectorAll('.toc-bar a[href^="#"]')];
if (tocLinks.length) {
  const targets = tocLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let current = null, ticking = false;
  const update = () => {
    ticking = false;
    let id = targets[0].id;
    targets.forEach((t) => { if (t.getBoundingClientRect().top <= 160) id = t.id; });
    if (id === current) return;
    current = id;
    tocLinks.forEach((a) => {
      const on = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', on);
      if (on) {
        const bar = a.parentElement;
        const left = a.offsetLeft - bar.offsetLeft;
        if (left < bar.scrollLeft || left + a.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: left - 16 });
      }
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; setTimeout(update, 60); } }, { passive: true });
  update();
}

// "Stuck? Try one thing": pick a feeling, see one idea at a time, optional 10-minute timer
const ck = document.querySelector('.cat-check');
if (ck && ck.querySelector('.ck-pick')) {
  ck.classList.add('ck-on');
  ck.querySelector('.ck-pick').hidden = false;
  const tools = ck.querySelector('.ck-tools');
  const btns = [...ck.querySelectorAll('.ck-btn')];
  const cards = [...ck.querySelectorAll('.ck-card')];
  const another = ck.querySelector('.ck-another');
  const timerBtn = ck.querySelector('.ck-timer');
  const clock = ck.querySelector('.ck-clock');
  let card = null, idx = 0, timer = null, ends = 0;

  const show = () => {
    const ideas = [...card.querySelectorAll('li')];
    ideas.forEach((li, i) => li.classList.toggle('is-on', i === idx % ideas.length));
    another.hidden = ideas.length < 2;
  };
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    card = cards.find((c) => c.dataset.feel === b.dataset.feel);
    cards.forEach((c) => c.classList.toggle('is-on', c === card));
    ck.classList.add('ck-picked');
    tools.hidden = false;
    idx = 0;
    show();
  }));
  another.addEventListener('click', () => { idx += 1; show(); });

  const tick = () => {
    const left = Math.max(0, Math.round((ends - Date.now()) / 1000));
    if (left === 0) {
      clearInterval(timer); timer = null;
      timerBtn.textContent = 'Start a 10-minute timer';
      clock.textContent = "Time's up. If you started, that worked. Use it again next time.";
      return;
    }
    clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left. Just keep going.`;
  };
  timerBtn.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer); timer = null;
      timerBtn.textContent = 'Start a 10-minute timer';
      clock.textContent = 'Timer stopped.';
      return;
    }
    ends = Date.now() + 10 * 60 * 1000;
    timerBtn.textContent = 'Stop timer';
    timer = setInterval(tick, 1000);
    tick();
  });
}

if (document.getElementById('interest')) {
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
}
