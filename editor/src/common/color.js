export class Color extends Uint8Array {
    /**
     * With 1 argument:
     * new Color(str)
     * new Color(Color)
     * new Color([r, g, b])
     * new Color([r, g, b, a])
     *
     * With 2 arguments:
     * new Color(str, a)
     * new Color(Color, a)
     * new Color([r, g, b], a)
     *
     * With 3+ arguments:
     * new Color(r, g, b)
     * new Color(r, g, b, a)
     */
    constructor(...args) {
        super(4);
        this.set(...args);
    }

    /**
     * With 1 argument:
     * set(str)
     * set(Color)
     * set([r, g, b])
     * set([r, g, b, a])
     *
     * With 2 arguments:
     * set(str, a)
     * set(Color, a)
     * set([r, g, b], a)
     *
     * With 3+ arguments:
     * set(r, g, b)
     * set(r, g, b, a)
     */
    set(...args) {
        switch (args.length) {
            case 0: {
                return;
            }

            case 1: {
                const color = args[0];

                if (typeof color === "string") {
                    this.parse(color);
                } else switch (color.length) {
                    default: throw new Error("Invalid arguments");
                    case 3: this[3] = 255;
                    case 4: super.set(color);
                }

                break;
            }

            case 2: {
                this.set(args[0]);
                this.a = args[1];
                break;
            }

            default: {
                this.set(args);
            }
        }
    }

    parse(str, defaultColor) {
        let m;

        if (m = str.match(/^#?([0-9a-f]{3})$/i)) {
            this.set([
                parseInt(m[1].charAt(0), 16) * 0x11,
                parseInt(m[1].charAt(1), 16) * 0x11,
                parseInt(m[1].charAt(2), 16) * 0x11
            ]);
        } else if (m = str.match(/^#?([0-9a-f]{6})$/i)) {
            this.set([
                parseInt(m[1].substr(0, 2), 16),
                parseInt(m[1].substr(2, 2), 16),
                parseInt(m[1].substr(4, 2), 16)
            ]);
        } else if (m = str.match(/^#?([0-9a-f]{6}\.[0-9a-f]{2})$/i)) {
            this.set([
                parseInt(m[1].substr(0, 2), 16),
                parseInt(m[1].substr(2, 2), 16),
                parseInt(m[1].substr(4, 2), 16),
                parseInt(m[1].substr(7, 2), 16)
            ]);
        } else if (m = str.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)) {
            this.set([
                Math.min(255, m[1]),
                Math.min(255, m[2]),
                Math.min(255, m[3])
            ]);
        } else if (m = str.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+\.\d+|\.\d+|\d+)\s*\)$/i)) {
            this.set([
                Math.min(255, m[1]),
                Math.min(255, m[2]),
                Math.min(255, m[3]),
                Math.min(255, Math.round(m[4] * 255))
            ]);
        } else if (defaultColor !== undefined) {
            this.set(defaultColor);
        } else {
            throw new Error("Invalid color string");
        }
    }

    static parse(...args) {
        const color = new Color();
        color.parse(...args);
        return color;
    }

    toString(format) {
        if (!format) {
            const toStr = x => x.toString(16).padStart(2, "0");
            return "#" + Array.from(this).slice(0, 3).map(toStr).join("") +
                (this.a !== 255 ? "." + toStr(this.a) : "");
        } else if (format === "rgba") {
            if (this.a === 255) {
                return `rgb(${this.r},${this.g},${this.b})`;
            } else {
                return `rgb(${this.r},${this.g},${this.b},${this.a / 255})`;
            }
        }
    }

    /**
     * Returns normalized values [0..1]
     */
    toHSV() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const a = this.a / 255;
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        const delta = max - min;

        let h = 0;
        const s = max > 0 ? delta / max : 0;
        const v = max;

        if (min !== max) {
            switch(max) {
                case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
                case g: h = (b - r) / delta + 2; break;
                case b: h = (r - g) / delta + 4; break;
            }
        }

        return [h / 6, s, v, a];
    }

    toHSL() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const a = this.a / 255;
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        const l = (max + min) / 2;
        if (max === min) {
            return [0, 0, l, a];
        } else {
            let h = 0;
            const delta = max - min;
            const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
            switch (max) {
                case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
                case g: h = (b - r) / delta + 2; break;
                case b: h = (r - g) / delta + 4; break;
            }
            return [h / 6, s, l, a];
        }
    }

    /**
     * Takes normalized values [0..1]
     */
    static fromHSV(h, s, v, a = 1) {
        h *= 6;
        const i = Math.floor(h);
        const f = h - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        const mod = i % 6;
        const r = [v, q, p, p, t, v][mod];
        const g = [t, v, v, q, p, p][mod];
        const b = [p, p, t, v, v, q][mod];
        return new Color(r * 255, g * 255, b * 255, a * 255);
    }

    static fromHSL(h, s, l, a = 1) {
        if (h === 0) {
            const x = 255 * l;
            return new Color(x, x, x, 255 * a);
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            const r = 255 * hue2rgb(p, q, h + 1/3);
            const g = 255 * hue2rgb(p, q, h);
            const b = 255 * hue2rgb(p, q, h - 1/3);
            return new Color(r, g, b, 255 * a);
        }
    }

    equals(b) {
        return this[0] === b[0] && this[1] === b[1] && this[2] === b[2] && this[3] === b[3];
    }

    static rgba(r, g, b, a = 255) {
        return new Color(r, g, b, a);
    }

    static bgra(b, g, r, a = 255) {
        return new Color(r, g, b, a);
    }

    get r() { return this[0]; }
    get g() { return this[1]; }
    get b() { return this[2]; }
    get a() { return this[3]; }

    set r(x) { this[0] = x; }
    set g(x) { this[1] = x; }
    set b(x) { this[2] = x; }
    set a(x) { this[3] = x; }
}
