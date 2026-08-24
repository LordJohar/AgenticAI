(() => {
  const ids = ['map','math','neuron','network','training','activation','softmax','tokens','sequence','attention','paper','transformer','llm','decoding','limits','glossary'];
  const key = 'agentic-ai-foundations-progress-v1';
  const highlightKey = 'agentic-ai-foundations-highlights-v1';
  const boxes = [...document.querySelectorAll('[data-progress-id]')];
  const bars = document.querySelectorAll('.progress-bar');
  const labels = document.querySelectorAll('[data-progress-text]');
  let state = {};
  let volatileProgress = {};
  let volatileHighlights = [];
  let activeHighlightSignature = '';

  const readLocal = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { return volatileProgress; }
  };
  const saveLocal = () => {
    volatileProgress = { ...state };
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

  const highlightStatus = document.querySelector('[data-highlight-status]');
  const readHighlights = () => {
    try { return JSON.parse(localStorage.getItem(highlightKey) || '[]'); } catch (_) { return volatileHighlights; }
  };
  const saveHighlights = (items) => {
    volatileHighlights = [...items];
    try { localStorage.setItem(highlightKey, JSON.stringify(items)); } catch (_) { /* optional */ }
  };
  const setHighlightStatus = (message) => {
    if (highlightStatus) highlightStatus.textContent = message;
  };
  const highlightSignature = (item) => [item.id, item.start, item.end, item.text || ''].join('|');
  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  const updateEraseState = () => {
    document.querySelector('[data-action="clear-highlights"]')?.classList.toggle('ready', Boolean(activeHighlightSignature));
  };
  const setActiveHighlight = (signature) => {
    activeHighlightSignature = signature || '';
    document.querySelectorAll('mark.study-highlight').forEach((mark) => {
      mark.classList.toggle('active-highlight', mark.dataset.highlightSignature === activeHighlightSignature);
    });
    updateEraseState();
  };
  const closestChapter = (node) => {
    const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return element?.closest?.('.chapter[id]') || null;
  };
  const textOffset = (root, node, offset) => {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    const length = range.toString().length;
    range.detach();
    return length;
  };
  const clearRenderedHighlights = () => {
    document.querySelectorAll('mark.study-highlight').forEach((mark) => {
      const text = document.createTextNode(mark.textContent || '');
      mark.replaceWith(text);
      text.parentElement?.normalize();
    });
  };
  const wrapTextRange = (section, start, end, signature) => {
    if (end <= start) return;
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let position = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeStart = position;
      const nodeEnd = position + node.nodeValue.length;
      if (nodeEnd > start && nodeStart < end) {
        nodes.push({
          node,
          start: Math.max(0, start - nodeStart),
          end: Math.min(node.nodeValue.length, end - nodeStart),
        });
      }
      position = nodeEnd;
    }
    nodes.reverse().forEach(({ node, start: nodeStart, end: nodeEnd }) => {
      if (nodeEnd <= nodeStart) return;
      const after = node.splitText(nodeEnd);
      const selected = node.splitText(nodeStart);
      const mark = document.createElement('mark');
      mark.className = 'study-highlight';
      mark.dataset.highlightSignature = signature;
      mark.title = 'برای حذف این هایلایت، اول روی آن بزن و بعد پاک‌کن را بزن.';
      mark.textContent = selected.nodeValue;
      selected.replaceWith(mark);
      after.parentElement?.normalize();
    });
  };
  const renderHighlights = () => {
    clearRenderedHighlights();
    const highlights = readHighlights()
      .filter((item) => item?.id && Number.isFinite(item.start) && Number.isFinite(item.end));
    const signatures = new Set(highlights.map(highlightSignature));
    if (!signatures.has(activeHighlightSignature)) activeHighlightSignature = '';
    highlights
      .sort((a, b) => b.start - a.start)
      .forEach((item) => {
        const section = document.getElementById(item.id);
        if (section) wrapTextRange(section, item.start, item.end, highlightSignature(item));
      });
    setActiveHighlight(activeHighlightSignature);
  };
  const addHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setHighlightStatus('اول بخشی از متن همین جزوه را انتخاب کن.');
      return;
    }
    const range = selection.getRangeAt(0);
    const section = closestChapter(range.commonAncestorContainer);
    if (!section || !section.contains(range.startContainer) || !section.contains(range.endContainer)) {
      setHighlightStatus('هایلایت فعلاً باید داخل یک فصل باشد.');
      return;
    }
    const start = textOffset(section, range.startContainer, range.startOffset);
    const end = textOffset(section, range.endContainer, range.endOffset);
    const item = {
      id: section.id,
      start: Math.min(start, end),
      end: Math.max(start, end),
      text: selection.toString().trim().slice(0, 140),
    };
    const highlights = readHighlights();
    highlights.push(item);
    saveHighlights(highlights);
    renderHighlights();
    selection.removeAllRanges();
    setHighlightStatus('هایلایت ذخیره شد.');
  };
  const removeSelectedHighlight = () => {
    const selection = window.getSelection();
    let highlights = readHighlights();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const section = closestChapter(range.commonAncestorContainer);
      if (section && section.contains(range.startContainer) && section.contains(range.endContainer)) {
        const start = textOffset(section, range.startContainer, range.startOffset);
        const end = textOffset(section, range.endContainer, range.endOffset);
        const selectedStart = Math.min(start, end);
        const selectedEnd = Math.max(start, end);
        const before = highlights.length;
        highlights = highlights.filter((item) => item.id !== section.id || !rangesOverlap(item.start, item.end, selectedStart, selectedEnd));
        const removed = before - highlights.length;
        if (removed > 0) {
          saveHighlights(highlights);
          activeHighlightSignature = '';
          renderHighlights();
          selection.removeAllRanges();
          setHighlightStatus(`${removed.toLocaleString('fa-IR')} هایلایت انتخاب‌شده پاک شد.`);
          return;
        }
      }
    }
    if (activeHighlightSignature) {
      const before = highlights.length;
      highlights = highlights.filter((item) => highlightSignature(item) !== activeHighlightSignature);
      const removed = before - highlights.length;
      saveHighlights(highlights);
      activeHighlightSignature = '';
      renderHighlights();
      setHighlightStatus(removed > 0 ? 'هایلایت انتخاب‌شده پاک شد.' : 'این هایلایت قبلاً پاک شده بود.');
      return;
    }
    setHighlightStatus('برای پاک‌کردن، اول روی یک هایلایت بزن یا متن هایلایت‌شده را انتخاب کن.');
  };
  document.addEventListener('click', (event) => {
    const mark = event.target.closest?.('mark.study-highlight');
    if (!mark) return;
    setActiveHighlight(mark.dataset.highlightSignature || '');
    setHighlightStatus('هایلایت انتخاب شد؛ برای حذف، پاک‌کن را بزن.');
  });
  document.querySelectorAll('[data-action="highlight"], [data-action="clear-highlights"]').forEach((button) => {
    button.addEventListener('mousedown', (event) => event.preventDefault());
  });
  document.querySelector('[data-action="highlight"]')?.addEventListener('click', addHighlight);
  document.querySelector('[data-action="clear-highlights"]')?.addEventListener('click', removeSelectedHighlight);
  renderHighlights();

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
