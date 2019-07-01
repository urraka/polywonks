import { Mat2d } from "../common/matrix.js";
import { EventEmitter } from "../common/event.js";

// {x, y} is in map coordinates and always maps to the center of the canvas
export class View extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this._x = 0;
        this._y = 0;
        this._scale = 1;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get scale() { return this._scale; }

    set x(value) {
        if (!Number.isNaN(value) && Number.isFinite(value)) {
            this._x = value;
            this.emit("change");
        }
    }

    set y(value) {
        if (!Number.isNaN(value) && Number.isFinite(value)) {
            this._y = value;
            this.emit("change");
        }
    }

    set scale(value) {
        if (!Number.isNaN(value) && Number.isFinite(value) && value > 0) {
            this._scale = value;
            this.emit("change");
        }
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.emit("change");
    }

    get width() {
        return this.editor.width / this.scale;
    }

    get height() {
        return this.editor.height / this.scale;
    }

    get transform() {
        const w = this.width / 2;
        const h = this.height / 2;
        return Mat2d.ortho(this.x - w, this.x + w, this.y + h, this.y - h);
    }

    canvasToMap(x, y) {
        return {
            x: this.x + (x - this.editor.width / 2) / this.scale,
            y: this.y + (y - this.editor.height / 2) / this.scale
        };
    }

    mapToCanvas(x, y) {
        return {
            x: (x - this.x) * this.scale + this.editor.width / 2,
            y: (y - this.y) * this.scale + this.editor.height / 2
        };
    }

    mapToPixelGrid(x, y) {
        const p = this.mapToCanvas(x, y);
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
        return this.canvasToMap(p.x, p.y);
    }
}