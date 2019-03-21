import { Tool } from "./tool.js";

export class CursorTool extends Tool {
    constructor() {
        super();
        this.active = false;
        this.position = { x: 0, y: 0 };

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    get status() {
        if (this.active) {
            return `${Math.round(this.position.x)}, ${Math.round(this.position.y)}`;
        }
        return "";
    }

    get x() {
        return this.position.x;
    }

    get y() {
        return this.position.y;
    }

    onActivate() {
        this.editor.element.addEventListener("mousemove", this.onMouseMove);
        this.editor.element.addEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
    }

    onDeactivate() {
        this.editor.element.removeEventListener("mousemove", this.onMouseMove);
        this.editor.element.removeEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
    }

    onMouseEnter() {
        this.active = true;
        this.emit("change");
    }

    onMouseLeave() {
        this.active = false;
        this.emit("change");
    }

    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        const pos = this.editor.view.canvasToMap(event.clientX - rect.left, event.clientY - rect.top);
        this.position.x = pos.x;
        this.position.y = pos.y;
        this.emit("change");
    }
}
