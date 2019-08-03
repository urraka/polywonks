import { Tool } from "./tool.js";

export class CursorTool extends Tool {
    constructor() {
        super();
        this.mouseEvent = null;
        this.position = { x: 0, y: 0 };
        this.onViewChange = this.onViewChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    get statusText() {
        return this.active ? `${Math.round(this.position.x)}, ${Math.round(this.position.y)}` : "";
    }

    get active() {
        return !!this._active;
    }

    set active(value) {
        if (this.active !== value) {
            this._active = value;
            this.emit("change");
        }
    }

    get x() {
        return this.position.x;
    }

    get y() {
        return this.position.y;
    }

    onActivate() {
        this.editor.view.on("change", this.onViewChange);
        this.editor.element.addEventListener("mousedown", this.onMouseDown, true);
        this.editor.element.addEventListener("mousemove", this.onMouseMove, true);
        this.editor.element.addEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
    }

    onDeactivate() {
        this.editor.view.off("change", this.onViewChange);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown, true);
        this.editor.element.removeEventListener("mousemove", this.onMouseMove, true);
        this.editor.element.removeEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
    }

    onViewChange() {
        if (this.mouseEvent) {
            this.updatePosition(this.mouseEvent);
        }
    }

    onMouseEnter() {
        this.active = true;
    }

    onMouseLeave() {
        this.mouseEvent = false;
        this.active = false;
    }

    onMouseDown(event) {
        this.mouseEvent = event;
        this.updatePosition(event);
    }

    onMouseMove(event) {
        this.mouseEvent = event;
        this.updatePosition(event);
    }

    updatePosition(event) {
        const rect = this.editor.element.getBoundingClientRect();
        const pos = this.editor.view.canvasToMap(event.clientX - rect.left, event.clientY - rect.top);
        if (pos.x !== this.position.x || pos.y !== this.position.y) {
            this.position.x = pos.x;
            this.position.y = pos.y;
            this.emit("change");
        }
    }
}

Tool.registerPassive(CursorTool);
