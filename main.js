/* Documentation: [[User:SuperGrey/gadgets/QuickEditExt-Citations]] */

/* <nowiki> */
(function (mw) {
  'use strict';

  var QuickEditExtCitations = {
    ids: {
      root: 'qeec-root',
      style: 'qeec-style',
      collapsedBtn: 'qeec-collapsed',
      panel: 'qeec-panel',
      header: 'qeec-header',
      title: 'qeec-title',
      body: 'qeec-body',
      list: 'qeec-list',
      refreshBtn: 'qeec-refresh',
      minimizeBtn: 'qeec-minimize',
      settingsBtn: 'qeec-settings',
      settingsDialog: 'qeec-settings-dialog',
      settingsClose: 'qeec-settings-close',
      searchInput: 'qeec-search',
      searchClear: 'qeec-search-clear',
      resizer: 'qeec-resizer'
    },
    hasFetched: false,

    _minHeightSet: false,

    settingsKey: 'QuickEditExtCitations:settings',

    init: function () {
      if (document.getElementById(this.ids.root)) return;
      // Stop early on disallowed namespaces or content models
      if (!this.isEligiblePage()) return;
      this.injectStyles();
      this.buildUI();
      this.bindEvents();
      this.collapse();
    },

    buildUI: function () {
      var root = document.createElement('div');
      root.id = this.ids.root;
      root.setAttribute('role', 'region');
      root.setAttribute('aria-label', 'QuickEditExtCitations');

      var collapsed = document.createElement('button');
      collapsed.id = this.ids.collapsedBtn;
      collapsed.type = 'button';
      collapsed.className = 'qeec-btn';
      collapsed.setAttribute('aria-expanded', 'false');
      collapsed.setAttribute('title', 'Open QuickEditExt-Citations');
      collapsed.innerHTML = '<span class="qeec-btn-ico" aria-hidden="true">⤢</span><span class="qeec-btn-text">Citations</span>';
      root.appendChild(collapsed);

      var panel = document.createElement('section');
      panel.id = this.ids.panel;
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.setAttribute('aria-labelledby', this.ids.title);

      var header = document.createElement('header');
      header.id = this.ids.header;
      header.innerHTML = '<strong id="' + this.ids.title + '">Named citations on this page</strong><div class="qeec-actions"><button id="' + this.ids.refreshBtn + '" class="qeec-icon-btn" type="button" title="Refresh citations" aria-label="Refresh">↻</button> <button id="' + this.ids.settingsBtn + '" class="qeec-icon-btn" type="button" title="Settings" aria-label="Settings">⚙</button> <button id="' + this.ids.minimizeBtn + '" class="qeec-icon-btn" type="button" title="Minimize (collapse)" aria-label="Minimize">▾</button></div>';
      panel.appendChild(header);

      var resizer = document.createElement('div');
      resizer.className = 'qeec-resizer';
      resizer.setAttribute('title', 'Resize');
      panel.appendChild(resizer);

      var body = document.createElement('div');
      body.id = this.ids.body;
      body.innerHTML = '<div class="qeec-placeholder">Expand to load <code>&lt;ref name=…&gt;...&lt;/ref&gt;</code> entries…</div>';
      panel.appendChild(body);

      // Settings dialog (initially hidden)
      var settings = document.createElement('section');
      settings.id = this.ids.settingsDialog;
      settings.setAttribute('role', 'dialog');
      settings.setAttribute('aria-modal', 'false');
      settings.innerHTML = '' +
        '<button id="' + this.ids.settingsClose + '" class="qeec-close" type="button" aria-label="Close">×</button>' +
        '<h3>Settings</h3>' +
        '<fieldset class="qeec-fieldset">' +
        '  <legend>When you click a citation name, copy as:</legend>' +
        '  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="raw"> Raw name</label></div>' +
        '  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="r"> {{r|…}}</label></div>' +
        '  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="ref"> &lt;ref name="…" /&gt;</label></div>' +
        '</fieldset>' +
        // Added visibility setting:
        '<fieldset class="qeec-fieldset">' +
        '  <legend>Visibility</legend>' +
        '  <div class="qeec-row"><label><input type="checkbox" name="qeec-show-user-ns" value="1"> Show in User namespace</label></div>' +
        '</fieldset>';
      panel.appendChild(settings);

      root.appendChild(panel);
      document.body.appendChild(root);
    },

    injectStyles: function () {
      if (document.getElementById(this.ids.style)) return;
      var css = `
#${this.ids.root} {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 99999;
  font: 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Helvetica,Arial,"Noto Sans",sans-serif;
  color: #202122;
}
#${this.ids.root} * { box-sizing: border-box; }

#${this.ids.collapsedBtn} {
  display: inline-flex;
  align-items: center;
  gap: .45em;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #a2a9b1;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  cursor: pointer;
  transition: transform .08s ease;
}
#${this.ids.collapsedBtn}:hover { transform: translateY(-1px); }
#${this.ids.collapsedBtn} .qeec-btn-ico { font-size: 12px; }

#${this.ids.panel} {
  width: 360px;
  height: 260px;
  min-width: 360px;
  min-height: 260px;
  resize: none;
  position: relative;
  border: 1px solid #a2a9b1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.08);
  overflow: hidden;
}

#${this.ids.panel} .qeec-resizer { position: absolute; top: 0; right: 0; width: 14px; height: 14px; cursor: nesw-resize; }

#${this.ids.header} { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #eaecf0; background: #f8f9fa; }
#${this.ids.header} strong { font-weight: 600; }

#${this.ids.settingsDialog} { position: absolute; right: 10px; top: 44px; width: 260px; border: 1px solid #a2a9b1; background: #fff; box-shadow: 0 12px 24px rgba(0,0,0,.15); border-radius: 8px; padding: 10px; display: none; z-index: 2; }
#${this.ids.settingsDialog}.is-open { display: block; }
#${this.ids.settingsDialog} h3 { margin: 0 0 8px; font-size: 13px; }
#${this.ids.settingsDialog} .qeec-row { display: flex; gap: 8px; align-items: center; margin: 4px 0; font-size: 13px; }
#${this.ids.settingsDialog} .qeec-close { position: absolute; top: 6px; right: 6px; border: 1px solid #a2a9b1; border-radius: 6px; background: #fff; cursor: pointer; padding: 0 6px; width: 24px; height: 24px; }
#${this.ids.settingsDialog} fieldset { border: 0; margin: 8px 0 0 0; padding: 0; }
#${this.ids.settingsDialog} legend { font-weight: 600; padding-left: 0; padding-bottom: 2px; font-size: 12px; }
@media (prefers-color-scheme: dark) {
  #${this.ids.settingsDialog} { background: #222; border-color: #444; box-shadow: 0 12px 24px rgba(0,0,0,.45); }
  #${this.ids.settingsDialog} .qeec-close { background: #222; border-color: #444; }
}

.qeec-actions { display: flex; align-items: center; gap: 6px; }
.qeec-icon-btn { border: 1px solid #a2a9b1; background: #fff; padding: 2px 6px; border-radius: 6px; cursor: pointer; width: 24px; height: 24px; }

#${this.ids.body} {
  padding: 6px 10px;
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  word-wrap: anywhere;
}
#${this.ids.body} .qeec-topbar {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding: 2px 4px;
  border: 1px solid #a2a9b1;
  border-radius: 6px;
  background: #fff;
  height: 24px;
}
#${this.ids.body} .qeec-topbar:focus-within {
  box-shadow: 0 0 0 2px rgba(51,102,204,.15);
}
#${this.ids.body} .qeec-topbar input[type="search"] {
  flex: 1 1 auto;
  padding: 5px 6px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
}
#${this.ids.body} .qeec-topbar button {
  border: none;
  background: transparent;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
}
#${this.ids.list} mark {
  background: #ffea79;
  padding: 0 1px;
}

#${this.ids.body} .qeec-main { display: flex; height: calc(100% - 24px); gap: 8px; }
#${this.ids.body} .qeec-index { flex: 0 0 22px; display: flex; flex-direction: column; align-items: center; gap: 2px; border-right: 1px solid #eaecf0; padding-right: 6px; user-select: none; }
#${this.ids.body} .qeec-index button { background: none; border: none; padding: 0; font-size: 11px; line-height: 1; cursor: pointer; color: #202122; }
#${this.ids.body} .qeec-index button.qeec-disabled { opacity: .35; pointer-events: none; cursor: default; }
#${this.ids.body} .qeec-listwrap { flex: 1 1 auto; overflow: auto; }
#${this.ids.body} .qeec-badge { margin-right: 6px; font-size: 10px; padding: 1px 4px; border-radius: 4px; background: #36c; color: #fff; animation: qeec-pop .9s ease; }
@keyframes qeec-pop { 0% { opacity: 0; transform: translateY(-2px); } 20% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; } }
#${this.ids.body} .qeec-placeholder { font-size: 13px; color: #54595d; }

#${this.ids.list} { list-style: none; margin: 0; padding: 0; }
#${this.ids.list} li { margin: 6px 0; line-height: 0.8em; scroll-margin-top: 6px; }
#${this.ids.list} .qeec-name { font-weight: 700; font-size: 0.9em; margin-right: 0.5em; cursor: pointer; }
#${this.ids.list} .qeec-name:hover { text-decoration: underline; }
#${this.ids.list} .qeec-content { font-size: 0.75em; color: #3a3a3a; }

#${this.ids.panel} { display: none; }
#${this.ids.root}.is-expanded #${this.ids.panel} { display: block; }
#${this.ids.root}.is-expanded #${this.ids.collapsedBtn} { display: none; }

@media print { #${this.ids.root} { display: none !important; } }
@media (prefers-color-scheme: dark) {
  #${this.ids.root} { color: #e6e6e6; }
  #${this.ids.collapsedBtn}, #${this.ids.panel}, .qeec-icon-btn { background: #222; border-color: #444; }
  #${this.ids.header} { background: #1c1c1c; border-bottom-color: #333; }
  #${this.ids.body} .qeec-placeholder { color: #bbb; }
  #${this.ids.list} .qeec-content { color: #c7c7c7; }
  #${this.ids.body} .qeec-topbar { background: #1e1e1e; border-color: #444; }
}
      `.trim();
      var style = document.createElement('style');
      style.id = this.ids.style;
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    },

    bindEvents: function () {
      var self = this;
      var collapsed = document.getElementById(this.ids.collapsedBtn);
      var minimize = document.getElementById(this.ids.minimizeBtn);

      if (collapsed) {
        collapsed.addEventListener('click', function () { self.expand(); });
        collapsed.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.expand(); } });
      }
      if (minimize) { minimize.addEventListener('click', function () { self.collapse(); }); }

      var refresh = document.getElementById(this.ids.refreshBtn);
      if (refresh) { refresh.addEventListener('click', function () { self.refresh(); }); }

      var settingsBtn = document.getElementById(this.ids.settingsBtn);
      if (settingsBtn) { settingsBtn.addEventListener('click', function(){ self.toggleSettings(); }); }

      var settingsDlg = document.getElementById(this.ids.settingsDialog);
      if (settingsDlg) {
        settingsDlg.addEventListener('change', function(e){
          if (e.target && e.target.name === 'qeec-copyformat') { self.setCopyFormat(e.target.value); }
          else if (e.target && e.target.name === 'qeec-show-user-ns') { self.setShowInUserNs(!!e.target.checked); }
        });
        var closeBtn = document.getElementById(this.ids.settingsClose);
        if (closeBtn) closeBtn.addEventListener('click', function(){ self.closeSettings(); });
      }

      var refresh = document.getElementById(this.ids.refreshBtn);
      if (refresh) {
        refresh.addEventListener('click', function () {
          self.refresh();
        });
      }

      // Top-right custom resizer
      var resizerEl = document.querySelector('#' + this.ids.panel + ' .qeec-resizer');
      if (resizerEl) {
        var panelEl = document.getElementById(this.ids.panel);
        var dragging = null;
        function onMove(e){
          if (!dragging) return;
          var minW = 360;
          var minH = parseFloat(getComputedStyle(panelEl).minHeight) || 260;
          var dx = e.clientX - dragging.startX;
          var dy = dragging.startY - e.clientY; // upward drag increases height
          var newW = Math.max(minW, dragging.startW + dx);
          var newH = Math.max(minH, dragging.startH + dy);
          panelEl.style.width = newW + 'px';
          panelEl.style.height = newH + 'px';
        }
        function onUp(){
          dragging = null;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
        }
        resizerEl.addEventListener('mousedown', function(e){
          e.preventDefault();
          dragging = { startX: e.clientX, startY: e.clientY, startW: panelEl.offsetWidth, startH: panelEl.offsetHeight };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.body.style.cursor = 'nesw-resize';
        });
      }
    },

    expand: function () {
      var root = document.getElementById(this.ids.root);
      if (!root) return;
      root.classList.add('is-expanded');
      var collapsedBtn = document.getElementById(this.ids.collapsedBtn);
      if (collapsedBtn) collapsedBtn.setAttribute('aria-expanded', 'true');
      if (!this.hasFetched) { this.hasFetched = true; this.loadRefsForCurrentPage(); }
    },

    collapse: function () {
      var root = document.getElementById(this.ids.root);
      if (!root) return;
      root.classList.remove('is-expanded');
      var collapsedBtn = document.getElementById(this.ids.collapsedBtn);
      if (collapsedBtn) collapsedBtn.setAttribute('aria-expanded', 'false');
    },

    refresh: function () {
      var btn = document.getElementById(this.ids.refreshBtn);
      if (btn) btn.setAttribute('aria-busy', 'true');
      this.renderMessage('Refreshing…');
      var self = this;
      this.loadRefsForCurrentPage().finally ?
        this.loadRefsForCurrentPage().finally(function(){ if (btn) btn.removeAttribute('aria-busy'); }) :
        this.loadRefsForCurrentPage().then(function(){ if (btn) btn.removeAttribute('aria-busy'); }, function(){ if (btn) btn.removeAttribute('aria-busy'); });
    },

    loadRefsForCurrentPage: function () {
      var title = mw.config && mw.config.get('wgPageName');
      var self = this;
      if (!title) { this.renderMessage('Cannot determine page title.'); return Promise.resolve(); }
      var api = new mw.Api();
      return api.get({
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        formatversion: 2,
        titles: title
      }).then(function (data) {
        try {
          var pages = (data && data.query && data.query.pages) || [];
          if (!pages.length || !pages[0].revisions || !pages[0].revisions.length) {
            self.renderMessage('No wikitext found for this page.');
            return;
          }
          var content = pages[0].revisions[0].slots.main.content || '';
          var refs = self.extractNamedRefs(content);
          self.renderRefList(refs);
        } catch (err) {
          self.renderMessage('Failed to parse API response.');
        }
      }).catch(function (err) {
        self.renderMessage('API error: ' + (err && err.error && err.error.info || err && err.toString() || 'Unknown'));
      });
    },

    extractNamedRefs: function (wikitext) {
      var map = Object.create(null);

      // Sanitize: remove HTML comments and <nowiki> regions before parsing
      var text = String(wikitext || '');
      // Remove HTML comments
      text = text.replace(/<!--[\s\S]*?-->/g, '');
      // Remove <nowiki>...</nowiki> blocks (case-insensitive)
      text = text.replace(/<nowiki\b[^>]*>[\s\S]*?<\/nowiki>/gi, '');
      text = text.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '');
      text = text.replace(/<syntaxhighlight\b[^>]*>[\s\S]*?<\/syntaxhighlight>/gi, '');
      // Remove self-closing <nowiki/> variants
      text = text.replace(/<nowiki\b[^>]*\/\s*>/gi, '');

      // 1) Strip self-closing named refs to avoid them being treated as open tags
      //    Example: <ref name=\"foo\" /> should NOT pair with a later </ref>
      var withoutSelfClosing = text.replace(/<ref\b[^>]*\bname\s*=\s*(?:\"[^\"]+\"|'[^']+'|[^\s\/>]+)[^>]*\/\s*>/gi, '');

      // 2) Capture ONLY full refs: <ref name=...> ... </ref>
      //    Supports double-quoted, single-quoted, and unquoted names.
      var fullRefRE = /<ref\b[^>]*\bname\s*=\s*(?:\"([^\"]+)\"|'([^']+)'|([^\s\/>]+))[^>]*>([\s\S]*?)<\/ref>/gi;
      var m;
      while ((m = fullRefRE.exec(withoutSelfClosing)) !== null) {
        var name = m[1] || m[2] || m[3] || '';
        var content = m[4] || '';
        if (!map[name]) map[name] = content.trim();
      }

      var arr = [];
      Object.keys(map).forEach(function (k) { arr.push({ name: k, content: map[k] }); });
      arr.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
      return arr;
    },

    linkifyContent: function (text) {
      var frag = document.createDocumentFragment();
      if (!text) { frag.appendChild(document.createTextNode('')); return frag; }
      // Match from http/https until whitespace OR '|' OR '}}' (but allow single '}')
      var re = /(https?:\/\/[^\s]*?)(?=\s|\||}}|$)/g;
      var lastIndex = 0; var m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > lastIndex) {
          var plain = text.slice(lastIndex, m.index);
          var span = document.createElement('span');
          span.innerHTML = this.highlightHTML(plain, this._query || '');
          frag.appendChild(span);
        }
        var url = m[1];
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'nofollow noopener';
        a.innerHTML = this.highlightHTML(url, this._query || '');
        frag.appendChild(a);
        lastIndex = re.lastIndex;
      }
      if (lastIndex < text.length) {
        var rest = text.slice(lastIndex);
        var span2 = document.createElement('span');
        span2.innerHTML = this.highlightHTML(rest, this._query || '');
        frag.appendChild(span2);
      }
      return frag;
    },

    // Filtering & highlight helpers
    applyFilter: function (q) {
      this._query = String(q || '');
      var rows = this._rows || [];
      var query = this._query.toLowerCase();
      // Clear existing anchors
      rows.forEach(function(r){ if (r.li.id && r.li.id.indexOf('qeec-anchor-') === 0) r.li.removeAttribute('id'); });
      var self = this;
      var firstByBucket = Object.create(null);
      rows.forEach(function(r){
        var name = r.name || '';
        var content = r.content || '';
        var matched = !query || name.toLowerCase().indexOf(query) !== -1 || content.toLowerCase().indexOf(query) !== -1;
        if (matched) {
          r.li.style.display = '';
          // Update highlights
          if (self._query) { r.nameEl.innerHTML = self.highlightHTML(name, self._query); }
          else { r.nameEl.textContent = name; }
          r.contentEl.innerHTML = '';
          r.contentEl.appendChild(self.linkifyContent(content || '(empty)', self._query));
          var bucket = self.groupKey(name);
          if (!firstByBucket[bucket]) { firstByBucket[bucket] = r.li; r.li.id = 'qeec-anchor-' + bucket; }
        } else {
          r.li.style.display = 'none';
        }
      });
      this.rebuildIndex(firstByBucket);
    },
    rebuildIndex: function (firstByBucket) {
      var indexCol = this._indexCol, scroll = this._scrollEl, self = this;
      if (!indexCol || !scroll) return;
      indexCol.innerHTML = '';
      this.alphabet().forEach(function (lab) {
        var btn = document.createElement('button');
        btn.textContent = lab;
        if (!firstByBucket[lab]) {
          btn.className = 'qeec-disabled';
        } else {
          btn.addEventListener('click', function(){
            var target = firstByBucket[lab];
            if (!target) return;
            target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
          });
        }
        indexCol.appendChild(btn);
      });
    },
    regexEscape: function (s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); },
    escapeHTML: function (s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    },
    highlightHTML: function (s, q) {
      s = this.escapeHTML(String(s || ''));
      q = String(q || '');
      if (!q) return s;
      var re = new RegExp(this.regexEscape(q), 'gi');
      return s.replace(re, function(m){ return '<mark>' + m + '</mark>'; });
    },

    copyToClipboard: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function(){ try { document.execCommand('copy'); } catch (e) {} });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        ta.remove();
      }
    },

    // Settings helpers
    getSettings: function () {
      var def = { copyFormat: 'raw', showInUserNs: true };
      try {
        var s = JSON.parse(localStorage.getItem(this.settingsKey) || 'null');
        if (!s || typeof s !== 'object') return def;
        if (typeof s.copyFormat !== 'string') s.copyFormat = 'raw';
        if (typeof s.showInUserNs !== 'boolean') s.showInUserNs = true;
        return s;
      } catch (e) { return def; }
    },
    saveSettings: function (s) {
      try { localStorage.setItem(this.settingsKey, JSON.stringify(s)); } catch (e) {}
    },
    setCopyFormat: function (fmt) {
      var s = this.getSettings();
      s.copyFormat = fmt;
      this.saveSettings(s);
    },
    // New setter for user namespace visibility
    setShowInUserNs: function (flag) {
      var s = this.getSettings();
      s.showInUserNs = !!flag;
      this.saveSettings(s);
    },
    applySettingsUI: function () {
      var s = this.getSettings();
      var dlg = document.getElementById(this.ids.settingsDialog);
      if (!dlg) return;
      var opts = dlg.querySelectorAll('input[name="qeec-copyformat"]');
      for (var i=0;i<opts.length;i++) { opts[i].checked = (opts[i].value === s.copyFormat); }
      var chk = dlg.querySelector('input[name="qeec-show-user-ns"]');
      if (chk) chk.checked = !!s.showInUserNs;
    },
    toggleSettings: function(){
      var dlg = document.getElementById(this.ids.settingsDialog);
      if (!dlg) return;
      var open = dlg.classList.toggle('is-open');
      if (open) this.applySettingsUI();
    },
    closeSettings: function(){
      var dlg = document.getElementById(this.ids.settingsDialog);
      if (dlg) dlg.classList.remove('is-open');
    },
    copyFromName: function (name) {
      var s = this.getSettings();
      var fmt = (s && s.copyFormat) || 'raw';
      if (fmt === 'r') return '{{r|' + name + '}}';
      if (fmt === 'ref') {
        return '<ref name="' + this.encodeAttr(name) + '" />';
      }
      return String(name);
    },
    encodeAttr: function (val) {
      return String(val).replace(/&/g, '&amp;').replace(/\"/g, '&quot;');
    },

    // Alphabet helpers for sorting and index
    alphabet: function () {
      if (!this._alpha) {
        this._alpha = ['#'].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).concat(['*']);
      }
      return this._alpha;
    },
    alphaIndex: function (bucket) {
      if (!this._alphaIndex) {
        this._alphaIndex = Object.create(null);
        var arr = this.alphabet();
        for (var i = 0; i < arr.length; i++) this._alphaIndex[arr[i]] = i;
      }
      return this._alphaIndex[bucket] != null ? this._alphaIndex[bucket] : this._alphaIndex['*'];
    },
    groupKey: function (name) {
      name = (name || '').trim();
      if (!name) return '*';
      var c = name.charAt(0);
      if (/[0-9]/.test(c)) return '#';
      if (/[A-Za-z]/.test(c)) return c.toUpperCase();
      return '*';
    },

    isEligiblePage: function () {
      // Allow only Main (0), User (2), and Draft (if present on this wiki)
      var ns = mw.config && mw.config.get('wgNamespaceNumber');
      var nsIds = (mw.config && mw.config.get('wgNamespaceIds')) || {};
      var allowed = (ns === 0) || (ns === 2) || (typeof nsIds.draft === 'number' && ns === nsIds.draft);
      if (!allowed) return false;
      // Respect user setting for User namespace
      if (ns === 2) {
        var s = this.getSettings();
        if (!s.showInUserNs) return false;
      }
      // Check content model without an API call if available
      var cm = mw.config && mw.config.get('wgPageContentModel');
      if (cm && cm !== 'wikitext') return false;
      return true;
    },

    renderMessage: function (text) {
      var body = document.getElementById(this.ids.body);
      if (!body) return;
      body.innerHTML = '<div class="qeec-placeholder"></div>';
      body.querySelector('.qeec-placeholder').textContent = text;
    },

    renderRefList: function (items) {
      var body = document.getElementById(this.ids.body);
      if (!body) return;
      if (!items || !items.length) { this.renderMessage('No named <ref> tags found on this page.'); return; }

      var self = this;

      // Sort with custom order: #, A-Z, * (ignore case)
      items.sort(function(a,b){
        var ga = self.groupKey(a.name), gb = self.groupKey(b.name);
        if (ga !== gb) return self.alphaIndex(ga) - self.alphaIndex(gb);
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
      });

      // Reset body and draw search bar
      body.innerHTML = '';
      var topbar = document.createElement('div');
      topbar.className = 'qeec-topbar';
      topbar.innerHTML =
        '<input id="' + this.ids.searchInput + '" type="search" placeholder="Search citations…" aria-label="Search citations">' +
        '<button id="' + this.ids.searchClear + '" type="button" title="Clear">✕</button>';
      body.appendChild(topbar);

      // Build structure: index + scrollable list
      var wrap = document.createElement('div');
      wrap.className = 'qeec-main';

      var indexCol = document.createElement('div');
      indexCol.className = 'qeec-index';

      var scroll = document.createElement('div');
      scroll.className = 'qeec-listwrap';

      var ul = document.createElement('ul');
      ul.id = this.ids.list;

      // Map first appearance per bucket & rows cache
      var firstByBucket = Object.create(null);
      var rows = [];

      items.forEach(function (it) {
        var li = document.createElement('li');

        var nameEl = document.createElement('span');
        nameEl.className = 'qeec-name';
        nameEl.textContent = it.name;
        nameEl.addEventListener('click', function () {
          var text = self.copyFromName(it.name); self.copyToClipboard(text);
          var existing = li.querySelector('.qeec-badge');
          if (existing) existing.remove();
          var badge = document.createElement('span');
          badge.className = 'qeec-badge';
          badge.textContent = 'Copied!';
          nameEl.insertAdjacentElement('afterend', badge);
          setTimeout(function(){ badge.remove(); }, 900);
        });

        var contentEl = document.createElement('span');
        contentEl.className = 'qeec-content';
        var frag = self.linkifyContent(it.content || '(empty)', self._query || '');
        contentEl.textContent = '';
        contentEl.appendChild(frag);

        li.appendChild(nameEl);
        li.appendChild(contentEl);
        ul.appendChild(li);

        rows.push({ li: li, name: it.name, content: it.content || '', nameEl: nameEl, contentEl: contentEl });

        var bucket = self.groupKey(it.name);
        if (!firstByBucket[bucket]) {
          firstByBucket[bucket] = li;
          li.id = 'qeec-anchor-' + bucket;
        }
      });

      scroll.appendChild(ul);
      wrap.appendChild(indexCol);
      wrap.appendChild(scroll);
      body.appendChild(wrap);

      this._rows = rows;
      this._indexCol = indexCol;
      this._scrollEl = scroll;

      // Build index
      this.rebuildIndex(firstByBucket);

      // Wire search
      var input = document.getElementById(this.ids.searchInput);
      var clear = document.getElementById(this.ids.searchClear);
      if (input) { input.addEventListener('input', function(){ self.applyFilter(input.value); }); }
      if (clear) { clear.addEventListener('click', function(){ input.value=''; self.applyFilter(''); input.focus(); }); }

      // Set min-height only once; index is always # A–Z *
      if (!this._minHeightSet) { this.recalcMinHeight(); }
    },

    recalcMinHeight: function () {
      var body = document.getElementById(this.ids.body);
      var panelEl = document.getElementById(this.ids.panel);
      if (!panelEl || !body) return;
      var headerEl = document.getElementById(this.ids.header);
      var indexColEl = body.querySelector('.qeec-index');
      var topbarEl = body.querySelector('.qeec-topbar');
      var bodyStyles = getComputedStyle(body);
      var padY = (parseInt(bodyStyles.paddingTop, 10) || 0) + (parseInt(bodyStyles.paddingBottom, 10) || 0);
      var topbarH = topbarEl ? topbarEl.offsetHeight : 0;
      var topbarMB = topbarEl ? (parseInt(getComputedStyle(topbarEl).marginBottom, 10) || 0) : 0;
      var needed = (headerEl ? headerEl.offsetHeight : 0) + padY + topbarH + topbarMB + (indexColEl ? indexColEl.scrollHeight : 0) + 12;
      var minH = Math.max(260, needed);
      panelEl.style.minHeight = minH + 'px';
      if (panelEl.offsetHeight < minH) { panelEl.style.height = minH + 'px'; }
      this._minHeightSet = true;
    }
  };

  window.QuickEditExtCitations = QuickEditExtCitations;

  if (mw && mw.hook) { mw.hook('wikipage.content').add(function () { QuickEditExtCitations.init(); }); }
  else { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { QuickEditExtCitations.init(); }); } else { QuickEditExtCitations.init(); } }

})(window.mediaWiki || {});
/* </nowiki> */
