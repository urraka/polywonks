import * as xMath from "./math.js";
import { Color } from "./color.js";
import { Node } from "../map/node.js";
import { Enum } from "./enum.js";

export class ValueType {
    static typeOf(type) {
        if (type instanceof Enum) {
            return "enum";
        } else if (typeof type === "string") {
            return type;
        } else if (type && "length" in type) {
            return "array";
        } else {
            throw new Error("Invalid type");
        }
    }

    static toString(type, value) {
        if (value === undefined) {
            throw new Error("ValueType.toString() - undefined value");
        } else if (typeof value === "number") {
            if (Number.isNaN(value) || !Number.isFinite(value)) {
                throw new Error("ValueType.toString() - invalid number");
            }
        }

        if (type === "angle") {
            value = ValueType.sanitize("float", value);
            return Math.fround(value * (180 / Math.PI)).toString() + "°";
        } else {
            value = ValueType.sanitize(type, value);
            return value !== null ? value.toString() : "";
        }
    }

    static fromString(type, value) {
        if (typeof value !== "string") {
            throw new Error("Value must be a string");
        }

        switch (ValueType.typeOf(type)) {
            case "node": throw new Error("Invalid type conversion");
            case "color": return new Color(value);
            case "enum": return ValueType.sanitize(type, value);
            case "number":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float": return ValueType.sanitize(type, Number(value));
            case "angle": return ValueType.sanitize("float", Number(value.replace(/°$/, "")) * (Math.PI / 180));
            case "string": return value;
            case "boolean": {
                if (value === "true") {
                    return true;
                } else if (value === "false") {
                    return false;
                } else {
                    throw new Error("Invalid boolean string");
                }
            }
        }
    }

    static defaultValue(type) {
        switch (ValueType.typeOf(type)) {
            case "node": return null;
            case "color": return new Color();
            case "enum": return type.defaultName();
            case "number":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float": return 0;
            case "angle": return 0;
            case "string": return "";
            case "boolean": return false;
        }
    }

    static sanitize(type, value) {
        switch (ValueType.typeOf(type)) {
            case "node": {
                if (value !== null && !(value instanceof Node)) {
                    throw new Error("Value must be a node object");
                }
                return value;
            }

            case "color": {
                if (!(value instanceof Color)) {
                    throw new Error("Value must be a color");
                }
                return value;
            }

            case "enum": {
                if (typeof value === "string") {
                    if (![...type.names()].includes(value)) {
                        throw new Error("Invalid enum value", type, value);
                    }
                } else {
                    value = type.name(value);
                }
                return value;
            }

            case "number":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float": case "angle": {
                if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
                    throw new Error("Value must be a valid number");
                } else switch (type) {
                    case "number": return value;
                    case "int8": return xMath.clamp(Math.trunc(value), -0x80, 0x7f);
                    case "int16": return xMath.clamp(Math.trunc(value), -0x8000, 0x7fff);
                    case "int32": return xMath.clamp(Math.trunc(value), -0x80000000, 0x7fffffff);
                    case "uint8": return xMath.clamp(Math.trunc(value), 0, 0xff);
                    case "uint16": return xMath.clamp(Math.trunc(value), 0, 0xffff);
                    case "uint32": return xMath.clamp(Math.trunc(value), 0, 0xffffffff);
                    case "float": return Math.fround(value);
                    case "angle": return Math.fround(value);
                }
            }

            case "boolean": {
                if (typeof value !== "boolean") {
                    throw new Error("Value must be of boolean type");
                }
                return value;
            }

            case "string": {
                if (typeof value !== "string") {
                    throw new Error("Value must be of string type");
                }
                return value;
            }

            default: throw new Error("Invalid type");
        }
    }

    static equals(type, a, b) {
        switch (ValueType.typeOf(type)) {
            case "color": return a.equals(b);
            default: return a === b;
        }
    }
}
