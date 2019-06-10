import * as fmt from "./format.js";

export class Enum {
    constructor(object) {
        const values = new Set();
        for (const [key, value] of Object.entries(object)) {
            if (!fmt.isPascalCase(key) ||
                typeof value !== "number" ||
                Math.trunc(value) !== value ||
                values.has(value)) {
                throw new Error("Invalid enum");
            }
            values.add(value);
        }

        Object.assign(this, object);
        Object.freeze(this);
    }

    filter(fn) {
        const filtered = {};
        for (const key of Object.keys(this)) {
            if (fn(this[key])) {
                filtered[key] = this[key];
            }
        }
        return new Enum(filtered);
    }

    name(value) {
        for (const key of Object.keys(this)) {
            if (this[key] === value) {
                return fmt.pascalToDash(key);
            }
        }

        throw new Error("Invalid enum value");
    }

    value(name) {
        return this[fmt.dashToPascal(name)];
    }

    defaultName() {
        const keys = Object.keys(this);
        const key = keys.find(k => this[k] === 0);
        if (key) {
            return fmt.pascalToDash(key);
        } else {
            return fmt.pascalToDash(keys[0]);
        }
    }

    *entries() {
        for (const key of Object.keys(this)) {
            yield [fmt.pascalToDash(key), this[key]];
        }
    }

    *names() {
        for (const key of Object.keys(this)) {
            yield fmt.pascalToDash(key);
        }
    }

    *values() {
        for (const key of Object.keys(this)) {
            yield this[key];
        }
    }
}
