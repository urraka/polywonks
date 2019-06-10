import { EventEmitter } from "../common/event.js";
import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./dialog.styles.js";

registerStyles(styles);

export class Dialog extends Panel {
    constructor() {
        super("dialog");
        this.overlay = null;
        this.previousModal = null;
        this.defaultButton = null;
        this.onFocusTrapsIn = this.onFocusTrapsIn.bind(this);
        this.onOverlayFocusOut = this.onOverlayFocusOut.bind(this);
        this.onDocumentFocusIn = this.onDocumentFocusIn.bind(this);

        const begin = this.append(elem("div", "focus-trap"));
        this.header = this.append(elem("div", "dialog-header"));
        this.body = this.append(elem("div", "dialog-body"));
        this.buttons = this.append(elem("div", "dialog-buttons"));
        const end = this.append(elem("div", "focus-trap"));

        begin.setAttribute("tabindex", 0);
        end.setAttribute("tabindex", 0);
    }

    activate() {
        this.element.firstElementChild.addEventListener("focusin", this.onFocusTrapsIn);
        this.element.lastElementChild.addEventListener("focusin", this.onFocusTrapsIn);
        this.overlay.addEventListener("focusout", this.onOverlayFocusOut);
        document.addEventListener("focusin", this.onDocumentFocusIn);
        this.overlay.classList.add("active");

        setTimeout(() => {
            if (this.defaultButton) {
                this.defaultButton.element.focus();
            } else {
                this.overlay.focus();
            }
        }, 200);
    }

    deactivate() {
        this.element.firstElementChild.removeEventListener("focusin", this.onFocusTrapsIn);
        this.element.lastElementChild.removeEventListener("focusin", this.onFocusTrapsIn);
        this.overlay.removeEventListener("focusout", this.onOverlayFocusOut);
        document.removeEventListener("focusin", this.onDocumentFocusIn);
        this.overlay.classList.remove("active");
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
            this.previousModal = Dialog.activeDialog;

            if (this.previousModal) {
                this.previousModal.deactivate();
            } else {
                Dialog.emitter.emit("modalstart");
            }

            this.overlay = elem("div", "dialog-overlay");
            this.overlay.setAttribute("tabindex", -1);
            this.overlay.append(this.element);
            this.overlay.addEventListener("keydown", e => this.onKeyDown(e));
            this.overlay.addEventListener("mousedown", e => this.onOverlayMouseDown(e));
            Dialog.dialogs.set(this.overlay, this);
            document.body.append(this.overlay);
            this.activate();
        }
    }

    close() {
        if (this.overlay) {
            this.deactivate();
            this.element.remove();
            this.overlay.remove();
            this.overlay = null;

            if (this.previousModal) {
                if (this.previousModal.overlay) {
                    this.previousModal.activate();
                }
                this.previousModal = null;
            } else {
                Dialog.emitter.emit("modalend");
            }

            this.emit("close");
        }
    }

    onButtonClick(key) {
        this.emit("buttonclick", { button: key });
    }

    get focusableElements() {
        return [...this.element.querySelectorAll('input,select,textarea,button,a[href],[tabindex="0"]:not(.focus-trap)')];
    }

    onFocusTrapsIn(event) {
        const focused = event.target;
        const unfocused = event.relatedTarget;

        if (focused === this.element.firstElementChild) {
            if (!unfocused || (focused.compareDocumentPosition(unfocused) & Node.DOCUMENT_POSITION_PRECEDING)) {
                this.focusableElements.shift().focus();
            } else {
                this.focusableElements.pop().focus();
            }
        } else if (focused === this.element.lastElementChild) {
            if (!unfocused || (focused.compareDocumentPosition(unfocused) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                this.focusableElements.pop().focus();
            } else {
                this.focusableElements.shift().focus();
            }
        }
    }

    onDocumentFocusIn(event) {
        if (!event.relatedTarget && !this.overlay.contains(event.target)) {
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
                this.emit("buttonclick", { button: this.defaultButton.key });
            }
        } else if (event.key === "Escape") {
            if (this.emit("cancel")) {
                this.close();
            }
        }
    }

    onOverlayMouseDown(event) {
        if (event.target === this.overlay) {
            event.stopPropagation();
            if (!this.element.classList.contains("flicker")) {
                this.element.classList.add("flicker");
                setTimeout(() => this.element.classList.remove("flicker"), 400);
            }
        }
    }

    static get dialogs() {
        return Dialog._dialogs || (Dialog._dialogs = new WeakMap());
    }

    static get activeDialog() {
        return Dialog.dialogs.get(document.querySelector("body > .dialog-overlay.active"));
    }

    static get emitter() {
        return Dialog._emitter || (Dialog._emitter = new EventEmitter());
    }

    static on(...args) {
        Dialog.emitter.on(...args);
    }
}
