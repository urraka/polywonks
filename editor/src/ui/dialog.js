import { Panel, elem } from "./common.js";
import { Event } from "../support/event.js";

export class Dialog extends Panel {
    constructor() {
        super("dialog");
        this.overlay = null;
        this.defaultButton = undefined;
        this.onFocusTrapsIn = this.onFocusTrapsIn.bind(this);
        this.onOverlayFocusOut = this.onOverlayFocusOut.bind(this);
        this.onDocumentFocusIn = this.onDocumentFocusIn.bind(this);

        const begin = this.append(elem("div"));
        this.body = this.append(elem("div", "dialog-body"));
        this.buttons = this.append(elem("div", "dialog-buttons"));
        const end = this.append(elem("div"));

        begin.setAttribute("tabindex", 0);
        end.setAttribute("tabindex", 0);
    }

    set message(text) {
        this.element.querySelector(".dialog-body").textContent = text;
    }

    activate() {
        this.element.firstElementChild.addEventListener("focusin", this.onFocusTrapsIn);
        this.element.lastElementChild.addEventListener("focusin", this.onFocusTrapsIn);
        this.overlay.addEventListener("focusout", this.onOverlayFocusOut);
        document.addEventListener("focusin", this.onDocumentFocusIn);
    }

    deactivate() {
        this.element.firstElementChild.removeEventListener("focusin", this.onFocusTrapsIn);
        this.element.lastElementChild.removeEventListener("focusin", this.onFocusTrapsIn);
        this.overlay.removeEventListener("focusout", this.onOverlayFocusOut);
        document.removeEventListener("focusin", this.onDocumentFocusIn);
    }

    addButton(key, text, defaultButton = false) {
        const button = elem("button");
        button.setAttribute("type", "button");
        button.textContent = text;
        button.addEventListener("click", () => this.onButtonClick(key));

        if (defaultButton) {
            this.defaultButton = { key, element: button };
        }

        this.buttons.append(button);
    }

    show() {
        if (!this.overlay) {
            this.overlay = elem("div", "dialog-overlay");
            this.overlay.setAttribute("tabindex", -1);
            this.overlay.append(this.element);
            this.overlay.addEventListener("keydown", e => this.onKeyDown(e));
            this.overlay.addEventListener("mousedown", e => this.onOverlayMouseDown(e));
            document.body.append(this.overlay);

            if (this.defaultButton) {
                this.defaultButton.element.focus();
            } else {
                this.overlay.focus();
            }

            this.activate();
        }
    }

    close() {
        if (this.overlay) {
            this.deactivate();
            this.element.remove();
            this.overlay.remove();
            this.overlay = null;
        }
    }

    onButtonClick(key) {
        this.emit(new Event("buttonclick", { button: key }));
    }

    onFocusTrapsIn(event) {
        const focused = event.target;
        const unfocused = event.relatedTarget;

        if (focused === this.element.firstElementChild) {
            if (!unfocused || (focused.compareDocumentPosition(unfocused) & Node.DOCUMENT_POSITION_PRECEDING)) {
                this.buttons.firstElementChild.focus();
            } else {
                this.buttons.lastElementChild.focus();
            }
        } else if (focused === this.element.lastElementChild) {
            if (!unfocused || (focused.compareDocumentPosition(unfocused) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                this.buttons.lastElementChild.focus();
            } else {
                this.buttons.firstElementChild.focus();
            }
        }
    }

    onDocumentFocusIn(event) {
        if (!event.relatedTarget) {
            this.element.firstElementChild.focus();
        }
    }

    onOverlayFocusOut(event) {
        if (!event.relatedTarget || !this.overlay.contains(event.relatedTarget)) {
            this.element.lastElementChild.focus();
        }
    }

    onKeyDown(event) {
        event.stopPropagation();

        if (event.key === "Enter") {
            const active = [...this.buttons.children].find(element => element === document.activeElement);
            if (this.defaultButton && !active) {
                this.emit(new Event("buttonclick", { button: this.defaultButton.key }));
            }
        } else if (event.key === "Escape") {
            if (this.emit(new Event("cancel"))) {
                this.close();
            }
        }
    }

    onOverlayMouseDown(event) {
        if (event.target === this.overlay) {
            event.stopPropagation();
            if (!this.element.classList.contains("shake")) {
                this.element.classList.add("shake");
                setTimeout(() => this.element.classList.remove("shake"), 400);
            }
        }
    }
}
