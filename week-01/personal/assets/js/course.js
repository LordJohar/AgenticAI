(() => {
  const root = document.documentElement;
  const scriptUrl = document.currentScript?.src;
  const chapters = [
    ['orientation', '00-orientation', 'چرا کلاس دور به نظر رسید؟'],
    ['roadmap', '01-roadmap', 'نقشهٔ هفتهٔ اول'],
    ['bridge', '02-programming-api-bridge', 'پل ورود: برنامه‌نویسی و API'],
    ['mental-model', '03-llm-mental-model', 'مدل ذهنی درست از LLM'],
    ['capabilities', '04-llm-capabilities', 'توانایی‌های LLM'],
    ['limits', '05-llm-limitations', 'محدودیت‌ها و Failure Modeها'],
    ['ecosystem', '06-model-ecosystem', 'اکوسیستم مدل‌ها'],
    ['tokens', '07-tokens-context', 'Token و Context Window'],
    ['cost-latency', '08-cost-latency', 'Cost و Latency'],
    ['python', '09-python-api-refresher', 'مرور Python برای API'],
    ['env-api', '10-environment-api', 'Environment و اولین API Call'],
    ['errors', '11-error-handling', 'Error Handling و Retry'],
    ['observability', '12-observability-evaluation', 'Observability و Evaluation'],
    ['mini-project', '13-incident-brief-project', 'مینی‌پروژه Incident Brief'],
    ['exercises', '14-exercises', 'تمرین‌ها و پاسخ‌ها'],
    ['study-plan', '15-study-plan', 'برنامهٔ جبران هفتهٔ اول'],
    ['glossary', '16-glossary', 'واژه‌نامهٔ هفتهٔ اول'],
    ['video-workflow', '17-video-workflow', 'ساختار تحلیل ویدئوها'],
    ['sources', '18-sources', 'منابع و حدود جزوه'],
  ];
  const progressIds = [
    ...chapters.map(([id]) => id),
    'goal-1', 'goal-2', 'goal-3', 'goal-4', 'goal-5',
    'project-1', 'project-2', 'project-3', 'project-4', 'project-5',
  ];

  function installAppShell() {
    const content = document.querySelector('main.content');
    if (!content || content.closest('.app-shell')) return;

    const pageSections = [...document.querySelectorAll('section.chapter[id]')];
    const isStandalone = pageSections.length > 1;
    const isChapter = pageSections.length === 1;
    const currentChapterId = isChapter ? pageSections[0].id : null;
    const chapterHref = (id, file) => {
      if (isStandalone) return `#${id}`;
      if (isChapter) return `${file}.html`;
      return `chapters/${file}.html`;
    };
    const indexHref = isChapter ? '../index.html' : (isStandalone ? '#main-content' : 'index.html');
    const toc = chapters.map(([id, file, title], index) => (
      `<a href="${chapterHref(id, file)}" data-chapter-id="${id}"${id === currentChapterId ? ' class="active" aria-current="page"' : ''}>${index.toLocaleString('fa-IR')}. ${title}</a>`
    )).join('');

    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.innerHTML = `
      <aside class="sidebar" aria-label="راهنمای مطالعه">
        <a class="brand" href="${indexHref}">
          <span class="brand-mark">AI</span>
          <span><h1>Agentic AI</h1><small>هفتهٔ اول · مسیر شخصی</small></span>
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
        <div class="sidebar-actions">
          <button class="icon-button" type="button" data-action="print">چاپ / PDF</button>
        </div>
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
  const storageGet = (key) => {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  };
  const storageSet = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch (_) { /* storage is optional */ }
  };
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('[data-action="menu"]');
  const printButtons = document.querySelectorAll('[data-action="print"]');
  const search = document.querySelector('#toc-search');
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const progressBoxes = [...document.querySelectorAll('[data-progress-id]')];
  const progressBars = document.querySelectorAll('.progress-bar');
  const progressTexts = document.querySelectorAll('[data-progress-text]');

  printButtons.forEach((button) => button.addEventListener('click', () => window.print()));

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
    tocLinks.forEach((link) => link.addEventListener('click', () => sidebar.classList.remove('open')));
  }

  document.querySelectorAll('pre').forEach((pre) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.textContent = 'کپی';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.textContent = 'کپی شد';
        setTimeout(() => { button.textContent = 'کپی'; }, 1400);
      } catch (_) {
        button.textContent = 'ناموفق';
      }
    });
    wrapper.appendChild(button);
  });

  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('fa');
      tocLinks.forEach((link) => {
        const match = link.textContent.toLocaleLowerCase('fa').includes(query);
        link.classList.toggle('hidden', query.length > 0 && !match);
      });
    });
  }

  const progressKey = 'agentic-ai-week-01-progress-v1';
  let localProgress = {};
  try { localProgress = JSON.parse(storageGet(progressKey) || '{}'); } catch (_) { localProgress = {}; }
  let progressState = {};

  function updateProgress() {
    const complete = progressIds.filter((id) => Boolean(progressState[id])).length;
    const total = progressIds.length;
    const pct = Math.round((complete / total) * 100);
    progressBars.forEach((bar) => { bar.style.width = `${pct}%`; });
    progressTexts.forEach((text) => { text.textContent = `${pct}٪`; });
  }

  async function loadPublicProgress() {
    if (window.AGENTIC_AI_DEFAULT_PROGRESS) return window.AGENTIC_AI_DEFAULT_PROGRESS;
    if (!scriptUrl) return {};
    try {
      const response = await fetch(new URL('../../progress.json', scriptUrl), { cache: 'no-store' });
      if (!response.ok) return {};
      return await response.json();
    } catch (_) {
      return {};
    }
  }

  loadPublicProgress().then((publicProgress) => {
    progressState = { ...publicProgress, ...localProgress };
    progressBoxes.forEach((box) => {
      box.checked = Boolean(progressState[box.dataset.progressId]);
      box.addEventListener('change', () => {
        progressState[box.dataset.progressId] = box.checked;
        storageSet(progressKey, JSON.stringify(progressState));
        updateProgress();
      });
    });
    updateProgress();
  });

  const sections = [...document.querySelectorAll('section.chapter[id]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.01, 0.2, 0.5] });
    sections.forEach((section) => observer.observe(section));
  }
})();
