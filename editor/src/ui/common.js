import { EventEmmiter } from "../support/event.js";

export function elem(tag, className) {
    const element = document.createElement(tag);

    if (className) {
        if (typeof className === "string") {
            element.classList.add(className);
        } else {
            className.forEach(clss => clss && element.classList.add(clss));
        }
    }

    return element;
}

export class Panel extends EventEmmiter {
    constructor(className = "") {
        super();
        this.element = elem("div", ["panel", className]);
    }

    append(element) {
        this.element.append(element.element || element);
        return element;
    }
}
