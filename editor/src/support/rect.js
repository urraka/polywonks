export class Rect {
    constructor(x = 0, y = 0, w = 0, h = 0) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    values() {
        return [this.x, this.y, this.width, this.height];
    }

    expandToRect(otherRect) {
        const x1 = this.x1, y1 = this.y1;
        this.x = Math.min(this.x, otherRect.x);
        this.y = Math.min(this.y, otherRect.y);
        this.width = Math.max(x1, otherRect.x1) - this.x;
        this.height = Math.max(y1, otherRect.y1) - this.y;
    }

    expandToPoint(x, y) {
        const x1 = this.x1, y1 = this.y1;
        this.x = Math.min(this.x, x);
        this.y = Math.min(this.y, y);
        this.width = Math.max(x1, x) - this.x;
        this.height = Math.max(y1, y) - this.y;
    }

    get x0() { return this.x; }
    get x1() { return this.x + this.width; }
    get y0() { return this.y; }
    get y1() { return this.y + this.height; }
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    set x1(value) { this.width = value - this.x; }
    set y1(value) { this.height = value - this.y; }
    set centerX(value) { this.x = value - this.width / 2; }
    set centerY(value) { this.y = value - this.height / 2; }

    set x0(value) {
        const x1 = this.x1;
        this.x = value;
        this.width = x1 - this.x;
    }

    set y0(value) {
        const y1 = this.y1;
        this.y = value;
        this.height = y1 - this.y;
    }
}
