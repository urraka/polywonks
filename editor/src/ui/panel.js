import { EventEmitter } from "../common/event.js";
import { elem, registerStyles } from "./common.js"

registerStyles(/* css */`
.panel {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    cursor: default;
}
`);

export class Panel extends EventEmitter {
    constructor(className = "") {
        super();
        this.element = elem("div", ["panel", className]);
    }

    append(element) {
        this.element.append(element.element || element);
        return element;
    }
}
