import "babel-polyfill";
import "./libs/slick";
import "./libs/jcf/jcf.js";
import "./libs/jcf/jcf.scrollable.js";
import "./libs/jcf/jcf.select.js";
import "./libs/sticky-kit.js";

import {binder} from "./libs/binder";




binder({
    bounds: {
        "html": [],
        ".header": [],
    },
    runTests: false
});
