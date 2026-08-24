(() => {
  const contentRoot = document.querySelector('[data-highlight-root], main.content, main.shell, main.site-shell, main');
  if (!contentRoot || window.__agenticStudyHighlightsInstalled) return;
  window.__agenticStudyHighlightsInstalled = true;

  const pageKey = window.location.pathname.replace(/[^\w/-]+/g, '-').replace(/\/+/g, '/');
  const highlightKey = `agentic-ai-study-highlights-v2:${pageKey}`;
  const legacyHighlightKey = pageKey.includes('/foundations/') ? 'agentic-ai-foundations-highlights-v1' : '';
  let volatileHighlights = [];
  let activeHighlightSignature = '';

  const style = document.createElement('style');
  style.textContent = `
    .floating-study-tools { position: fixed; left: 18px; top: 50%; transform: translateY(-50%); z-index: 30; display: grid; gap: .55rem; padding: .45rem; border: 1px solid var(--line, #dce2ee); border-radius: 16px; background: rgba(255,255,255,.92); box-shadow: var(--shadow, 0 12px 32px rgba(30,42,78,.10)); backdrop-filter: blur(10px); }
    .floating-tool { display: grid; place-items: center; width: 48px; height: 48px; cursor: pointer; border: 1px solid var(--line, #dce2ee); border-radius: 12px; color: var(--text, #182033); background: var(--surface, #fff); transition: transform .15s ease, border-color .15s ease, background .15s ease; }
    .floating-tool:hover { transform: translateY(-1px); border-color: var(--primary, #3a5ccc); }
    .floating-tool svg { width: 25px; height: 25px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
    .highlight-tool { color: #7c5a00; background: #fff1a8; }
    .erase-tool { color: var(--muted, #5c667a); }
    .erase-tool.ready { color: #7c5a00; border-color: #d6a000; background: #fff7cf; }
    .study-highlight { cursor: pointer; padding: .05rem .12rem; border-radius: .25rem; background: #fff1a8; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
    .study-highlight.active-highlight { outline: 2px solid #d6a000; outline-offset: 2px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; clip-path: inset(50%); }
    @media (max-width: 880px) {
      .floating-study-tools { left: .65rem; top: auto; bottom: 1rem; transform: none; grid-auto-flow: column; }
      .floating-tool { width: 44px; height: 44px; }
    }
    @media print { .floating-study-tools { display: none !important; } }
  `;
  document.head.appendChild(style);

  const ensureToolbar = () => {
    let toolbar = document.querySelector('.floating-study-tools');
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.className = 'floating-study-tools';
    toolbar.setAttribute('aria-label', 'ابزار هایلایت');
    toolbar.innerHTML = `
      <button class="floating-tool highlight-tool" type="button" data-action="highlight" title="هایلایت زرد" aria-label="هایلایت زرد">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.4 19.6 8.6 9.2 19H5v-4.2L15.4 4.4Z"/><path d="M13.8 6 18 10.2"/><path d="M4 21h16"/></svg>
      </button>
      <button class="floating-tool erase-tool" type="button" data-action="clear-highlights" title="پاک‌کردن هایلایت انتخاب‌شده" aria-label="پاک‌کردن هایلایت انتخاب‌شده">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16 14.5 5.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L10 18H6l-2-2Z"/><path d="M10 18h10"/><path d="M12.5 7.5l4 4"/></svg>
      </button>
      <p class="sr-only" data-highlight-status aria-live="polite">متن نامفهوم را انتخاب کن و هایلایت بزن.</p>
    `;
    document.body.appendChild(toolbar);
    return toolbar;
  };

  const toolbar = ensureToolbar();
  const highlightStatus = toolbar.querySelector('[data-highlight-status]') || document.querySelector('[data-highlight-status]');

  const readHighlights = () => {
    try {
      let raw = localStorage.getItem(highlightKey);
      if (!raw && legacyHighlightKey) {
        raw = localStorage.getItem(legacyHighlightKey);
        if (raw) localStorage.setItem(highlightKey, raw);
      }
      const items = JSON.parse(raw || '[]');
      return Array.isArray(items) ? items : [];
    } catch (_) {
      return volatileHighlights;
    }
  };
  const saveHighlights = (items) => {
    volatileHighlights = [...items];
    try { localStorage.setItem(highlightKey, JSON.stringify(items)); } catch (_) { /* storage is optional */ }
  };
  const setHighlightStatus = (message) => {
    if (highlightStatus) highlightStatus.textContent = message;
  };
  const highlightSignature = (item) => [item.id, item.start, item.end, item.text || ''].join('|');
  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  const updateEraseState = () => {
    toolbar.querySelector('[data-action="clear-highlights"]')?.classList.toggle('ready', Boolean(activeHighlightSignature));
  };
  const setActiveHighlight = (signature) => {
    activeHighlightSignature = signature || '';
    contentRoot.querySelectorAll('mark.study-highlight').forEach((mark) => {
      mark.classList.toggle('active-highlight', mark.dataset.highlightSignature === activeHighlightSignature);
    });
    updateEraseState();
  };
  const closestHighlightContainer = (node) => {
    const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const scoped = element?.closest?.('section[id], article[id], header[id], main[id], [data-highlight-scope]');
    if (scoped && contentRoot.contains(scoped)) return scoped;
    return contentRoot;
  };
  const containerKey = (container) => container === contentRoot ? '__page__' : container.id;
  const containerByKey = (id) => id === '__page__' ? contentRoot : document.getElementById(id);
  const textOffset = (root, node, offset) => {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    const length = range.toString().length;
    range.detach();
    return length;
  };
  const clearRenderedHighlights = () => {
    contentRoot.querySelectorAll('mark.study-highlight').forEach((mark) => {
      const text = document.createTextNode(mark.textContent || '');
      mark.replaceWith(text);
      text.parentElement?.normalize();
    });
  };
  const wrapTextRange = (section, start, end, signature) => {
    if (end <= start) return;
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement?.closest?.('script, style, textarea, input, select, button, mark.study-highlight')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
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
        const section = containerByKey(item.id);
        if (section && contentRoot.contains(section)) wrapTextRange(section, item.start, item.end, highlightSignature(item));
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
    const section = closestHighlightContainer(range.commonAncestorContainer);
    if (!section || !contentRoot.contains(range.startContainer) || !contentRoot.contains(range.endContainer)) {
      setHighlightStatus('هایلایت فقط روی متن همین صفحه ذخیره می‌شود.');
      return;
    }
    const start = textOffset(section, range.startContainer, range.startOffset);
    const end = textOffset(section, range.endContainer, range.endOffset);
    const item = {
      id: containerKey(section),
      start: Math.min(start, end),
      end: Math.max(start, end),
      text: selection.toString().trim().slice(0, 140),
    };
    if (item.end <= item.start || !item.text) {
      setHighlightStatus('متن انتخاب‌شده برای هایلایت مناسب نیست.');
      return;
    }
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
      const section = closestHighlightContainer(range.commonAncestorContainer);
      if (section && contentRoot.contains(range.startContainer) && contentRoot.contains(range.endContainer)) {
        const start = textOffset(section, range.startContainer, range.startOffset);
        const end = textOffset(section, range.endContainer, range.endOffset);
        const selectedStart = Math.min(start, end);
        const selectedEnd = Math.max(start, end);
        const id = containerKey(section);
        const before = highlights.length;
        highlights = highlights.filter((item) => item.id !== id || !rangesOverlap(item.start, item.end, selectedStart, selectedEnd));
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

  contentRoot.addEventListener('click', (event) => {
    const mark = event.target.closest?.('mark.study-highlight');
    if (!mark || !contentRoot.contains(mark)) return;
    setActiveHighlight(mark.dataset.highlightSignature || '');
    setHighlightStatus('هایلایت انتخاب شد؛ برای حذف، پاک‌کن را بزن.');
  });
  toolbar.querySelectorAll('[data-action="highlight"], [data-action="clear-highlights"]').forEach((button) => {
    button.addEventListener('mousedown', (event) => event.preventDefault());
  });
  toolbar.querySelector('[data-action="highlight"]')?.addEventListener('click', addHighlight);
  toolbar.querySelector('[data-action="clear-highlights"]')?.addEventListener('click', removeSelectedHighlight);
  renderHighlights();
})();
