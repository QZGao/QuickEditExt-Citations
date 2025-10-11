import {_query} from "./api.js";

let _alpha;
let _alphaIndex;

export function alphabet() {
    if (!_alpha) {
        _alpha = ['#'].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).concat(['*']);
    }
    return _alpha;
}

export function alphaIndex(bucket) {
    if (!_alphaIndex) {
        _alphaIndex = Object.create(null);
        const arr = alphabet();
        for (let i = 0; i < arr.length; i++) _alphaIndex[arr[i]] = i;
    }
    return _alphaIndex[bucket] != null ? _alphaIndex[bucket] : _alphaIndex['*'];
}

export function groupKey(name) {
    name = (name || '').trim();
    if (!name) return '*';
    const c = name.charAt(0);
    if (/[0-9]/.test(c)) return '#';
    if (/[A-Za-z]/.test(c)) return c.toUpperCase();
    return '*';
}


export function encodeAttr(val) {
    return String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function linkifyContent(text) {
    const frag = document.createDocumentFragment();
    if (!text) {
        frag.appendChild(document.createTextNode(''));
        return frag;
    }
    // Match from http/https until whitespace OR '|' OR '}}' (but allow single '}')
    const re = /(https?:\/\/\S*?)(?=\s|\||}}|$)/g;
    let lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > lastIndex) {
            const plain = text.slice(lastIndex, m.index);
            const span = document.createElement('span');
            span.innerHTML = highlightHTML(plain, _query || '');
            frag.appendChild(span);
        }
        const url = m[1];
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'nofollow noopener';
        a.innerHTML = highlightHTML(url, _query || '');
        frag.appendChild(a);
        lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
        const rest = text.slice(lastIndex);
        const span2 = document.createElement('span');
        span2.innerHTML = highlightHTML(rest, _query || '');
        frag.appendChild(span2);
    }
    return frag;
}

function regexEscape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function highlightHTML(s, q) {
    s = escapeHTML(String(s || ''));
    q = String(q || '');
    if (!q) return s;
    const re = new RegExp(regexEscape(q), 'gi');
    return s.replace(re, function (m) {
        return '<mark>' + m + '</mark>';
    });
}
