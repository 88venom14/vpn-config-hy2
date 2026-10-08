/* Hysteria2 / Mihomo Config — renders README.md from the repository.
   The page pulls the file at runtime, so the docs never drift from the source. */

(() => {
  'use strict';

  const REPO_OWNER = '88venom14';
  const REPO_NAME = 'vpn-config-hy2';
  const REPO_BRANCH = 'main';
  const REPO_FILE = 'README.md';

  const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${REPO_FILE}`;
  const BLOB_BASE = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${REPO_BRANCH}/`;
  const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
  const API_COMMITS = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${REPO_FILE}&sha=${REPO_BRANCH}&per_page=1`;

  const contentEl = document.getElementById('readme-content');
  const updatedEl = document.getElementById('readme-updated');
  const toast = document.querySelector('.toast');
  let toastTimer;

  /* ------------------------------------------------------------------ toast */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }

    clearTimeout(toastTimer);
    if (toast) {
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
    }
  }

  /* ------------------------------------------------------------- markdown */

  function slugify(text) {
    return String(text)
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function renderMarkdown(md) {
    const html = marked.parse(md, { gfm: true, breaks: false });
    // README is untrusted input; sanitize before it reaches the DOM.
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'id', 'align'] });
  }

  /* --------------------------------------------------------- decoration */

  function decorate(root) {
    const usedIds = Object.create(null);

    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const base = slugify(heading.textContent) || 'section';
      let id = base;
      let n = 2;
      while (usedIds[id]) id = `${base}-${n++}`;
      usedIds[id] = true;
      heading.id = id;
    });

    root.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer nofollow');
        return;
      }

      // relative path -> absolute GitHub URL
      a.setAttribute('href', BLOB_BASE + href.replace(/^\.?\//, ''));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer nofollow');
    });

    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains('table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // Group adjacent badge paragraphs. marked collapses consecutive badge
    // lines into a single <p>, so a paragraph is the unit here.
    const nodes = Array.prototype.slice.call(root.childNodes);
    let run = [];

    const flushRun = () => {
      if (run.length === 0) return;
      const row = document.createElement('div');
      row.className = 'badge-row';
      // Insert while run[0] still has its parent; moving nodes first would
      // detach it and make the reference invalid.
      const anchor = run[0];
      const parent = anchor.parentNode;
      parent.insertBefore(row, anchor);

      run.forEach((node) => {
        if (node.tagName === 'P') {
          while (node.firstChild) row.appendChild(node.firstChild);
          parent.removeChild(node);
        } else {
          row.appendChild(node);
        }
      });
      run = [];
    };

    nodes.forEach((node) => {
      const isBadge = node.nodeType === 1 &&
        node.tagName === 'P' &&
        !node.textContent.trim() &&
        node.querySelectorAll('img').length > 0 &&
        Array.prototype.every.call(node.children, (c) => c.tagName === 'A' && c.querySelector('img'));

      if (isBadge) run.push(node);
      else flushRun();
    });
    flushRun();

    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Скопировать код');

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        await copyText(code.innerText);
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1600);
      });

      pre.appendChild(btn);
    });

    if (window.hljs) {
      root.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
    }
  }

  /* ---------------------------------------------------------------- meta */

  function relativeTime(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;

    const diff = Math.floor((Date.now() - then) / 1000);
    const units = [
      ['минуту', 60],
      ['час', 3600],
      ['день', 86400],
      ['неделю', 604800],
      ['месяц', 2592000],
    ];

    for (const [word, secs] of units) {
      const val = Math.floor(diff / secs);
      if (val >= 1) return `${val} ${word} назад`;
    }
    return 'только что';
  }

  function loadMeta() {
    fetch(API_COMMITS, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (!data || !data.length || !updatedEl) return;
        const rel = relativeTime(data[0].commit.committer.date);
        if (rel) updatedEl.textContent = `обновлён: ${rel}`;
      })
      .catch(() => {});
  }

  /* -------------------------------------------------------------- errors */

  function showError(err) {
    contentEl.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'readme-error';

    const h = document.createElement('h3');
    h.textContent = 'Не удалось загрузить README';

    const p1 = document.createElement('p');
    p1.append('Источник: ');
    const code = document.createElement('code');
    code.textContent = RAW_URL;
    p1.appendChild(code);

    const p2 = document.createElement('p');
    p2.textContent = `Причина: ${err && err.message ? err.message : 'неизвестная ошибка'}`;

    const p3 = document.createElement('p');
    const link = document.createElement('a');
    link.href = REPO_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Открыть репозиторий на GitHub →';
    p3.appendChild(link);

    box.append(h, p1, p2, p3);
    contentEl.appendChild(box);
  }

  /* ---------------------------------------------------- static copy buttons */

  function wireStaticCopy() {
    document.querySelectorAll('.copy-btn[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copy || '';
        if (!text) return;
        const original = button.textContent;
        await copyText(text);
        button.textContent = 'Готово';
        setTimeout(() => { button.textContent = original; }, 1000);
      });
    });
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    wireStaticCopy();

    fetch(RAW_URL, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((md) => {
        contentEl.innerHTML = renderMarkdown(md);
        decorate(contentEl);
        loadMeta();
      })
      .catch(showError);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();