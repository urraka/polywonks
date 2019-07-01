import { cfg } from "../app/settings.js";

const AxisSize = {
    "x": "width",
    "y": "height"
};

export class GridLine {
    constructor(axis, color, offset) {
        this.axis = axis;
        this.color = color;
        this.offset = offset;
    }
}

export class Grid {
    constructor(view) {
        this.view = view;
    }

    get majorSize() {
        const size = cfg("editor.grid-size");
        const limit = cfg("editor.grid-limit");
        return size * Math.ceil(limit / (size * this.view.scale));
    }

    get minorSize() {
        const size = cfg("editor.grid-size") / cfg("editor.grid-divisions");
        return size * this.view.scale >= cfg("editor.grid-limit") ? size : 0;
    }

    get effectiveSize() {
        return this.minorSize || this.majorSize;
    }

    *lines() {
        if (cfg("view.grid")) {
            yield* this.minorLines("x");
            yield* this.minorLines("y");
            yield* this.majorLines("x");
            yield* this.majorLines("y");
        }
    }

    *minorLines(axis) {
        const inc = this.minorSize;

        if (inc > 0) {
            const size = cfg("editor.grid-size");
            const divisions = cfg("editor.grid-divisions");
            const color = cfg("theme.grid-color-division");

            const a = this.view[axis] - this.view[AxisSize[axis]] / 2;
            const b = this.view[axis] + this.view[AxisSize[axis]] / 2;

            for (let t = Math.floor(a / size) * size + inc; t <= b + size; t += inc) {
                for (let i = 0; i < divisions - 1; t += inc, i++) {
                    yield new GridLine(axis, color, t);
                }
            }
        }
    }

    *majorLines(axis) {
        const color = cfg("theme.grid-color");
        const inc = this.majorSize;
        const a = this.view[axis] - this.view[AxisSize[axis]] / 2;
        const b = this.view[axis] + this.view[AxisSize[axis]] / 2;

        for (let t = Math.floor(a / inc) * inc; t <= b + inc; t += inc) {
            yield new GridLine(axis, color, t);
        }
    }
}
