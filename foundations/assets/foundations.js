(() => {
  const ids = ['map','math','neuron','network','training','activation','softmax','tokens','sequence','attention','paper','transformer','llm','decoding','limits','glossary'];
  const key = 'agentic-ai-foundations-progress-v1';
  const boxes = [...document.querySelectorAll('[data-progress-id]')];
  const bars = document.querySelectorAll('.progress-bar');
  const labels = document.querySelectorAll('[data-progress-text]');
  let state = {};

  const readLocal = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { return {}; }
  };
  const saveLocal = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) { /* optional */ }
  };
  const syncBoxes = (id) => {
    boxes
      .filter((box) => box.dataset.progressId === id)
      .forEach((box) => { box.checked = Boolean(state[id]); });
  };
  const renderProgress = () => {
    const done = ids.filter((id) => Boolean(state[id])).length;
    const pct = Math.round(done / ids.length * 100);
    bars.forEach((bar) => { bar.style.width = `${pct}%`; });
    labels.forEach((label) => { label.textContent = `${pct.toLocaleString('fa-IR')}٪`; });
  };
  const bindProgress = (defaults) => {
    state = { ...defaults, ...readLocal() };
    boxes.forEach((box) => {
      box.checked = Boolean(state[box.dataset.progressId]);
      box.addEventListener('change', () => {
        state[box.dataset.progressId] = box.checked;
        syncBoxes(box.dataset.progressId);
        saveLocal();
        renderProgress();
      });
    });
    renderProgress();
  };

  fetch('progress.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : {})
    .then(bindProgress)
    .catch(() => bindProgress({}));

  const sidebar = document.querySelector('.sidebar');
  const links = [...document.querySelectorAll('.toc a')];
  document.querySelector('[data-action="menu"]')?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  links.forEach((link) => link.addEventListener('click', () => sidebar?.classList.remove('open')));
  document.querySelectorAll('[data-action="print"]').forEach((button) => button.addEventListener('click', () => window.print()));
  document.querySelector('#toc-search')?.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLocaleLowerCase('fa');
    links.forEach((link) => link.closest('.toc-item')?.classList.toggle('hidden', query && !link.textContent.toLocaleLowerCase('fa').includes(query)));
  });

  const sections = [...document.querySelectorAll('.chapter[id]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle('active', link.hash === `#${visible.target.id}`));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.3] });
    sections.forEach((section) => observer.observe(section));
  }

  const softmaxInput = document.querySelector('[data-softmax-input]');
  const temperatureInput = document.querySelector('[data-temperature]');
  const softmaxOutput = document.querySelector('[data-softmax-output]');
  const renderSoftmax = () => {
    if (!softmaxInput || !temperatureInput || !softmaxOutput) return;
    const logits = softmaxInput.value.split(',').map(Number).filter(Number.isFinite).slice(0, 8);
    const temperature = Math.max(0.05, Number(temperatureInput.value) || 1);
    if (logits.length < 2) { softmaxOutput.textContent = 'حداقل دو logit با کاما وارد کنید.'; return; }
    const scaled = logits.map((value) => value / temperature);
    const max = Math.max(...scaled);
    const exps = scaled.map((value) => Math.exp(value - max));
    const sum = exps.reduce((total, value) => total + value, 0);
    const probabilities = exps.map((value) => value / sum);
    softmaxOutput.innerHTML = probabilities.map((value, index) => `<div class="probability"><span>class ${index + 1}</span><div class="probability-track"><div class="probability-fill" style="width:${value * 100}%"></div></div><strong>${(value * 100).toFixed(2)}%</strong></div>`).join('');
  };
  softmaxInput?.addEventListener('input', renderSoftmax);
  temperatureInput?.addEventListener('input', renderSoftmax);
  renderSoftmax();
})();
