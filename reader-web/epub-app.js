// EPUB reader on epub.js. Slide = paginated (swipe), Scroll = continuous vertical scrolling.
// Positions and highlights are EPUB CFIs.
(function () {
  const rw = window.rw;
  let book = null;
  let rendition = null;
  let mode = 'slide';
  let highlights = []; // { id, color, location }
  let locationsReady = false;
  let lastCfi = null;
  let toc = [];

  function themeCss() {
    const s = rw.settings;
    const c = rw.colors;
    return {
      body: {
        background: c.bg + ' !important',
        color: c.fg + ' !important',
        'font-family': "'Nunito', system-ui, sans-serif !important",
        'font-size': s.fontSize + 'px !important',
        'line-height': String(s.lineHeight) + ' !important',
        padding: mode === 'scroll' ? '0 4px !important' : '0 !important',
        '-webkit-tap-highlight-color': 'transparent',
      },
      p: { 'line-height': String(s.lineHeight) + ' !important', 'text-wrap': 'pretty' },
      'a, a *': { color: 'inherit !important' },
      '::selection': { background: 'rgba(62,127,140,0.32)' },
      img: { 'max-width': '100% !important', height: 'auto !important' },
    };
  }

  function chapterOf(href) {
    if (!href) return null;
    const clean = href.split('#')[0];
    let found = null;
    const walk = (items) => {
      for (const it of items) {
        if (it.href && it.href.split('#')[0].endsWith(clean.split('/').pop())) found = found || it.label.trim();
        if (it.subitems && it.subitems.length) walk(it.subitems);
      }
    };
    walk(toc);
    return found;
  }

  function report(loc) {
    if (!loc || !loc.start) return;
    lastCfi = loc.start.cfi;
    const out = { location: lastCfi, chapter: chapterOf(loc.start.href), percent: null, page: null, total: null };
    if (locationsReady && book.locations.length()) {
      const p = book.locations.percentageFromCfi(lastCfi);
      out.percent = Math.min(100, Math.max(0, p * 100));
      out.page = book.locations.locationFromCfi(lastCfi) + 1;
      out.total = book.locations.length();
      if (loc.atEnd) out.percent = 100;
    }
    rw.post('location', out);
  }

  function addHighlight(h) {
    try {
      rendition.annotations.remove(h.location, 'highlight');
    } catch (e) {}
    const dark = rw.settings.theme === 'dark';
    rendition.annotations.highlight(
      h.location,
      { id: h.id },
      (e) => {
        const target = e && e.target && e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
        const frame = document.querySelector('#viewer iframe');
        const fr = frame ? frame.getBoundingClientRect() : { left: 0, top: 0 };
        rw.post('highlightTap', { id: h.id, rect: target ? rw.rectOf(target, 0, 0) : { x: fr.left + 40, y: 200, w: 10, h: 10 } });
      },
      'rw-epub-hl',
      { fill: h.color, 'fill-opacity': dark ? '0.45' : '0.55', 'mix-blend-mode': dark ? 'screen' : 'multiply' },
    );
  }

  async function open(location) {
    if (rendition) rendition.destroy();
    document.getElementById('viewer').innerHTML = '';
    const scroll = mode === 'scroll';
    rendition = book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      flow: scroll ? 'scrolled' : 'paginated',
      manager: scroll ? 'continuous' : 'default',
      spread: 'none',
      allowScriptedContent: false,
      snap: false,
    });
    rendition.themes.default(themeCss());
    rendition.on('relocated', (loc) => {
      report(loc);
      rw.activity();
    });
    rendition.on('selected', (cfiRange, contents) => {
      const range = contents.range(cfiRange);
      const r = range.getBoundingClientRect();
      const frame = contents.document.defaultView.frameElement;
      const fr = frame ? frame.getBoundingClientRect() : { left: 0, top: 0 };
      const loc = rendition.currentLocation();
      rw.post('selection', {
        text: range.toString(),
        location: cfiRange,
        rect: rw.rectOf(r, fr.left, fr.top),
        page: locationsReady ? book.locations.locationFromCfi(cfiRange) + 1 : null,
        chapter: loc && loc.start ? chapterOf(loc.start.href) : null,
      });
    });
    // Gestures inside the chapter iframe.
    rendition.hooks.content.register((contents) => {
      const doc = contents.document;
      if (window.RW_FONT_CSS && doc.head) {
        const st = doc.createElement('style');
        st.textContent = window.RW_FONT_CSS;
        doc.head.appendChild(st);
      }
      let sx = 0, sy = 0, st = 0, moved = false;
      doc.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); moved = false;
      }, { passive: true });
      doc.addEventListener('touchmove', () => { moved = true; }, { passive: true });
      doc.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
        const sel = doc.getSelection();
        if (sel && !sel.isCollapsed) return;
        if (mode === 'slide' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
          dx < 0 ? rendition.next() : rendition.prev();
          return;
        }
        if (moved || dt > 450) return;
        if (e.target && e.target.closest && e.target.closest('a[href]')) return;
        const w = window.innerWidth;
        // clientX inside a paginated iframe is offset by the page; use screenX-ish via modulo.
        const x = ((t.clientX % w) + w) % w;
        if (mode === 'slide' && x < w * 0.25) rendition.prev();
        else if (mode === 'slide' && x > w * 0.75) rendition.next();
        else rw.post('toggleBars');
      }, { passive: true });
      doc.addEventListener('selectionchange', () => {
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed) rw.post('selectionCleared');
      });
      if (mode === 'scroll') doc.addEventListener('scroll', () => rw.activity(), { passive: true });
    });
    if (mode === 'scroll') document.getElementById('viewer').addEventListener('scroll', () => rw.activity(), { passive: true });

    await rendition.display(location || undefined);
    highlights.forEach(addHighlight);
  }

  rw.handlers.init = async (msg) => {
    rw.applySettings(msg.settings);
    document.body.classList.toggle('dark', rw.settings.theme === 'dark');
    mode = msg.mode || 'slide';
    highlights = msg.highlights || [];
    const buf = await rw.loadFile(msg.fileUrl);
    book = ePub(buf);
    await book.ready;
    toc = (book.navigation && book.navigation.toc) || [];
    await open(msg.location);
    document.querySelector('.rw-loading') && document.querySelector('.rw-loading').remove();
    // Locations give "page N of M" and percent; generated once (~1600 chars per location).
    setTimeout(async () => {
      await book.locations.generate(1600);
      locationsReady = true;
      rw.post('loaded', { total: book.locations.length(), hasText: true });
      const loc = rendition.currentLocation();
      if (loc) report(loc);
    }, 50);
  };

  rw.handlers.setMode = async (msg) => {
    mode = msg.mode;
    await open(lastCfi);
  };

  rw.handlers.settings = async (msg) => {
    rw.applySettings(msg.settings);
    document.body.classList.toggle('dark', rw.settings.theme === 'dark');
    await open(lastCfi);
  };

  rw.handlers.goTo = (msg) => rendition && rendition.display(msg.location);
  rw.handlers.goToPercent = (msg) => {
    if (!locationsReady) return;
    const cfi = book.locations.cfiFromPercentage(Math.max(0, Math.min(1, msg.percent / 100)));
    rendition.display(cfi);
  };
  rw.handlers.next = () => rendition && rendition.next();
  rw.handlers.prev = () => rendition && rendition.prev();

  rw.handlers.setHighlights = (msg) => {
    for (const h of highlights) {
      try {
        rendition.annotations.remove(h.location, 'highlight');
      } catch (e) {}
    }
    highlights = msg.highlights || [];
    highlights.forEach(addHighlight);
  };

  rw.handlers.clearSelection = () => {
    const frame = document.querySelector('#viewer iframe');
    if (frame && frame.contentWindow) frame.contentWindow.getSelection().removeAllRanges();
    if (rendition) {
      for (const c of rendition.getContents()) c.window.getSelection().removeAllRanges();
    }
  };

  rw.post('ready');
})();
