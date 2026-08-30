(() => {
  const script = document.currentScript;
  const currentWeek = script?.dataset.currentWeek;
  if (!currentWeek || document.querySelector('[data-personal-learning-nav]')) return;

  const rootUrl = new URL('../../', script.src);
  const toUrl = (path) => new URL(path, rootUrl).href;
  const weekOne = [
    ['week-01/personal/index.html', 'فهرست هفتهٔ اول'],
    ['week-01/personal/chapters/00-orientation.html', '۰. چرا کلاس دور به نظر رسید؟'],
    ['week-01/personal/chapters/01-roadmap.html', '۱. نقشهٔ هفتهٔ اول'],
    ['week-01/personal/chapters/02-programming-api-bridge.html', '۲. پل ورود: برنامه‌نویسی و API'],
    ['week-01/personal/chapters/03-llm-mental-model.html', '۳. مدل ذهنی درست از LLM'],
    ['week-01/personal/chapters/04-llm-capabilities.html', '۴. توانایی‌های LLM'],
    ['week-01/personal/chapters/05-llm-limitations.html', '۵. محدودیت‌ها و Failure Modeها'],
    ['week-01/personal/chapters/06-model-ecosystem.html', '۶. اکوسیستم مدل‌ها'],
    ['week-01/personal/chapters/07-tokens-context.html', '۷. Token و Context Window'],
    ['week-01/personal/chapters/08-cost-latency.html', '۸. Cost و تأخیر'],
    ['week-01/personal/chapters/09-python-api-refresher.html', '۹. مرور Python برای API'],
    ['week-01/personal/chapters/10-environment-api.html', '۱۰. Environment و API'],
    ['week-01/personal/chapters/11-error-handling.html', '۱۱. Error Handling و Retry'],
    ['week-01/personal/chapters/12-observability-evaluation.html', '۱۲. Observability و Evaluation'],
    ['week-01/personal/chapters/13-incident-brief-project.html', '۱۳. مینی‌پروژه'],
    ['week-01/personal/chapters/14-exercises.html', '۱۴. تمرین‌ها و پاسخ‌ها'],
    ['week-01/personal/chapters/15-study-plan.html', '۱۵. برنامهٔ مطالعه'],
    ['week-01/personal/chapters/16-glossary.html', '۱۶. واژه‌نامه'],
    ['week-01/personal/chapters/17-video-workflow.html', '۱۷. تحلیل ویدئو'],
    ['week-01/personal/chapters/18-sources.html', '۱۸. منابع و حدود جزوه'],
  ];
  const weekTwo = [
    ['week-02/study-guide/index.html', 'فهرست هفتهٔ دوم'],
    ['week-02/study-guide/index.html#orientation', '۰. این هفته چه می‌آموزی؟'],
    ['week-02/study-guide/index.html#prompt-mental-model', '۱. Prompt دقیقاً چیست؟'],
    ['week-02/study-guide/index.html#prompt-fundamentals', '۲. اجزای Prompt خوب'],
    ['week-02/study-guide/index.html#system-role', '۳. System prompt و role design'],
    ['week-02/study-guide/index.html#context-engineering', '۴. Context engineering'],
    ['week-02/study-guide/index.html#structured-output', '۵. Structured output و JSON Schema'],
    ['week-02/study-guide/index.html#function-calling', '۶. Function calling'],
    ['week-02/study-guide/index.html#tool-schema', '۷. Tool schema'],
    ['week-02/study-guide/index.html#workflow', '۸. Workflow design'],
    ['week-02/study-guide/index.html#safety', '۹. ایمنی و Prompt injection'],
    ['week-02/study-guide/index.html#evaluation', '۱۰. ارزیابی و اشکال‌زدایی'],
    ['week-02/study-guide/index.html#practice-map', '۱۱. نقشهٔ ورود به تمرین'],
    ['week-02/study-guide/index.html#glossary', '۱۲. واژه‌نامه'],
  ];
  const weeks = [
    { id: 'week-01', label: 'هفتهٔ اول', count: '۱۹ فصل', links: weekOne },
    { id: 'week-02', label: 'هفتهٔ دوم', count: '۱۳ فصل', links: weekTwo },
  ];

  const sidebar = document.querySelector('.sidebar');
  const currentToc = sidebar?.querySelector('.toc');
  if (!sidebar || !currentToc) return;

  const currentUrl = window.location.href;
  const isActive = (href) => href === currentUrl || (href.includes('#') && href.split('#')[0] === currentUrl.split('#')[0] && href.endsWith(window.location.hash));
  const createLinks = (links) => links.map(([path, label]) => {
    const href = toUrl(path);
    return `<a href="${href}"${isActive(href) ? ' class="active" aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  const navigation = document.createElement('nav');
  navigation.className = 'personal-learning-nav';
  navigation.dataset.personalLearningNav = '';
  navigation.setAttribute('aria-label', 'مسیر شخصی همهٔ هفته‌ها');
  navigation.innerHTML = `
    <a class="personal-learning-home" href="${toUrl('personal/index.html')}">مسیر شخصی یکپارچه</a>
    ${weeks.map((week) => `
      <details class="personal-week-group${week.id === currentWeek ? ' is-current' : ''}"${week.id === currentWeek ? ' open' : ''}>
        <summary><span>${week.label}</span><small>${week.count}</small></summary>
        <div class="personal-week-links">${createLinks(week.links)}</div>
      </details>`).join('')}`;
  currentToc.replaceWith(navigation);
  sidebar.querySelector('.search-box')?.remove();

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = toUrl('assets/css/personal-learning-nav.css');
  document.head.appendChild(stylesheet);
})();
