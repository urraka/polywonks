import { EventEmitter } from "./event.js";
import { iter } from "./iter.js";

export class PointerButton extends EventEmitter {
    constructor(pointer, button) {
        super();
        this.pointer = pointer;
        this.button = button;
        this.pressedX = 0;
        this.pressedY = 0;
        this.pressed = false;
        this.dragging = false;
    }

    press(event) {
        if (!this.pressed) {
            this.pressed = true;
            this.pressedX = event.clientX;
            this.pressedY = event.clientY;
            this.emit("buttondown", { mouseEvent: event });
        }
    }

    release(event) {
        if (this.pressed) {
            this.pressed = false;
            this.dragging = false;
            this.emit("buttonup", { mouseEvent: event });
        }
    }

    movement(event) {
        if (this.pressed && !this.dragging) {
            const dx = Math.abs(event.clientX - this.pressedX);
            const dy = Math.abs(event.clientY - this.pressedY);
            this.dragging = Math.max(dx, dy) > this.pointer.dragThreshold;
        }
    }
}

export class Pointer extends EventEmitter {
    constructor(element = null) {
        super();
        this.activated = false;
        this.element = element;
        this.buttons = {};
        this.capturedPointer = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerCancel = this.onPointerCancel.bind(this);
        this.onPointerLostCapture = this.onPointerLostCapture.bind(this);
        this.onButtonEvent = this.onButtonEvent.bind(this);
    }

    get dragThreshold() {
        return this._dragThreshold || 0;
    }

    set dragThreshold(value) {
        this._dragThreshold = +value;
    }

    activate(element = this.element) {
        if (!this.activated || element !== this.element) {
            this.deactivate();
            this.activated = true;
            this.element = element;
            this.element.addEventListener("mousedown", this.onMouseDown);
            this.element.addEventListener("mouseup", this.onMouseUp);
            this.element.addEventListener("mousemove", this.onMouseMove);
            this.element.addEventListener("pointerdown", this.onPointerDown);
            this.element.addEventListener("pointerup", this.onPointerUp);
            this.element.addEventListener("pointercancel", this.onPointerCancel);
            this.element.addEventListener("lostpointercapture", this.onPointerLostCapture);
        }
    }

    deactivate() {
        if (this.activated) {
            this.cancel();
            this.element.removeEventListener("mousedown", this.onMouseDown);
            this.element.removeEventListener("mouseup", this.onMouseUp);
            this.element.removeEventListener("mousemove", this.onMouseMove);
            this.element.removeEventListener("pointerdown", this.onPointerDown);
            this.element.removeEventListener("pointerup", this.onPointerUp);
            this.element.removeEventListener("pointercancel", this.onPointerCancel);
            this.element.removeEventListener("lostpointercapture", this.onPointerLostCapture);
            this.activated = false;
        }
    }

    button(code) {
        return this.buttons[code] || (this.buttons[code] = this.initButton(code));
    }

    initButton(code) {
        const button = new PointerButton(this, code);
        button.on("buttondown", this.onButtonEvent);
        button.on("buttonup", this.onButtonEvent);
        return button;
    }

    capture(pointerId) {
        if (this.capturedPointer === null) {
            this.element.setPointerCapture(pointerId);
            this.capturedPointer = pointerId;
        }
    }

    release() {
        if (this.capturedPointer !== null) {
            this.element.releasePointerCapture(this.capturedPointer);
            this.capturedPointer = null;
        }
    }

    cancel(event) {
        this.release();
        for (const button of Object.values(this.buttons)) {
            button.release(event);
        }
    }

    onButtonEvent(event) {
        this.emit(event.type, { button: event.target, mouseEvent: event.mouseEvent });
    }

    onMouseDown(event) {
        this.button(event.button).press(event);
    }

    onMouseUp(event) {
        this.button(event.button).release(event);
    }

    onMouseMove(event) {
        for (const button of Object.values(this.buttons)) {
            button.movement(event);
        }
        this.emit("move", { mouseEvent: event });
    }

    onPointerDown(event) {
        this.capture(event.pointerId);
    }

    onPointerUp(event) {
        if (event.pointerId === this.capturedPointer) {
            this.release();
        }
    }

    onPointerCancel(event) {
        if (event.pointerId === this.capturedPointer) {
            this.cancel();
        }
    }

    onPointerLostCapture(event) {
        if (event.pointerId === this.capturedPointer) {
            if (iter(Object.values(this.buttons)).some(button => button.pressed)) {
                this.capturedPointer = null;
                this.capture(event.pointerId);
                if (!this.element.hasPointerCapture(event.pointerId)) {
                    this.cancel();
                }
            } else {
                this.cancel();
            }
        }
    }
}
