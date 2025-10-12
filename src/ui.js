import {_query, applyFilter, loadRefsForCurrentPage, refresh} from "./api.js";
import {alphabet, alphaIndex, encodeAttr, getCommonPrefix, groupKey, linkifyContent} from "./utils.js";
import {bindSettingsEvents, buildSettingsUI, getSettings,} from "./settings.js";
import {injectStyles} from "./styles.js";

export const ids = {
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
}

let _minHeightSet = false;
export let _rows;
let _indexCol;
let _scrollEl;

export function initUI() {
    if (document.getElementById(ids.root)) return;
    injectStyles();
    injectDOMElements();
    buildUI();
    bindEvents();
    collapse();
}

function injectDOMElements() {
    const s = getSettings();
    if (!s.showCiteRefCopyBtn) return;

    const permalink = `Special:Permalink/${mw.config.get('wgRevisionId')}`;

    const supElements = document.querySelectorAll('sup[id^="cite_ref-"]');
    supElements.forEach(sup => {
        const supLink = sup.querySelector('a[href^="#cite_note-"]');
        if (!supLink) return;
        let linkText = supLink.textContent.replace(/^\[|\]$/g, ''); // Remove surrounding brackets
        let citeNoteStr = supLink.getAttribute('href').substring(11); // Remove '#cite_note-' prefix
        let citeRefStr = sup.id.substring(9); // Remove 'cite_ref-' prefix
        if (citeNoteStr !== citeRefStr) {
            // e.g. "Smith2020-1" vs "Smith2020_1-0"
            const linkTextCommon = getCommonPrefix(citeNoteStr, citeRefStr);
            citeNoteStr = citeNoteStr.substring(linkTextCommon.length + 1); // +1 to remove the underscore/hyphen
            citeRefStr = citeRefStr.substring(linkTextCommon.length + 1); // +1 to remove the hyphen
            if (citeNoteStr !== citeRefStr) {
                // e.g. "1" vs "1-0"
                const linkTextCommon2 = getCommonPrefix(citeNoteStr, citeRefStr);
                citeRefStr = citeRefStr.substring(linkTextCommon2.length + 1); // +1 to remove the hyphen
                if (citeRefStr) {
                    linkText = linkText + '.' + citeRefStr;
                }
            }
        }

        const copyBtn = document.createElement('a');
        copyBtn.className = 'qeec-ref-tag-copy-btn qeec-badge';
        copyBtn.href = '#';
        copyBtn.title = 'Copy citation permalink';
        copyBtn.setAttribute('aria-label', 'Copy citation permalink');
        copyBtn.textContent = 'Copy permalink';
        copyBtn.style.marginRight = '2px';
        // On click, copy the permalink to clipboard
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const fullLink = `[[${permalink}#${sup.id}|#${linkText}]]`;
            copyToClipboard(fullLink);
            // Provide visual feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1000);
        });
        // Append the button to the sup element
        sup.appendChild(copyBtn);
    });
}

function buildUI() {
    const root = document.createElement('div');
    root.id = ids.root;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'QuickEditExtCitations');

    const collapsed = document.createElement('button');
    collapsed.id = ids.collapsedBtn;
    collapsed.type = 'button';
    collapsed.className = 'qeec-btn';
    collapsed.setAttribute('aria-expanded', 'false');
    collapsed.setAttribute('title', 'Open QuickEditExt-Citations');
    collapsed.innerHTML = '<span class="qeec-btn-ico" aria-hidden="true">⤢</span><span class="qeec-btn-text">Citations</span>';
    root.appendChild(collapsed);

    const panel = document.createElement('section');
    panel.id = ids.panel;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', ids.title);

    const header = document.createElement('header');
    header.id = ids.header;
    header.innerHTML = '<strong id="' + ids.title + '">Named citations on this page</strong><div class="qeec-actions"><button id="' + ids.refreshBtn + '" class="qeec-icon-btn" type="button" title="Refresh citations" aria-label="Refresh">↻</button> <button id="' + ids.settingsBtn + '" class="qeec-icon-btn" type="button" title="Settings" aria-label="Settings">⚙</button> <button id="' + ids.minimizeBtn + '" class="qeec-icon-btn" type="button" title="Minimize (collapse)" aria-label="Minimize">▾</button></div>';
    panel.appendChild(header);

    const resizer = document.createElement('div');
    resizer.className = 'qeec-resizer';
    resizer.setAttribute('title', 'Resize');
    panel.appendChild(resizer);

    const body = document.createElement('div');
    body.id = ids.body;
    body.innerHTML = '<div class="qeec-placeholder">Expand to load <code>&lt;ref name=…&gt;...&lt;/ref&gt;</code> entries…</div>';
    panel.appendChild(body);

    // Settings dialog (initially hidden)
    const settings = buildSettingsUI();
    panel.appendChild(settings);

    root.appendChild(panel);
    document.body.appendChild(root);
}


