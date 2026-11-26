// PDF reader on pdf.js with a selectable text layer. Slide = one page per screen (swipe),
// Scroll = pages stacked vertically. Positions are "pdf:<page>"; highlights are
// "pdf:<page>:<start>:<end>" (character offsets within that page's text layer).
(function () {
  const rw = window.rw;
  const pdfjsLib = window.pdfjsLib;
  let pdf = null;
  let mode = 'slide';
  let pages = []; // { num, el, textEl, hlEl, rendered, nodes, w, h }
  let current = 1;
  let highlights = []; // { id, color, page, start, end }
  let root;
  let noTextChecked = false;

  const workerSrc = document.getElementById('pdf-worker').textContent;
  pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })), { type: 'module' });

  function parseHl(loc) {
    const m = /^pdf:(\d+):(\d+):(\d+)$/.exec(loc || '');
    return m ? { page: Number(m[1]), start: Number(m[2]), end: Number(m[3]) } : null;
  }

  function layoutCss() {
    const css = document.getElementById('mode-css') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'mode-css' }));
    css.textContent =
      mode === 'slide'
        ? `#root{position:fixed;inset:0;overflow:hidden;display:flex;transition:transform 220ms cubic-bezier(.3,.7,.3,1)}
           .page-wrap{flex:0 0 100vw;height:100vh;display:flex;align-items:center;justify-content:center}`
        : `#root{position:fixed;inset:0;overflow-y:auto;padding:var(--pad-top) 0 var(--pad-bottom)}
           .page-wrap{display:flex;justify-content:center;margin:0 0 12px}`;
  }

  async function build() {
    document.body.innerHTML = '';
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    layoutCss();
    const first = await pdf.getPage(1);
    const vp1 = first.getViewport({ scale: 1 });
    const availW = window.innerWidth - (mode === 'slide' ? 16 : 20);
    const availH = window.innerHeight - 90;
    pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const wrap = document.createElement('div');
      wrap.className = 'page-wrap';
      const el = document.createElement('div');
      el.className = 'page';
      // Assume every page has page 1's aspect until rendered (good enough for layout).
      const scale = mode === 'slide' ? Math.min(availW / vp1.width, availH / vp1.height) : availW / vp1.width;
      el.style.cssText = `position:relative;width:${vp1.width * scale}px;height:${vp1.height * scale}px;background:#fff;box-shadow:0 2px 10px rgba(20,36,52,.18)`;
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      const hlEl = document.createElement('div');
      hlEl.className = 'hl-layer';
      hlEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2';
      const textEl = document.createElement('div');
      textEl.className = 'textLayer';
      el.append(canvas, hlEl, textEl);
      wrap.appendChild(el);
      root.appendChild(wrap);
      pages.push({ num: n, el, canvas, textEl, hlEl, rendered: false, nodes: [], scale });
    }
    observe();
  }

  let io = null;
  function observe() {
    if (io) io.disconnect();
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const p = pages.find((x) => x.el === e.target);
          if (e.isIntersecting && p && !p.rendered) renderPage(p);
        }
      },
      { root: mode === 'scroll' ? root : null, rootMargin: '800px 800px' },
    );
    pages.forEach((p) => io.observe(p.el));
  }

  async function renderPage(p) {
    p.rendered = true;
    const page = await pdf.getPage(p.num);
    const base = page.getViewport({ scale: 1 });
    const cssW = parseFloat(p.el.style.width);
    const scale = cssW / base.width;
    const vp = page.getViewport({ scale });
    p.el.style.height = vp.height + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    p.canvas.width = Math.floor(vp.width * dpr);
    p.canvas.height = Math.floor(vp.height * dpr);
    const ctx = p.canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
    p.el.style.setProperty('--scale-factor', String(scale));
    p.el.style.setProperty('--total-scale-factor', String(scale));
    const content = await page.getTextContent();
    if (!noTextChecked && p.num <= 3) {
      const hasText = content.items.some((i) => i.str && i.str.trim());
      if (!hasText && p.num === Math.min(3, pdf.numPages)) {
        noTextChecked = true;
        rw.post('noTextLayer');
      } else if (hasText) noTextChecked = true;
    }
    const tl = new pdfjsLib.TextLayer({ textContentSource: content, container: p.textEl, viewport: vp });
    await tl.render();
    p.nodes = rw.textNodes(p.textEl);
    drawHighlights(p);
  }

  function drawHighlights(p) {
    p.hlEl.innerHTML = '';
    if (!p.nodes.length) return;
    const base = p.el.getBoundingClientRect();
    for (const h of highlights) {
      if (h.page !== p.num) continue;
      const r = rw.rangeFor(p.nodes, h.start, h.end);
      if (!r) continue;
      for (const c of r.getClientRects()) {
        if (c.width < 1) continue;
        const d = document.createElement('div');
        d.className = 'rw-hl';
        d.dataset.id = h.id;
        d.style.cssText = `left:${c.left - base.left}px;top:${c.top - base.top}px;width:${c.width}px;height:${c.height}px;background:${rw.fill(h.color, false)}`;
        p.hlEl.appendChild(d);
      }
    }
  }

  function highlightAt(x, y) {
    for (const p of pages) {
      for (const d of p.hlEl.children) {
        const r = d.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { id: d.dataset.id, rect: rw.rectOf(r) };
      }
    }
    return null;
  }

  function currentFromScroll() {
    const mid = window.innerHeight / 3;
    for (const p of pages) {
      const r = p.el.getBoundingClientRect();
      if (r.bottom > mid) return p.num;
    }
    return pages.length;
  }

  function report() {
    rw.post('location', {
      location: 'pdf:' + current,
      percent: pdf.numPages <= 1 ? 100 : ((current - 1) / (pdf.numPages - 1)) * 100,
      page: current,
      total: pdf.numPages,
      chapter: null,
    });
  }

  function goToPage(n, smooth) {
    current = Math.max(1, Math.min(pdf.numPages, n));
    if (mode === 'slide') {
      root.style.transition = smooth ? '' : 'none';
      root.style.transform = `translateX(${-(current - 1) * 100}vw)`;
      const p = pages[current - 1];
      if (p && !p.rendered) renderPage(p);
      const nx = pages[current];
      if (nx && !nx.rendered) renderPage(nx);
    } else {
      pages[current - 1].el.scrollIntoView({ block: 'start' });
    }
    rw.activity();
    report();
  }

  rw.handlers.init = async (msg) => {
    rw.applySettings(Object.assign({}, msg.settings, { theme: (msg.settings && msg.settings.theme) === 'dark' ? 'dark' : 'light' }));
    mode = msg.mode || 'slide';
    highlights = (msg.highlights || []).map((h) => Object.assign({ id: h.id, color: h.color }, parseHl(h.location))).filter((h) => h.page);
    const buf = await rw.loadFile(msg.fileUrl);
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
    await build();
    const m = /^pdf:(\d+)/.exec(msg.location || '');
    goToPage(m ? Number(m[1]) : 1, false);
    rw.post('loaded', { total: pdf.numPages, hasText: true });
  };

  rw.handlers.setMode = async (msg) => {
    mode = msg.mode;
    const at = current;
    await build();
    goToPage(at, false);
  };
  rw.handlers.settings = (msg) => {
    rw.applySettings(msg.settings);
  };
  rw.handlers.goTo = (msg) => {
    const m = /^pdf:(\d+)/.exec(msg.location || '');
    if (m) goToPage(Number(m[1]), false);
  };
  rw.handlers.goToPercent = (msg) => goToPage(Math.round((msg.percent / 100) * (pdf.numPages - 1)) + 1, false);
  rw.handlers.next = () => mode === 'slide' && goToPage(current + 1, true);
  rw.handlers.prev = () => mode === 'slide' && goToPage(current - 1, true);
  rw.handlers.setHighlights = (msg) => {
    highlights = (msg.highlights || []).map((h) => Object.assign({ id: h.id, color: h.color }, parseHl(h.location))).filter((h) => h.page);
    pages.forEach((p) => p.rendered && drawHighlights(p));
  };

  rw.watchSelection((range) => {
    const pageEl = (range.startContainer.parentElement || range.startContainer).closest('.page');
    const p = pages.find((x) => x.el === pageEl);
    if (!p || !p.nodes.length) return null;
    const start = rw.offsetOf(p.nodes, range.startContainer, range.startOffset);
    let end = p.el.contains(range.endContainer) ? rw.offsetOf(p.nodes, range.endContainer, range.endOffset) : p.nodes[p.nodes.length - 1].start + p.nodes[p.nodes.length - 1].node.nodeValue.length;
    if (start < 0 || end <= start) return null;
    const r = rw.rangeFor(p.nodes, start, end);
    return {
      text: (r ? r.toString() : range.toString()).replace(/\s+/g, ' ').trim(),
      location: `pdf:${p.num}:${start}:${end}`,
      rect: rw.rectOf(range.getBoundingClientRect()),
      page: p.num,
      chapter: null,
    };
  });

  document.addEventListener('DOMContentLoaded', () => {
    rw.installGestures(document, {
      slide: () => mode === 'slide',
      onNext: () => goToPage(current + 1, true),
      onPrev: () => goToPage(current - 1, true),
      onTap: (x, y) => {
        const h = highlightAt(x, y);
        if (h) rw.post('highlightTap', h);
        return !!h;
      },
    });
  });
  let t = null;
  document.addEventListener(
    'scroll',
    () => {
      if (mode !== 'scroll') return;
      rw.activity();
      clearTimeout(t);
      t = setTimeout(() => {
        const n = currentFromScroll();
        if (n !== current) {
          current = n;
          report();
        }
      }, 200);
    },
    { capture: true, passive: true },
  );

  rw.post('ready');
})();
