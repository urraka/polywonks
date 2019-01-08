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

    parse(str) {
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
        } else {
            console.warn("Invalid color string");
        }
    }

    toString() {
        const toStr = x => x.toString(16).padStart(2, "0");
        return "#" + Array.from(this).slice(0, 3).map(toStr).join("") +
            (this.a !== 255 ? "." + toStr(this.a) : "");
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
