export class Mat2d extends Float32Array {
    constructor() {
        super(9);
        this[0] = this[4] = this[8] = 1;
    }

    multiplyMatrix(matrix) {
        const m = this;
        const n = matrix;
        const r = new Mat2d();
        r[0] = m[0] * n[0] + m[3] * n[1];
        r[1] = m[1] * n[0] + m[4] * n[1];
        r[2] = 0;
        r[3] = m[0] * n[3] + m[3] * n[4];
        r[4] = m[1] * n[3] + m[4] * n[4];
        r[5] = 0;
        r[6] = m[0] * n[6] + m[3] * n[7] + m[6];
        r[7] = m[1] * n[6] + m[4] * n[7] + m[7];
        r[8] = 1;
        return r;
    }

    multiplyVectorX(v) {
        return this[0] * v.x + this[3] * v.y + this[6];
    }

    multiplyVectorY(v) {
        return this[1] * v.x + this[4] * v.y + this[7];
    }

    multiplyVector(v) {
        const r = Object.create(Object.getPrototypeOf(v));
        Object.assign(r, v);
        r.x = this.multiplyVectorX(v);
        r.y = this.multiplyVectorY(v);
        return r;
    }

    multiply(rhs) {
        if (rhs instanceof Mat2d) {
            return this.multiplyMatrix(rhs);
        } else {
            return this.multiplyVector(rhs);
        }
    }

    static ortho(left, right, bottom, top) {
        const m = new Mat2d();
        const w = right - left;
        const h = top - bottom;
        m[0] = 2 / w; m[3] = 0.0; m[6] = -(right + left) / w;
        m[1] = 0.0; m[4] = 2 / h; m[7] = -(top + bottom) / h;
        m[2] = 0.0; m[5] = 0.0; m[8] = 1.0;
        return m;
    }

    static transform(x, y, cx, cy, sx, sy, r) {
        const m = new Mat2d();
        const s = Math.sin(-r);
        const c = Math.cos(-r);
        m[0] = c * sx; m[3] = -s * sy; m[6] = x - cy * m[3] - cx * m[0];
        m[1] = s * sx; m[4] = c * sy; m[7] = y - cy * m[4] - cx * m[1];
        m[2] = 0; m[5] = 0; m[8] = 1;
        return m;
    }

    static translate(x, y) {
        const m = new Mat2d();
        m[6] = x;
        m[7] = y;
        return m;
    }

    static scale(sx, sy) {
        const m = new Mat2d();
        m[0] = sx;
        m[4] = sy;
        return m;
    }

    static rotate(r) {
        const m = new Mat2d();
        const s = Math.sin(-r);
        const c = Math.cos(-r);
        m[0] = c;
        m[1] = s;
        m[3] = -s;
        m[4] = c;
        return m;
    }
}
