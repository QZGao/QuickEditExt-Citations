import {ids} from "./ui.js";

const settingsKey = 'QuickEditExtCitations:settings';

export function getSettings() {
    const def = {copyFormat: 'raw', showInUserNs: true, showCiteRefCopyBtn: true};
    try {
        const s = JSON.parse(localStorage.getItem(settingsKey) || 'null');
        if (!s || typeof s !== 'object') return def;
        if (typeof s.copyFormat !== 'string') s.copyFormat = 'raw';
        if (typeof s.showInUserNs !== 'boolean') s.showInUserNs = true;
        if (typeof s.showCiteRefCopyBtn !== 'boolean') s.showCiteRefCopyBtn = true;
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

function setCopyFormat(fmt) {
    const s = getSettings();
    s.copyFormat = fmt;
    saveSettings(s);
} // New setter for user namespace visibility

function setShowInUserNs(flag) {
    const s = getSettings();
    s.showInUserNs = !!flag;
    saveSettings(s);
}

function setShowCiteRefCopyBtn(flag) {
    const s = getSettings();
    s.showCiteRefCopyBtn = !!flag;
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
    const chk2 = dlg.querySelector('input[name="qeec-show-cite-ref-copy-btn"]');
    if (chk2) chk2.checked = !!s.showCiteRefCopyBtn;
}

function toggleSettings() {
    const dlg = document.getElementById(ids.settingsDialog);
    if (!dlg) return;
    const open = dlg.classList.toggle('is-open');
    if (open) applySettingsUI();
}

function closeSettings() {
    const dlg = document.getElementById(ids.settingsDialog);
    if (dlg) dlg.classList.remove('is-open');
}

export function buildSettingsUI() {
    const settings = document.createElement('section');
    settings.id = ids.settingsDialog;
    settings.setAttribute('role', 'dialog');
    settings.setAttribute('aria-modal', 'false');
    settings.innerHTML = `<button id="${ids.settingsClose}" class="qeec-close" type="button" aria-label="Close">×</button>
<h3>Settings</h3>
<fieldset class="qeec-fieldset">
  <legend>Visibility</legend>
  <div class="qeec-row"><label><input type="checkbox" name="qeec-show-user-ns" value="1"> Run this gadget in User namespace</label></div>
  <div class="qeec-row"><label><input type="checkbox" name="qeec-show-cite-ref-copy-btn" value="1"> Show "Copy permalink" button when hovering a citation on the page (needs page reload)</label></div>
</fieldset>
<fieldset class="qeec-fieldset">
  <legend>When you click a citation name in the dialog, copy as:</legend>
  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="raw"> Raw name</label></div>
  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="r"> {{r|…}}</label></div>
  <div class="qeec-row"><label><input type="radio" name="qeec-copyformat" value="ref"> &lt;ref name="…" /&gt;</label></div>
</fieldset>
`;
    return settings;
}

export function bindSettingsEvents() {
    const settingsBtn = document.getElementById(ids.settingsBtn);
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function () {
            toggleSettings();
        });
    }

    const settingsDlg = document.getElementById(ids.settingsDialog);
    if (settingsDlg) {
        settingsDlg.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'qeec-copyformat') {
                setCopyFormat(e.target.value);
            } else if (e.target && e.target.name === 'qeec-show-user-ns') {
                setShowInUserNs(!!e.target.checked);
            } else if (e.target && e.target.name === 'qeec-show-cite-ref-copy-btn') {
                setShowCiteRefCopyBtn(!!e.target.checked);
            }
        });
        const closeBtn = document.getElementById(ids.settingsClose);
        if (closeBtn) closeBtn.addEventListener('click', function () {
            closeSettings();
        });
    }
}