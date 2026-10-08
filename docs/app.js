/* Hysteria2 / Mihomo Config — renders README.md from the repository.
   Content is fetched at runtime, so the page never drifts from the source. */

(function () {
  'use strict';

  var REPO_OWNER = '88venom14';
  var REPO_NAME = 'vpn-config-hy2';
  var REPO_BRANCH = 'main';
  var REPO_FILE = 'README.md';

  var RAW_URL =
    'https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/' + REPO_BRANCH + '/' + REPO_FILE;
  var BLOB_BASE =
    'https://github.com/' + REPO_OWNER + '/' + REPO_NAME + '/blob/' + REPO_BRANCH + '/';
  var REPO_URL = 'https://github.com/' + REPO_OWNER + '/' + REPO_NAME;
  var API_COMMITS =
    'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/commits?path=' + REPO_FILE + '&sha=' + REPO_BRANCH + '&per_page=1';

  var contentEl = document.getElementById('content');
  var tocEl = document.getElementById('toc');

  /* ------------------------------------------------------------- theme */

  var THEME_KEY = 'hy2-theme';
  var root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }

    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    document.getElementById('theme-toggle').addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ------------------------------------------------------------ marked */

  function slugify(text) {
    return String(text)
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function renderMarkdown(md) {
    // README level-1 heading duplicates the page <title>; keep it, GitHub does.
    var html = marked.parse(md, { gfm: true, breaks: false });

    html = DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'rel', 'id', 'align']
    });

    return html;
  }

  /* -------------------------------------------------- post-processing */

  function decorate(rootEl) {
    var usedIds = Object.create(null);

    // Unique heading ids so duplicate titles do not collide in the TOC.
    rootEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function (h) {
      var base = slugify(h.textContent) || 'section';
      var id = base;
      var n = 2;
      while (usedIds[id]) { id = base + '-' + n++; }
      usedIds[id] = true;
      h.id = id;
    });

    // Rewrite relative links to absolute GitHub blob URLs.
    rootEl.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;

      if (href.charAt(0) === '#') return;

      if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer nofollow');
        return;
      }

      // relative path -> GitHub
      a.setAttribute('href', BLOB_BASE + href.replace(/^\.?\//, ''));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer nofollow');
    });

    // Wrap tables for horizontal scrolling on narrow screens.
    rootEl.querySelectorAll('table').forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains('table-scroll')) return;
      var wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    // Collect adjacent badge images into one flex row.
    var nodes = Array.prototype.slice.call(rootEl.childNodes);
    var run = [];

    function flushRun() {
      // marked collapses consecutive badge lines into ONE <p>, so a single
      // paragraph already means "badge block" — do not require more than one.
      if (run.length > 0) {
        var row = document.createElement('div');
        row.className = 'badge-row';
        // Insert while run[0] is still a child of its parent; moving the nodes
        // in first would detach run[0] and make this reference invalid.
        var anchor = run[0];
        var parent = anchor.parentNode;
        parent.insertBefore(row, anchor);

        run.forEach(function (node) {
          // Unwrap the <p> that marked emits, so badges are direct flex
          // items and `gap` on .badge-row applies between them.
          if (node.tagName === 'P') {
            while (node.firstChild) row.appendChild(node.firstChild);
            parent.removeChild(node);
          } else {
            row.appendChild(node);
          }
        });
      }
      run = [];
    }

    nodes.forEach(function (node) {
      // Each child element must be a link wrapping a badge image; the
      // paragraph's own text must be empty. marked collapses consecutive
      // badge lines into one <p>, so a paragraph is the unit here.
      var isBadge = node.nodeType === 1 &&
        node.tagName === 'P' &&
        !node.textContent.trim() &&
        node.querySelectorAll('img').length > 0 &&
        Array.prototype.every.call(node.children, function (c) {
          return c.tagName === 'A' && c.querySelector('img');
        });

      if (isBadge) {
        run.push(node);
      } else {
        flushRun();
      }
    });
    flushRun();

    // Copy buttons on code blocks.
    rootEl.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.code-copy')) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Скопировать код');

      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        if (!code) return;
        var text = code.innerText;

        var done = function () {
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1600);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
          document.body.removeChild(ta);
        }
      });

      pre.appendChild(btn);
    });

    // Syntax highlighting.
    if (window.hljs) {
      rootEl.querySelectorAll('pre code').forEach(function (block) {
        hljs.highlightElement(block);
      });
    }
  }

  /* ---------------------------------------------------------------- toc */

  function buildToc() {
    var headings = Array.prototype.slice.call(
      contentEl.querySelectorAll('h2, h3')
    ).filter(function (h) {
      return h.id && !h.closest('.badge-row');
    });

    if (!headings.length) {
      tocEl.innerHTML = '<span style="color:var(--text-faint);font-size:13px">—</span>';
      return;
    }

    var frag = document.createDocumentFragment();

    headings.forEach(function (h) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') a.className = 'level-3';
      frag.appendChild(a);
    });

    tocEl.innerHTML = '';
    tocEl.appendChild(frag);
    observeHeadings(headings);
  }

  function observeHeadings(headings) {
    var links = {};
    tocEl.querySelectorAll('a').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var visible = new Set();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });

      var active = null;
      for (var i = 0; i < headings.length; i++) {
        if (visible.has(headings[i].id)) { active = headings[i].id; break; }
      }
      if (!active && window.scrollY > 80) {
        active = headings[headings.length - 1].id;
      }

      Object.keys(links).forEach(function (id) { links[id].classList.remove('active'); });
      if (active && links[active]) links[active].classList.add('active');
    }, { rootMargin: '-84px 0px -70% 0px', threshold: 0 });

    headings.forEach(function (h) { io.observe(h); });
  }

  /* -------------------------------------------------------------- meta */

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return null;

    var diff = Math.floor((Date.now() - then) / 1000);
    var units = [
      ['year', 31536000],
      ['month', 2592000],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60]
    ];

    for (var i = 0; i < units.length; i++) {
      var val = Math.floor(diff / units[i][1]);
      if (val >= 1) return val + ' ' + units[i][0] + (val > 1 && units[i][0] === 'day' ? '' : '') + ' назад';
    }
    return 'только что';
  }

  function setMeta(iso, sha) {
    var updatedEl = document.getElementById('meta-updated');
    var footerEl = document.getElementById('footer-meta');

    var rel = relativeTime(iso);
    if (!rel) return;

    updatedEl.textContent = rel;
    updatedEl.title = new Date(iso).toUTCString();

    if (sha) {
      footerEl.textContent = 'Последний коммит: ' + sha.slice(0, 7);
    }
  }

  function loadMeta() {
    var fileEl = document.getElementById('meta-file');
    fileEl.href = BLOB_BASE + REPO_FILE;

    fetch(API_COMMITS, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.length) return;
        var c = data[0];
        setMeta(c.commit.committer.date, c.sha);
      })
      .catch(function () {
        document.getElementById('meta-updated').textContent = '—';
      });
  }

  /* ------------------------------------------------------------- errors */

  function showError(err) {
    contentEl.innerHTML = '';

    var box = document.createElement('div');
    box.className = 'error';

    var h = document.createElement('h3');
    h.textContent = 'Не удалось загрузить README';

    var p1 = document.createElement('p');
    p1.textContent = 'Страница подтягивает ' + REPO_FILE + ' из репозитория. Источник:';
    var code = document.createElement('code');
    code.textContent = RAW_URL;
    p1.appendChild(code);

    var p2 = document.createElement('p');
    p2.textContent = 'Причина: ' + (err && err.message ? err.message : 'неизвестная ошибка');

    var link = document.createElement('p');
    var a = document.createElement('a');
    a.href = REPO_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Открыть репозиторий на GitHub →';
    link.appendChild(a);

    box.appendChild(h);
    box.appendChild(p1);
    box.appendChild(p2);
    box.appendChild(link);
    contentEl.appendChild(box);
  }

  /* --------------------------------------------------------------- boot */

  function boot() {
    initTheme();

    fetch(RAW_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (md) {
        contentEl.innerHTML = renderMarkdown(md);
        decorate(contentEl);
        buildToc();
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