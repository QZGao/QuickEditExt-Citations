import {initUI} from "./ui.js";
import {isEligiblePage} from "./api.js";

function init() {
    // Stop early on disallowed namespaces or content models
    if (!isEligiblePage()) return;

    mw.hook('wikipage.content').add(function () {
        initUI();
    });
}

init();