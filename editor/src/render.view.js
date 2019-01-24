import { Matrix } from "./support/matrix.js";
import { EventEmitter, Event } from "./support/event.js";

// {x, y} is in map coordinates and always maps to the center of the canvas
export class RenderView extends EventEmitter {
    constructor(renderer) {
        super();
        this._x = 0;
        this._y = 0;
        this._scale = 1;
        this.renderer = renderer;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get scale() { return this._scale; }

    set x(value) {
        this._x = value;
        this.emit("change");
    }

    set y(value) {
        this._y = value;
        this.emit("change");
    }

    set scale(value) {
        this._scale = value;
        this.emit("change");
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.emit("change");
    }

    get width() {
        return this.renderer.width / this.scale;
    }

    get height() {
        return this.renderer.height / this.scale;
    }

    get transform() {
        const w = this.width / 2;
        const h = this.height / 2;
        return Matrix.ortho(this.x - w, this.x + w, this.y + h, this.y - h);
    }

    canvasToMap(x, y) {
        return {
            x: this.x + (x - this.renderer.width / 2) / this.scale,
            y: this.y + (y - this.renderer.height / 2) / this.scale
        };
    }

    mapToCanvas(x, y) {
        return {
            x: (x - this.x) * this.scale + this.renderer.width / 2,
            y: (y - this.y) * this.scale + this.renderer.height / 2
        };
    }

    mapToPixelGrid(x, y) {
        const p = this.mapToCanvas(x, y);
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
        return this.canvasToMap(p.x, p.y);
    }
}
