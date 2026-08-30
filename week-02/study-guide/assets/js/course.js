(() => {
  const scriptUrl = document.currentScript?.src;
  const chapters = [
    ['orientation', '۰', 'این هفته قرار است چه چیزی را بفهمی؟'],
    ['prompt-mental-model', '۱', 'Prompt دقیقاً چیست؟'],
    ['prompt-fundamentals', '۲', 'اجزای یک Prompt خوب'],
    ['system-role', '۳', 'System prompt و role design'],
    ['context-engineering', '۴', 'Context engineering'],
    ['structured-output', '۵', 'Structured output و JSON Schema'],
    ['function-calling', '۶', 'Function calling: پیشنهاد، اجرا، پاسخ'],
    ['tool-schema', '۷', 'طراحی Tool schema'],
    ['workflow', '۸', 'اصول Workflow design'],
    ['safety', '۹', 'ایمنی: داده، دستور و Prompt injection'],
    ['evaluation', '۱۰', 'ارزیابی و اشکال‌زدایی'],
    ['practice-map', '۱۱', 'نقشهٔ ورود به تمرین‌های هفته'],
    ['glossary', '۱۲', 'واژه‌نامهٔ هفتهٔ دوم'],
  ];
  const progressIds = chapters.map(([id]) => id);
  const progressKey = 'agentic-ai-week-02-study-guide-progress-v1';

  const storageGet = (key) => {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  };
  const storageSet = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch (_) { /* storage is optional */ }
  };

  function installAppShell() {
    const content = document.querySelector('main.content');
    if (!content || content.closest('.app-shell')) return;

    const toc = chapters.map(([id, number, title]) => `
      <div class="toc-row">
        <input type="checkbox" data-progress-id="${id}" aria-label="خواندم: ${title}">
        <a href="#${id}" data-chapter-id="${id}">${number}. ${title}</a>
      </div>`).join('');

    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.innerHTML = `
      <aside class="sidebar" aria-label="راهنمای مطالعه">
        <a class="brand" href="#main-content">
          <span class="brand-mark">AI</span>
          <span><h1>Agentic AI</h1><small>هفتهٔ دوم · راهنمای مطالعه</small></span>
        </a>
        <div class="progress-wrap" aria-label="پیشرفت مطالعه">
          <div class="progress-label"><span>پیشرفت کل</span><strong data-progress-text>۰٪</strong></div>
          <div class="progress-track" aria-hidden="true"><div class="progress-bar"></div></div>
        </div>
        <label class="search-box">
          <span class="sr-only">جست‌وجوی فصل</span>
          <input id="toc-search" type="search" placeholder="جست‌وجوی فصل…" autocomplete="off">
        </label>
        <nav class="toc" aria-label="فصل‌ها">${toc}</nav>
        <div class="sidebar-actions"><button class="icon-button" type="button" data-action="print">چاپ / PDF</button></div>
      </aside>
      <div class="main">
        <div class="mobile-bar">
          <button class="icon-button" type="button" data-action="menu" aria-label="باز کردن فهرست">فهرست</button>
          <strong data-progress-text>۰٪</strong>
        </div>
      </div>`;
    content.before(shell);
    shell.querySelector('.main').appendChild(content);
  }

  installAppShell();
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('[data-action="menu"]');
  const printButton = document.querySelector('[data-action="print"]');
  const search = document.querySelector('#toc-search');
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const progressBoxes = [...document.querySelectorAll('[data-progress-id]')];
  const progressBars = document.querySelectorAll('.progress-bar');
  const progressTexts = document.querySelectorAll('[data-progress-text]');
  let progressState = {};

  function updateProgress() {
    const complete = progressIds.filter((id) => Boolean(progressState[id])).length;
    const pct = Math.round((complete / progressIds.length) * 100);
    progressBars.forEach((bar) => { bar.style.width = `${pct}%`; });
    progressTexts.forEach((text) => { text.textContent = `${pct}٪`; });
  }

  try { progressState = JSON.parse(storageGet(progressKey) || '{}'); } catch (_) { progressState = {}; }
  progressBoxes.forEach((box) => {
    box.checked = Boolean(progressState[box.dataset.progressId]);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      progressState[box.dataset.progressId] = box.checked;
      progressBoxes
        .filter((other) => other !== box && other.dataset.progressId === box.dataset.progressId)
        .forEach((other) => { other.checked = box.checked; });
      storageSet(progressKey, JSON.stringify(progressState));
      updateProgress();
    });
  });
  updateProgress();

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
    tocLinks.forEach((link) => link.addEventListener('click', () => sidebar.classList.remove('open')));
  }
  printButton?.addEventListener('click', () => window.print());

  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('fa');
      document.querySelectorAll('.toc-row').forEach((row) => {
        const matches = row.textContent.toLocaleLowerCase('fa').includes(query);
        row.hidden = Boolean(query) && !matches;
      });
    });
  }

  const sections = [...document.querySelectorAll('section.chapter[id]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.01, 0.2, 0.5] });
    sections.forEach((section) => observer.observe(section));
  }

  if (scriptUrl) {
    const sharedNavigation = document.createElement('script');
    sharedNavigation.src = new URL('../../../../assets/js/personal-learning-nav.js', scriptUrl).href;
    sharedNavigation.dataset.currentWeek = 'week-02';
    document.body.appendChild(sharedNavigation);
  }
})();
