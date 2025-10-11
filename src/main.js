import {initUI} from "./ui.js";

function init() {
    if (mw && mw.hook) {
        mw.hook('wikipage.content').add(function () {
            initUI();
        });
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                initUI();
            });
        } else {
            initUI();
        }
    }
}

init();