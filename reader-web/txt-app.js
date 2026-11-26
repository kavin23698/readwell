// TXT reader. Slide: CSS columns, one screen per page, swipe to turn. Scroll: one long page.
// Positions and highlights are character offsets into the original text ("txt:<offset>",
// "txt:<start>:<end>"), so they survive font-size and mode changes.
(function () {
  const rw = window.rw;
  const CHARS_PER_PAGE = 1500; // stable "page" for stats, independent of font size
  let text = '';
  let mode = 'slide';
  let nodes = [];
  let page = 0;
  let highlights = []; // { id, color, start, end }
  let scroller, content, layer;

  function build() {
    document.body.innerHTML = '';
    scroller = document.createElement('div');
    scroller.id = 'scroller';
    content = document.createElement('div');
    content.id = 'content';
    layer = document.createElement('div');
    layer.id = 'hl-layer';
    content.appendChild(layer);
    // Paragraphs: blank lines split paragraphs; single newlines become spaces.
    const paras = text.split(/\n\s*\n/);
    let pos = 0;
    for (const raw of paras) {
      const start = text.indexOf(raw, pos);
      pos = start + raw.length;
      const p = document.createElement('p');
      p.textContent = raw.replace(/\n/g, ' '); // same length, so offsets still match
      p.dataset.start = String(start);
      content.appendChild(p);
    }
    scroller.appendChild(content);
    document.body.appendChild(scroller);
    applyMode();
    nodes = [];
    for (const p of content.querySelectorAll('p')) {
      const base = Number(p.dataset.start);
      const tn = p.firstChild;
      if (tn) nodes.push({ node: tn, start: base });
    }
  }

  function applyMode() {
    const slide = mode === 'slide';
    const css = document.getElementById('mode-css') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'mode-css' }));
    css.textContent = slide
      ? `#scroller{position:fixed;inset:0;overflow:hidden}
         #content{position:relative;height:calc(100vh - var(--pad-top) - var(--pad-bottom));margin:var(--pad-top) 0 0;padding:0 var(--pad-x);
           column-width:calc(100vw - 2*var(--pad-x));column-gap:calc(2*var(--pad-x));column-fill:auto;box-sizing:content-box}
         p{margin:0 0 14px;font-size:var(--font-size);line-height:var(--line-height);text-wrap:pretty}`
      : `#scroller{position:fixed;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
         #content{position:relative;padding:var(--pad-top) var(--pad-x) var(--pad-bottom)}
         p{margin:0 0 14px;font-size:var(--font-size);line-height:var(--line-height);text-wrap:pretty}`;
  }

  const pageWidth = () => window.innerWidth;
  const pageCount = () => Math.max(1, Math.round(content.scrollWidth / pageWidth()));

  function goToPage(i, smooth) {
    page = Math.max(0, Math.min(pageCount() - 1, i));
    content.style.transition = smooth ? 'transform 220ms cubic-bezier(.3,.7,.3,1)' : 'none';
    content.style.transform = `translateX(${-page * pageWidth()}px)`;
    rw.activity();
    setTimeout(report, smooth ? 240 : 0);
  }

  /** Character offset of the first visible text. */
  function visibleOffset() {
    const x = mode === 'slide' ? 30 : 30;
    const y = mode === 'slide' ? 60 : 60;
    const pos = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : null;
    const r = !pos && document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    const node = pos ? pos.offsetNode : r && r.startContainer;
    const off = pos ? pos.offset : r ? r.startOffset : 0;
    const o = node ? rw.offsetOf(nodes, node, off) : -1;
    if (o >= 0) return o;
    // Fallback: proportional position.
    if (mode === 'slide') return Math.floor((page / pageCount()) * text.length);
    return Math.floor((scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight)) * text.length);
  }

  function report() {
    const offset = Math.max(0, visibleOffset());
    rw.post('location', {
      location: 'txt:' + offset,
      percent: text.length ? Math.min(100, (offset / text.length) * 100) : 0,
      page: Math.floor(offset / CHARS_PER_PAGE) + 1,
      total: Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE)),
      chapter: null,
    });
  }

  function goToOffset(offset) {
    const r = rw.rangeFor(nodes, offset, offset + 1);
    if (!r) return;
    const rect = r.getBoundingClientRect();
    if (mode === 'slide') {
      const abs = rect.left + page * pageWidth();
      goToPage(Math.floor(abs / pageWidth()), false);
    } else {
      scroller.scrollTop += rect.top - 60;
      report();
    }
  }

  // ---------------------------------------------------------------- highlights (overlays)
  function drawHighlights() {
    layer.innerHTML = '';
    const base = content.getBoundingClientRect();
    const dark = rw.settings && rw.settings.theme === 'dark';
    for (const h of highlights) {
      const r = rw.rangeFor(nodes, h.start, h.end);
      if (!r) continue;
      for (const c of r.getClientRects()) {
        if (c.width < 1) continue;
        const d = document.createElement('div');
        d.className = 'rw-hl';
        d.dataset.id = h.id;
        d.style.cssText = `left:${c.left - base.left}px;top:${c.top - base.top - 1}px;width:${c.width}px;height:${c.height + 2}px;background:${rw.fill(h.color, dark)}`;
        layer.appendChild(d);
      }
    }
  }

  function highlightAt(x, y) {
    for (const d of layer.children) {
      const r = d.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return { id: d.dataset.id, rect: rw.rectOf(r) };
      }
    }
    return null;
  }

  function parseLoc(loc) {
    const m = /^txt:(\d+):(\d+)$/.exec(loc || '');
    return m ? { start: Number(m[1]), end: Number(m[2]) } : null;
  }

  // ---------------------------------------------------------------- commands
  rw.handlers.init = async (msg) => {
    rw.applySettings(msg.settings);
    document.body.classList.toggle('dark', rw.settings.theme === 'dark');
    mode = msg.mode || 'slide';
    const buf = await rw.loadFile(msg.fileUrl);
    let decoded = new TextDecoder('utf-8').decode(buf);
    if (decoded.includes('�') && decoded.split('�').length > 20) {
      // Not UTF-8: fall back to Windows-1252-ish byte mapping.
      const bytes = new Uint8Array(buf);
      decoded = '';
      for (let i = 0; i < bytes.length; i += 8192) decoded += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    text = decoded.replace(/\r\n?/g, '\n');
    highlights = (msg.highlights || []).map((h) => Object.assign({ id: h.id, color: h.color }, parseLoc(h.location))).filter((h) => h.start != null);
    build();
    await document.fonts.ready;
    const m = /^txt:(\d+)/.exec(msg.location || '');
    if (m) goToOffset(Number(m[1]));
    else if (mode === 'slide') goToPage(0, false);
    drawHighlights();
    report();
    rw.post('loaded', { total: Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE)), hasText: true });
  };

  rw.handlers.setMode = (msg) => {
    const offset = visibleOffset();
    mode = msg.mode;
    content.style.transform = '';
    page = 0;
    applyMode();
    requestAnimationFrame(() => {
      goToOffset(offset);
      drawHighlights();
    });
  };

  rw.handlers.settings = (msg) => {
    const offset = visibleOffset();
    rw.applySettings(msg.settings);
    document.body.classList.toggle('dark', rw.settings.theme === 'dark');
    requestAnimationFrame(() => {
      goToOffset(offset);
      drawHighlights();
    });
  };

  rw.handlers.goTo = (msg) => {
    const h = parseLoc(msg.location);
    const m = /^txt:(\d+)/.exec(msg.location || '');
    if (h) goToOffset(h.start);
    else if (m) goToOffset(Number(m[1]));
  };
  rw.handlers.goToPercent = (msg) => goToOffset(Math.floor((msg.percent / 100) * text.length));
  rw.handlers.next = () => mode === 'slide' && goToPage(page + 1, true);
  rw.handlers.prev = () => mode === 'slide' && goToPage(page - 1, true);

  rw.handlers.setHighlights = (msg) => {
    highlights = (msg.highlights || []).map((h) => Object.assign({ id: h.id, color: h.color }, parseLoc(h.location))).filter((h) => h.start != null);
    drawHighlights();
  };

  // ---------------------------------------------------------------- selection + gestures
  rw.watchSelection((range) => {
    const start = rw.offsetOf(nodes, range.startContainer, range.startOffset);
    const end = rw.offsetOf(nodes, range.endContainer, range.endOffset);
    if (start < 0 || end <= start) return null;
    return {
      text: text.slice(start, end),
      location: 'txt:' + start + ':' + end,
      rect: rw.rectOf(range.getBoundingClientRect()),
      page: Math.floor(start / CHARS_PER_PAGE) + 1,
      chapter: null,
    };
  });

  document.addEventListener('DOMContentLoaded', () => {
    rw.installGestures(document, {
      slide: () => mode === 'slide',
      onNext: () => goToPage(page + 1, true),
      onPrev: () => goToPage(page - 1, true),
      onTap: (x, y) => {
        const h = highlightAt(x, y);
        if (h) rw.post('highlightTap', h);
        return !!h;
      },
    });
  });
  let scrollTimer = null;
  document.addEventListener(
    'scroll',
    () => {
      if (mode !== 'scroll') return;
      rw.activity();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(report, 250);
    },
    { capture: true, passive: true },
  );
  window.addEventListener('resize', () => requestAnimationFrame(drawHighlights));

  rw.post('ready');
})();
