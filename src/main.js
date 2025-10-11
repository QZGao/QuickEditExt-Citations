import {initUI} from "./ui.js";

function init() {
    mw.hook('wikipage.content').add(function () {
        initUI();
    });
}

init();