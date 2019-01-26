import { Tool } from "./tool.js";
import { cfg } from "./settings.js";

export class ZoomTool extends Tool {
    constructor() {
        super();
        this.moveEvent = null;
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
    }

    onActivate() {
        this.editor.element.addEventListener("mousemove", this.onMouseMove);
        this.editor.element.addEventListener("wheel", this.onMouseWheel);
    }

    onDeactivate() {
        this.editor.element.removeEventListener("mousemove", this.onMouseMove);
        this.editor.element.removeEventListener("wheel", this.onMouseWheel);
    }

    onMouseMove(event) {
        this.moveEvent = event;
    }

    onMouseWheel(event) {
        const factor = cfg("editor.zoom-factor");
        if (event.deltaY < 0) {
            this.zoom(factor, event.offsetX, event.offsetY);
        } else {
            this.zoom(1 / factor, this.editor.renderer.width / 2, this.editor.renderer.height / 2);
        }
    }

    zoom(factor, centerX, centerY) {
        const z0 = cfg("editor.zoom-min");
        const z1 = cfg("editor.zoom-max");
        const s = this.editor.view.scale;
        const dx = centerX - this.editor.renderer.width / 2;
        const dy = centerY - this.editor.renderer.height / 2;
        this.editor.view.scale = Math.max(z0, Math.min(z1, this.editor.view.scale * factor));
        this.editor.view.x -= dx / this.editor.view.scale - dx / s;
        this.editor.view.y -= dy / this.editor.view.scale - dy / s;

        if (this.moveEvent) {
            this.editor.element.dispatchEvent(this.moveEvent);
        }
    }
}
