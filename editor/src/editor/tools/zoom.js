import { cfg } from "../../app/settings.js";
import { Tool } from "./tool.js";

export class ZoomTool extends Tool {
    constructor() {
        super();
        this.onMouseWheel = this.onMouseWheel.bind(this);
    }

    get text() {
        return "Zoom";
    }

    get statusText() {
        return "Zoom";
    }

    onActivate() {
        this.editor.element.addEventListener("wheel", this.onMouseWheel);
    }

    onDeactivate() {
        this.editor.element.removeEventListener("wheel", this.onMouseWheel);
    }

    onMouseWheel(event) {
        if (event.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    zoomIn() {
        const factor = cfg("editor.zoom-factor");
        if (this.editor.cursor.visible) {
            const point = this.editor.view.mapToCanvas(this.editor.cursor.x, this.editor.cursor.y);
            this.zoom(factor, point.x, point.y);
        } else {
            this.zoom(factor, this.editor.width / 2, this.editor.height / 2);
        }
    }

    zoomOut() {
        const factor = cfg("editor.zoom-factor");
        this.zoom(1 / factor, this.editor.width / 2, this.editor.height / 2);
    }

    zoom(factor, centerX, centerY) {
        const z0 = cfg("editor.zoom-min");
        const z1 = cfg("editor.zoom-max");
        const s = this.editor.view.scale;
        const dx = centerX - this.editor.width / 2;
        const dy = centerY - this.editor.height / 2;

        const scale = Math.max(z0, Math.min(z1, s * factor));
        const x = this.editor.view.x - dx / scale + dx / s;
        const y = this.editor.view.y - dy / scale + dy / s;

        this.editor.view.set(x, y, scale);
    }
}

Tool.registerPassive(ZoomTool);
