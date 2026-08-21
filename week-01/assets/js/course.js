(() => {
  const root = document.documentElement;
  const storageGet = (key) => {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  };
  const storageSet = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch (_) { /* storage is optional */ }
  };
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('[data-action="menu"]');
  const themeButtons = document.querySelectorAll('[data-action="theme"]');
  const printButtons = document.querySelectorAll('[data-action="print"]');
  const search = document.querySelector('#toc-search');
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const progressBoxes = [...document.querySelectorAll('[data-progress-id]')];
  const progressBar = document.querySelector('.progress-bar');
  const progressText = document.querySelector('[data-progress-text]');

  const storedTheme = storageGet('agentic-ai-theme');
  if (storedTheme) root.dataset.theme = storedTheme;

  themeButtons.forEach((button) => button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    storageSet('agentic-ai-theme', next);
  }));

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
  let progressState = {};
  try { progressState = JSON.parse(storageGet(progressKey) || '{}'); } catch (_) { progressState = {}; }

  function updateProgress() {
    const complete = progressBoxes.filter((box) => box.checked).length;
    const total = progressBoxes.length || 1;
    const pct = Math.round((complete / total) * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${pct}٪`;
  }

  progressBoxes.forEach((box) => {
    box.checked = Boolean(progressState[box.dataset.progressId]);
    box.addEventListener('change', () => {
      progressState[box.dataset.progressId] = box.checked;
      storageSet(progressKey, JSON.stringify(progressState));
      updateProgress();
    });
  });
  updateProgress();

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
