import {groupKey, highlightHTML, linkifyContent} from "./utils.js";
import {_rows, ids, rebuildIndex, renderMessage, renderRefList} from "./ui.js";
import {getSettings} from "./settings.js";

let hasFetched = false;
export let _query;


// Filtering & highlight helpers
export function applyFilter(q) {
    _query = String(q || '');
    const rows = _rows || [];
    const query = _query.toLowerCase();
    // Clear existing anchors
    rows.forEach(function (r) {
        if (r.li.id && r.li.id.indexOf('qeec-anchor-') === 0) r.li.removeAttribute('id');
    });
    const firstByBucket = Object.create(null);
    rows.forEach(function (r) {
        const name = r.name || '';
        const content = r.content || '';
        const matched = !query || name.toLowerCase().indexOf(query) !== -1 || content.toLowerCase().indexOf(query) !== -1;
        if (matched) {
            r.li.style.display = '';
            // Update highlights
            if (_query) {
                r.nameEl.innerHTML = highlightHTML(name, _query);
            } else {
                r.nameEl.textContent = name;
            }
            r.contentEl.innerHTML = '';
            r.contentEl.appendChild(linkifyContent(content || '(empty)', _query));
            const bucket = groupKey(name);
            if (!firstByBucket[bucket]) {
                firstByBucket[bucket] = r.li;
                r.li.id = 'qeec-anchor-' + bucket;
            }
        } else {
            r.li.style.display = 'none';
        }
    });
    rebuildIndex(firstByBucket);
}

export function isEligiblePage() {
    // Allow only Main (0), User (2), and Draft (if present on this wiki)
    const ns = mw.config && mw.config.get('wgNamespaceNumber');
    const nsIds = (mw.config && mw.config.get('wgNamespaceIds')) || {};
    const allowed = (ns === 0) || (ns === 2) || (typeof nsIds.draft === 'number' && ns === nsIds.draft);
    if (!allowed) return false;
    // Respect user setting for User namespace
    if (ns === 2) {
        const s = getSettings();
        if (!s.showInUserNs) return false;
    }
    // Check content model without an API call if available
    const cm = mw.config && mw.config.get('wgPageContentModel');
    return !(cm && cm !== 'wikitext');

}

export function refresh() {
    const btn = document.getElementById(ids.refreshBtn);
    if (btn) btn.setAttribute('aria-busy', 'true');
    renderMessage('Refreshing…');
    loadRefsForCurrentPage().finally ? loadRefsForCurrentPage().finally(function () {
        if (btn) btn.removeAttribute('aria-busy');
    }) : loadRefsForCurrentPage().then(function () {
        if (btn) btn.removeAttribute('aria-busy');
    }, function () {
        if (btn) btn.removeAttribute('aria-busy');
    });
}

export function loadRefsForCurrentPage() {
    if (hasFetched) return;
    hasFetched = true;

    const title = mw.config && mw.config.get('wgPageName');
    if (!title) {
        renderMessage('Cannot determine page title.');
        return Promise.resolve();
    }
    const api = new mw.Api();
    return api.get({
        action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', formatversion: 2, titles: title
    }).then(function (data) {
        try {
            const pages = (data && data.query && data.query.pages) || [];
            if (!pages.length || !pages[0].revisions || !pages[0].revisions.length) {
                renderMessage('No wikitext found for this page.');
                return;
            }
            const content = pages[0].revisions[0].slots.main.content || '';
            const refs = extractNamedRefs(content);
            renderRefList(refs);
        } catch (err) {
            renderMessage('Failed to parse API response.');
        }
    }).catch(function (err) {
        renderMessage('API error: ' + (err && err.error && err.error.info || err && err.toString() || 'Unknown'));
    });
}

function extractNamedRefs(wikitext) {
    const map = Object.create(null);

    // Sanitize: remove HTML comments and <nowiki> regions before parsing
    let text = String(wikitext || '');
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
    const withoutSelfClosing = text.replace(/<ref\b[^>]*\bname\s*=\s*(?:"[^"]+"|'[^']+'|[^\s\/>]+)[^>]*\/\s*>/gi, '');

    // 2) Capture ONLY full refs: <ref name=...> ... </ref>
    //    Supports double-quoted, single-quoted, and unquoted names.
    const fullRefRE = /<ref\b[^>]*\bname\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s\/>]+))[^>]*>([\s\S]*?)<\/ref>/gi;
    let m;
    while ((m = fullRefRE.exec(withoutSelfClosing)) !== null) {
        const name = m[1] || m[2] || m[3] || '';
        const content = m[4] || '';
        if (!map[name]) map[name] = content.trim();
    }

    const arr = [];
    Object.keys(map).forEach(function (k) {
        arr.push({name: k, content: map[k]});
    });
    arr.sort(function (a, b) {
        return a.name.localeCompare(b.name, undefined, {numeric: true});
    });
    return arr;
}
