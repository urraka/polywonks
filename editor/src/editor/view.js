import { Mat2d } from "../common/matrix.js";
import { EventEmitter } from "../common/event.js";

export class View extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this._x = 0;
        this._y = 0;
        this._scale = 1;
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

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get scale() {
        return this._scale;
    }

    set x(value) {
        value = this.sanitize(value, this._x);
        if (value !== this._x) {
            this._x = value;
            this.emit("change");
        }
    }

    set y(value) {
        value = this.sanitize(value, this._y);
        if (value !== this._y) {
            this._y = value;
            this.emit("change");
        }
    }

    set scale(value) {
        value = this.sanitizeScale(value, this._scale);
        if (value !== this._scale) {
            this._scale = value;
            this.emit("change");
        }
    }

    set(x, y, scale = this.scale) {
        x = this.sanitize(x, this._x);
        y = this.sanitize(y, this._y);
        scale = this.sanitizeScale(scale, this._scale);
        if (x !== this._x || y !== this._y || scale !== this._scale) {
            this._x = x;
            this._y = y;
            this._scale = scale;
            this.emit("change");
        }
    }

    reset() {
        this.set(0, 0, 1);
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

    sanitize(value, defaultValue) {
        return !Number.isNaN(value) && Number.isFinite(value) ? value : defaultValue;
    }

    sanitizeScale(value, defaultValue) {
        value = this.sanitize(value, defaultValue);
        return value > 0 ? value : defaultValue;
    }
}