function bindEvents() {
    const collapsed = document.getElementById(ids.collapsedBtn);
    const minimize = document.getElementById(ids.minimizeBtn);

    if (collapsed) {
        collapsed.addEventListener('click', function () {
            expand();
        });
        collapsed.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expand();
            }
        });
    }
    if (minimize) {
        minimize.addEventListener('click', function () {
            collapse();
        });
    }

    const refreshBtn = document.getElementById(ids.refreshBtn);
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            refresh();
        });
    }

    bindSettingsEvents();

    // Top-right custom resizer
    const resizerEl = document.querySelector('#' + ids.panel + ' .qeec-resizer');
    if (resizerEl) {
        const panelEl = document.getElementById(ids.panel);
        let dragging = null;

        function onMove(e) {
            if (!dragging) return;
            const minW = 360;
            const minH = parseFloat(getComputedStyle(panelEl).minHeight) || 260;
            const dx = e.clientX - dragging.startX;
            const dy = dragging.startY - e.clientY; // upward drag increases height
            const newW = Math.max(minW, dragging.startW + dx);
            const newH = Math.max(minH, dragging.startH + dy);
            panelEl.style.width = newW + 'px';
            panelEl.style.height = newH + 'px';
        }

        function onUp() {
            dragging = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
        }

        resizerEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            dragging = {
                startX: e.clientX, startY: e.clientY, startW: panelEl.offsetWidth, startH: panelEl.offsetHeight
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.body.style.cursor = 'nesw-resize';
        });
    }
}

function expand() {
    const root = document.getElementById(ids.root);
    if (!root) return;
    root.classList.add('is-expanded');
    const collapsedBtn = document.getElementById(ids.collapsedBtn);
    if (collapsedBtn) collapsedBtn.setAttribute('aria-expanded', 'true');
    loadRefsForCurrentPage();
}

function collapse() {
    const root = document.getElementById(ids.root);
    if (!root) return;
    root.classList.remove('is-expanded');
    const collapsedBtn = document.getElementById(ids.collapsedBtn);
    if (collapsedBtn) collapsedBtn.setAttribute('aria-expanded', 'false');
}


export function renderMessage(text) {
    const body = document.getElementById(ids.body);
    if (!body) return;
    body.innerHTML = '<div class="qeec-placeholder"></div>';
    body.querySelector('.qeec-placeholder').textContent = text;
}

function copyFromName(name) {
    const s = getSettings();
    const fmt = (s && s.copyFormat) || 'raw';
    if (fmt === 'r') return '{{r|' + name + '}}';
    if (fmt === 'ref') {
        return '<ref name="' + encodeAttr(name) + '" />';
    }
    return String(name);
}


function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
            try {
                document.execCommand('copy');
            } catch (e) {
            }
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
        } catch (e) {
        }
        ta.remove();
    }
}

