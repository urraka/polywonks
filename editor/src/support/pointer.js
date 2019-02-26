import { EventEmitter } from "./event.js";

export class Pointer extends EventEmitter {
    constructor() {
        super();
        this.element = null;
        this.button = 0;
        this.dragging = false;
        this.pointerId = null;
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerCancel = this.onPointerCancel.bind(this);
    }

    activate(element, button) {
        if (element !== this.element || button !== this.button) {
            this.deactivate();
            this.element = element;
            this.button = button;
            this.element.addEventListener("pointerdown", this.onPointerDown);
            this.element.addEventListener("mousedown", this.onMouseDown);
            this.element.addEventListener("mouseup", this.onMouseUp);
            this.element.addEventListener("mousemove", this.onMouseMove);
        }
    }

    deactivate() {
        if (this.element) {
            this.cancel();
            this.element.removeEventListener("pointerdown", this.onPointerDown);
            this.element.removeEventListener("mousedown", this.onMouseDown);
            this.element.removeEventListener("mouseup", this.onMouseUp);
            this.element.removeEventListener("mousemove", this.onMouseMove);
            this.element = null;
        }
    }

    cancel(event = null) {
        if (this.pointerId !== null) {
            this.element.removeEventListener("pointerup", this.onPointerCancel);
            this.element.removeEventListener("pointercancel", this.onPointerCancel);
            this.element.removeEventListener("lostpointercapture", this.onPointerCancel);
            this.element.releasePointerCapture(this.pointerId);
            this.pointerId = null;
        }

        if (this.dragging) {
            this.dragging = false;
            this.emit("end", { mouseEvent: event });
        }
    }

    onMouseDown(event) {
        if (event.button === this.button) {
            this.dragging = true;
            this.emit("begin", { mouseEvent: event });
        }
    }

    onMouseUp(event) {
        if (event.button === this.button) {
            this.cancel(event);
        }
    }

    onMouseMove(event) {
        this.emit("move", { mouseEvent: event });
    }

    onPointerDown(event) {
        if (event.pointerType === "mouse" && event.button === this.button) {
            this.cancel(event);
            this.element.addEventListener("pointerup", this.onPointerCancel);
            this.element.addEventListener("pointercancel", this.onPointerCancel);
            this.element.addEventListener("lostpointercapture", this.onPointerCancel);
            this.element.setPointerCapture(this.pointerId = event.pointerId);
        }
    }

    onPointerCancel(event) {
        if (event.pointerId === this.pointerId) {
            this.cancel(event);
        }
    }
}

export class MovementThreshold {
    constructor(threshold = 0) {
        this.reset(threshold);
    }

    reset(threshold) {
        this.threshold = threshold;
        this.x = 0;
        this.y = 0;
    }

    click(event) {
        if (event) {
            this.x = event.clientX;
            this.y = event.clientY;
        }
    }

    moved(event) {
        return Math.abs(event.clientX - this.x) > this.threshold ||
            Math.abs(event.clientY - this.y) > this.threshold;
    }
}
