import {ids} from "./ui.js";

const settingsKey = 'QuickEditExtCitations:settings';

export function getSettings() {
    const def = {copyFormat: 'raw', showInUserNs: true};
    try {
        const s = JSON.parse(localStorage.getItem(settingsKey) || 'null');
        if (!s || typeof s !== 'object') return def;
        if (typeof s.copyFormat !== 'string') s.copyFormat = 'raw';
        if (typeof s.showInUserNs !== 'boolean') s.showInUserNs = true;
        return s;
    } catch (e) {
        return def;
    }
}

function saveSettings(s) {
    try {
        localStorage.setItem(settingsKey, JSON.stringify(s));
    } catch (e) {
    }
}

export function setCopyFormat(fmt) {
    const s = getSettings();
    s.copyFormat = fmt;
    saveSettings(s);
} // New setter for user namespace visibility

export function setShowInUserNs(flag) {
    const s = getSettings();
    s.showInUserNs = !!flag;
    saveSettings(s);
}

function applySettingsUI() {
    const s = getSettings();
    const dlg = document.getElementById(ids.settingsDialog);
    if (!dlg) return;
    const opts = dlg.querySelectorAll('input[name="qeec-copyformat"]');
    for (let i = 0; i < opts.length; i++) {
        opts[i].checked = (opts[i].value === s.copyFormat);
    }
    const chk = dlg.querySelector('input[name="qeec-show-user-ns"]');
    if (chk) chk.checked = !!s.showInUserNs;
}

export function toggleSettings() {
    const dlg = document.getElementById(ids.settingsDialog);
    if (!dlg) return;
    const open = dlg.classList.toggle('is-open');
    if (open) applySettingsUI();
}

export function closeSettings() {
    const dlg = document.getElementById(ids.settingsDialog);
    if (dlg) dlg.classList.remove('is-open');
}