export function renderRefList(items) {
    const body = document.getElementById(ids.body);
    if (!body) return;
    if (!items || !items.length) {
        renderMessage('No named <ref> tags found on this page.');
        return;
    }

    // Sort with custom order: #, A-Z, * (ignore case)
    items.sort(function (a, b) {
        const ga = groupKey(a.name), gb = groupKey(b.name);
        if (ga !== gb) return alphaIndex(ga) - alphaIndex(gb);
        return a.name.localeCompare(b.name, undefined, {sensitivity: 'base', numeric: true});
    });

    // Reset body and draw search bar
    body.innerHTML = '';
    const topbar = document.createElement('div');
    topbar.className = 'qeec-topbar';
    topbar.innerHTML = '<input id="' + ids.searchInput + '" type="search" placeholder="Search citations…" aria-label="Search citations">' + '<button id="' + ids.searchClear + '" type="button" title="Clear">✕</button>';
    body.appendChild(topbar);

    // Build structure: index + scrollable list
    const wrap = document.createElement('div');
    wrap.className = 'qeec-main';

    const indexCol = document.createElement('div');
    indexCol.className = 'qeec-index';

    const scroll = document.createElement('div');
    scroll.className = 'qeec-listwrap';

    const ul = document.createElement('ul');
    ul.id = ids.list;

    // Map first appearance per bucket & rows cache
    const firstByBucket = Object.create(null);
    const rows = [];

    items.forEach(function (it) {
        const li = document.createElement('li');

        const nameEl = document.createElement('span');
        nameEl.className = 'qeec-name';
        nameEl.textContent = it.name;
        nameEl.addEventListener('click', function () {
            const text = copyFromName(it.name);
            copyToClipboard(text);
            const existing = li.querySelector('.qeec-badge');
            if (existing) existing.remove();
            const badge = document.createElement('span');
            badge.className = 'qeec-badge';
            badge.textContent = 'Copied!';
            badge.style.marginRight = '6px';
            nameEl.insertAdjacentElement('afterend', badge);
            setTimeout(function () {
                badge.remove();
            }, 900);
        });

        const contentEl = document.createElement('span');
        contentEl.className = 'qeec-content';
        const frag = linkifyContent(it.content || '(empty)', _query || '');
        contentEl.textContent = '';
        contentEl.appendChild(frag);

        li.appendChild(nameEl);
        li.appendChild(contentEl);
        ul.appendChild(li);

        rows.push({li: li, name: it.name, content: it.content || '', nameEl: nameEl, contentEl: contentEl});

        const bucket = groupKey(it.name);
        if (!firstByBucket[bucket]) {
            firstByBucket[bucket] = li;
            li.id = 'qeec-anchor-' + bucket;
        }
    });

    scroll.appendChild(ul);
    wrap.appendChild(indexCol);
    wrap.appendChild(scroll);
    body.appendChild(wrap);

    _rows = rows;
    _indexCol = indexCol;
    _scrollEl = scroll;

    // Build index
    rebuildIndex(firstByBucket);

    // Wire search
    const input = document.getElementById(ids.searchInput);
    const clear = document.getElementById(ids.searchClear);
    if (input) {
        input.addEventListener('input', function () {
            applyFilter(input.value);
        });
    }
    if (clear) {
        clear.addEventListener('click', function () {
            input.value = '';
            applyFilter('');
            input.focus();
        });
    }

    // Set min-height only once; index is always # A–Z *
    if (!_minHeightSet) {
        recalcMinHeight();
    }
}


export function rebuildIndex(firstByBucket) {
    if (!_indexCol || !_scrollEl) return;
    _indexCol.innerHTML = '';
    alphabet().forEach(function (lab) {
        const btn = document.createElement('button');
        btn.textContent = lab;
        if (!firstByBucket[lab]) {
            btn.className = 'qeec-disabled';
        } else {
            btn.addEventListener('click', function () {
                const target = firstByBucket[lab];
                if (!target) return;
                target.scrollIntoView({block: 'nearest', inline: 'start', behavior: 'smooth'});
            });
        }
        _indexCol.appendChild(btn);
    });
}

function recalcMinHeight() {
    const body = document.getElementById(ids.body);
    const panelEl = document.getElementById(ids.panel);
    if (!panelEl || !body) return;
    const headerEl = document.getElementById(ids.header);
    const indexColEl = body.querySelector('.qeec-index');
    const topbarEl = body.querySelector('.qeec-topbar');
    const bodyStyles = getComputedStyle(body);
    const padY = (parseInt(bodyStyles.paddingTop, 10) || 0) + (parseInt(bodyStyles.paddingBottom, 10) || 0);
    const topbarH = topbarEl ? topbarEl.offsetHeight : 0;
    const topbarMB = topbarEl ? (parseInt(getComputedStyle(topbarEl).marginBottom, 10) || 0) : 0;
    const needed = (headerEl ? headerEl.offsetHeight : 0) + padY + topbarH + topbarMB + (indexColEl ? indexColEl.scrollHeight : 0) + 12;
    const minH = Math.max(260, needed);
    panelEl.style.minHeight = minH + 'px';
    if (panelEl.offsetHeight < minH) {
        panelEl.style.height = minH + 'px';
    }
    _minHeightSet = true;
}