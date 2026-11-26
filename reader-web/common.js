// Shared WebView-side bridge for the EPUB, PDF and TXT readers.
// RN → page:  window.rw.cmd({ type, ... })        (via injectJavaScript)
// page → RN:  ReactNativeWebView.postMessage(JSON) ({ type, ... })
(function () {
  const rw = (window.rw = {
    handlers: {},
    post(type, data) {
      const msg = JSON.stringify(Object.assign({ type }, data || {}));
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    },
    cmd(msg) {
      try {
        const h = rw.handlers[msg.type];
        if (h) h(msg);
      } catch (e) {
        rw.post('error', { message: String((e && e.message) || e) });
      }
    },
    /** Reads a local file (file://) as an ArrayBuffer. */
    loadFile(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr.response) : reject(new Error('HTTP ' + xhr.status)));
        xhr.onerror = () => reject(new Error('Could not read the book file'));
        xhr.send();
      });
    },
    /** Reader look: theme (light | sepia | dark), font size (px) and line height. */
    applySettings(s) {
      const themes = {
        light: { bg: '#eef3f5', fg: '#1a2a38', muted: '#5e707c' },
        sepia: { bg: '#f4ecd8', fg: '#3b2f22', muted: '#7a6a55' },
        dark: { bg: '#15233a', fg: '#dce6ec', muted: '#a8b8c8' },
      };
      const t = themes[(s && s.theme) || 'light'] || themes.light;
      const root = document.documentElement.style;
      root.setProperty('--bg', t.bg);
      root.setProperty('--fg', t.fg);
      root.setProperty('--muted', t.muted);
      root.setProperty('--font-size', ((s && s.fontSize) || 16.5) + 'px');
      root.setProperty('--line-height', String((s && s.lineHeight) || 1.72));
      if (s && s.padTop != null) root.setProperty('--pad-top', s.padTop + 'px');
      if (s && s.padBottom != null) root.setProperty('--pad-bottom', s.padBottom + 'px');
      rw.settings = Object.assign({ theme: 'light', fontSize: 16.5, lineHeight: 1.72 }, s || {});
      rw.colors = t;
    },
    /** Highlight colour as a translucent fill that reads well on every theme. */
    fill(hex, dark) {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + (dark ? 0.45 : 0.6) + ')';
    },
    rectOf(r, dx, dy) {
      return { x: r.left + (dx || 0), y: r.top + (dy || 0), w: r.width, h: r.height };
    },
  });

  // Report activity (page turns, scrolling) so the reading timer knows someone is reading.
  let lastActivity = 0;
  rw.activity = function () {
    const now = Date.now();
    if (now - lastActivity > 5000) {
      lastActivity = now;
      rw.post('activity');
    }
  };

  window.addEventListener('error', (e) => rw.post('error', { message: e.message || 'Script error' }));
  window.addEventListener('unhandledrejection', (e) => rw.post('error', { message: String((e.reason && e.reason.message) || e.reason) }));

  /**
   * Tap zones and swipes shared by TXT and PDF. `opts.onPrev/onNext` turn pages in Slide mode;
   * a tap in the middle third toggles the reader bars. Long-presses (selection) are ignored.
   */
  rw.installGestures = function (target, opts) {
    let sx = 0, sy = 0, st = 0, moved = false;
    target.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; st = Date.now(); moved = false;
    }, { passive: true });
    target.addEventListener('touchmove', () => { moved = true; }, { passive: true });
    target.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      if (opts.slide() && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
        dx < 0 ? opts.onNext() : opts.onPrev();
        return;
      }
      if (moved || dt > 450) return;
      if (opts.onTap && opts.onTap(t.clientX, t.clientY)) return; // e.g. tapped a highlight
      const w = window.innerWidth;
      if (opts.slide() && t.clientX < w * 0.25) opts.onPrev();
      else if (opts.slide() && t.clientX > w * 0.75) opts.onNext();
      else rw.post('toggleBars');
    }, { passive: true });
  };

  /** Watches the selection and reports it (debounced) with its on-screen rectangle. */
  rw.watchSelection = function (describe) {
    let timer = null, had = false;
    document.addEventListener('selectionchange', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          if (had) rw.post('selectionCleared');
          had = false;
          return;
        }
        const d = describe(sel.getRangeAt(0));
        if (!d || !d.text.trim()) return;
        had = true;
        rw.post('selection', d);
      }, 350);
    });
  };

  rw.handlers.clearSelection = () => {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  };

  /** Character-offset helpers over a container's text nodes (TXT, PDF text layer). */
  rw.textNodes = function (root) {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n, pos = 0;
    while ((n = walker.nextNode())) {
      out.push({ node: n, start: pos });
      pos += n.nodeValue.length;
    }
    return out;
  };
  rw.offsetOf = function (nodes, node, offset) {
    for (const x of nodes) if (x.node === node) return x.start + offset;
    // Selection boundary on an element: use its first text descendant.
    for (const x of nodes) if (node.contains && node.contains(x.node)) return x.start;
    return -1;
  };
  rw.rangeFor = function (nodes, start, end) {
    const range = document.createRange();
    let set = false;
    for (const x of nodes) {
      const len = x.node.nodeValue.length;
      if (!set && start <= x.start + len) {
        range.setStart(x.node, Math.max(0, start - x.start));
        set = true;
      }
      if (set && end <= x.start + len) {
        range.setEnd(x.node, Math.max(0, end - x.start));
        return range;
      }
    }
    if (set && nodes.length) {
      const last = nodes[nodes.length - 1];
      range.setEnd(last.node, last.node.nodeValue.length);
      return range;
    }
    return null;
  };
})();
