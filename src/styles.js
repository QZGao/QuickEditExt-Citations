import {ids} from "./ui.js";

export function injectStyles() {
    if (document.getElementById(ids.style)) return;
    const css = `
#${ids.root} {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 99999;
  font: 14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Helvetica,Arial,"Noto Sans",sans-serif;
  color: #202122;
}
#${ids.root} * { box-sizing: border-box; }

sup[id^="cite_ref-"] .qeec-ref-tag-copy-btn { display: none; }
sup[id^="cite_ref-"]:hover .qeec-ref-tag-copy-btn { display: inline-block; }

/* New floating popup for citation copy action */
.qeec-ref-popup {
  position: absolute;
  z-index: 100000;
  display: none;
  /* default to light appearance */
  background: #ffffff;
  color: #111827;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 6px 12px rgba(16,24,40,0.08);
  pointer-events: auto;
  border: 1px solid #e5e7eb; /* light border */
  transition: opacity .12s ease, transform .12s ease;
  transform-origin: top left;
  opacity: 0;
}
.qeec-ref-popup.is-open { display: block; opacity: 1; transform: translateY(0); }
.qeec-ref-popup a.qeec-ref-popup-copy {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  display: inline-block;
}
.qeec-ref-popup a.qeec-ref-popup-copy:active { opacity: 0.8; }

/* Explicit night mode via skin class */
.skin-theme-clientpref-night .qeec-ref-popup { 
  background: #111827; 
  color: #ffffff; 
  border-color: #374151; 
  box-shadow: 0 6px 12px rgba(0,0,0,0.6); 
}
.skin-theme-clientpref-night .qeec-ref-popup a.qeec-ref-popup-copy { color: inherit; }

/* Follow system preference (skin-theme-clientpref-os) */
@media screen and (prefers-color-scheme: dark) {
  .skin-theme-clientpref-os .qeec-ref-popup { 
    background: #111827; 
    color: #ffffff; 
    border-color: #374151; 
    box-shadow: 0 6px 12px rgba(0,0,0,0.6); 
  }
  .skin-theme-clientpref-os .qeec-ref-popup a.qeec-ref-popup-copy { color: inherit; }
}

.qeec-badge { font-size: 10px; padding: 1px 4px; border-radius: 4px; background: #36c; color: #fff !important; animation: qeec-pop .9s ease; }
.qeec-badge:hover { color: #fff; text-decoration: none; }
.qeec-badge:visited { color: #fff; }
@keyframes qeec-pop { 0% { opacity: 0; transform: translateY(-2px); } 20% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; } }

#${ids.collapsedBtn} {
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
#${ids.collapsedBtn}:hover { transform: translateY(-1px); }
#${ids.collapsedBtn} .qeec-btn-ico { font-size: 12px; }

#${ids.panel} {
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

#${ids.panel} .qeec-resizer { position: absolute; top: 0; right: 0; width: 14px; height: 14px; cursor: nesw-resize; }

#${ids.header} { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #eaecf0; background: #f8f9fa; }
#${ids.header} strong { font-weight: 600; }

#${ids.settingsDialog} { position: absolute; right: 10px; top: 44px; width: 260px; border: 1px solid #a2a9b1; background: #fff; box-shadow: 0 12px 24px rgba(0,0,0,.15); border-radius: 8px; padding: 10px; display: none; z-index: 2; }
#${ids.settingsDialog}.is-open { display: block; }
#${ids.settingsDialog} h3 { margin: 0 0 8px; font-size: 13px; }
#${ids.settingsDialog} .qeec-row { display: flex; gap: 8px; align-items: center; margin: 4px 0; font-size: 13px; }
#${ids.settingsDialog} .qeec-close { position: absolute; top: 6px; right: 6px; border: 1px solid #a2a9b1; border-radius: 6px; background: #fff; cursor: pointer; padding: 0 6px; width: 24px; height: 24px; }
#${ids.settingsDialog} fieldset { border: 0; margin: 8px 0 0 0; padding: 0; }
#${ids.settingsDialog} legend { font-weight: 600; padding-left: 0; padding-bottom: 2px; font-size: 12px; }

/* Explicit night mode via skin class */
.skin-theme-clientpref-night #${ids.settingsDialog} { background: #222; border-color: #444; box-shadow: 0 12px 24px rgba(0,0,0,.45); }
.skin-theme-clientpref-night #${ids.settingsDialog} .qeec-close { background: #222; border-color: #444; }

/* Follow system preference (skin-theme-clientpref-os) */
@media screen and (prefers-color-scheme: dark) {
  .skin-theme-clientpref-os #${ids.settingsDialog} { background: #222; border-color: #444; box-shadow: 0 12px 24px rgba(0,0,0,.45); }
  .skin-theme-clientpref-os #${ids.settingsDialog} .qeec-close { background: #222; border-color: #444; }
}

.qeec-actions { display: flex; align-items: center; gap: 6px; }
.qeec-icon-btn { border: 1px solid #a2a9b1; background: #fff; padding: 2px 6px; border-radius: 6px; cursor: pointer; width: 24px; height: 24px; }

#${ids.body} {
  padding: 6px 10px;
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  word-wrap: anywhere;
}
#${ids.body} .qeec-topbar {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding: 2px 4px;
  border: 1px solid #a2a9b1;
  border-radius: 6px;
  background: #fff;
  height: 24px;
}
#${ids.body} .qeec-topbar:focus-within {
  box-shadow: 0 0 0 2px rgba(51,102,204,.15);
}
#${ids.body} .qeec-topbar input[type="search"] {
  flex: 1 1 auto;
  padding: 5px 6px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
}
#${ids.body} .qeec-topbar button {
  border: none;
  background: transparent;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
}
#${ids.list} mark {
  background: #ffea79;
  padding: 0 1px;
}

#${ids.body} .qeec-main { display: flex; height: calc(100% - 24px); gap: 8px; }
#${ids.body} .qeec-index { flex: 0 0 22px; display: flex; flex-direction: column; align-items: center; gap: 2px; border-right: 1px solid #eaecf0; padding-right: 6px; user-select: none; }
#${ids.body} .qeec-index button { background: none; border: none; padding: 0; font-size: 11px; line-height: 1; cursor: pointer; color: #202122; }
#${ids.body} .qeec-index button.qeec-disabled { opacity: .35; pointer-events: none; cursor: default; }
#${ids.body} .qeec-listwrap { flex: 1 1 auto; overflow: auto; }
#${ids.body} .qeec-placeholder { font-size: 13px; color: #54595d; }

#${ids.list} { list-style: none; margin: 0; padding: 0; }
#${ids.list} li { margin: 6px 0; line-height: 0.8em; scroll-margin-top: 6px; }
#${ids.list} .qeec-name { font-weight: 700; font-size: 0.9em; margin-right: 0.5em; cursor: pointer; }
#${ids.list} .qeec-name:hover { text-decoration: underline; }
#${ids.list} .qeec-content { font-size: 0.75em; color: #3a3a3a; }

#${ids.panel} { display: none; }
#${ids.root}.is-expanded #${ids.panel} { display: block; }
#${ids.root}.is-expanded #${ids.collapsedBtn} { display: none; }

@media print { #${ids.root} { display: none !important; } }

/* Explicit night mode via skin class */
.skin-theme-clientpref-night #${ids.root} { color: #e6e6e6; }
.skin-theme-clientpref-night #${ids.collapsedBtn}, 
.skin-theme-clientpref-night #${ids.panel}, 
.skin-theme-clientpref-night .qeec-icon-btn { background: #222; border-color: #444; }
.skin-theme-clientpref-night #${ids.header} { background: #1c1c1c; border-bottom-color: #333; }
.skin-theme-clientpref-night #${ids.body} .qeec-placeholder { color: #bbb; }
.skin-theme-clientpref-night #${ids.list} .qeec-content { color: #c7c7c7; }
.skin-theme-clientpref-night #${ids.body} .qeec-topbar { background: #1e1e1e; border-color: #444; }

/* Follow system preference (skin-theme-clientpref-os) */
@media screen and (prefers-color-scheme: dark) {
  .skin-theme-clientpref-os #${ids.root} { color: #e6e6e6; }
  .skin-theme-clientpref-os #${ids.collapsedBtn}, 
  .skin-theme-clientpref-os #${ids.panel}, 
  .skin-theme-clientpref-os .qeec-icon-btn { background: #222; border-color: #444; }
  .skin-theme-clientpref-os #${ids.header} { background: #1c1c1c; border-bottom-color: #333; }
  .skin-theme-clientpref-os #${ids.body} .qeec-placeholder { color: #bbb; }
  .skin-theme-clientpref-os #${ids.list} .qeec-content { color: #c7c7c7; }
  .skin-theme-clientpref-os #${ids.body} .qeec-topbar { background: #1e1e1e; border-color: #444; }
}
      `.trim();
    const style = document.createElement('style');
    style.id = ids.style;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}
