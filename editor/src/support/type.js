import { Color } from "./color.js";
import { Node } from "../map/node.js";

const INT8 = new Int8Array(1);
const INT16 = new Int16Array(1);
const INT32 = new Int32Array(1);
const UINT8 = new Uint8Array(1);
const UINT16 = new Uint16Array(1);
const UINT32 = new Uint32Array(1);

export class ValueType {
    static toString(type, value) {
        if (value === undefined) {
            throw new Error("ValueType.toString() - undefined value");
        } else if (typeof value === "number") {
            if (Number.isNaN(value) || !Number.isFinite(value)) {
                throw new Error("ValueType.toString() - invalid number");
            }
        }

        value = ValueType.sanitize(type, value);
        return value !== null ? value.toString() : "";
    }

    static fromString(type, value) {
        if (typeof value !== "string") {
            throw new Error("Value must be a string");
        }

        switch (type.toString()) {
            case "node": throw new Error("Invalid type conversion");
            case "color": return new Color(value);
            case "enum": return ValueType.sanitize(type, value);
            case "int": case "uint":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float":
                return ValueType.sanitize(type, Number(value));
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
        switch (type.toString()) {
            case "node": return null;
            case "color": return new Color();
            case "enum": return type.defaultName();
            case "int": case "uint":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float": return 0;
            case "string": return "";
            case "boolean": return false;
        }
    }

    static sanitize(type, value) {
        switch (type.toString()) {
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
                if (![...type.names()].includes(value)) {
                    throw new Error("Invalid enum value", type, value);
                }
                return value;
            }

            case "int": case "uint":
            case "int8": case "uint8":
            case "int16": case "uint16":
            case "int32": case "uint32":
            case "float": {
                if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
                    throw new Error("Value must be a valid number");
                } else switch (type) {
                    case "int": return Math.trunc(value);
                    case "uint": return Math.max(0, Math.trunc(value));
                    case "int8": return INT8[0] = Math.trunc(value), INT8[0];
                    case "uint8": return UINT8[0] = Math.trunc(value), UINT8[0];
                    case "int16": return INT16[0] = Math.trunc(value), INT16[0];
                    case "uint16": return UINT16[0] = Math.trunc(value), UINT16[0];
                    case "int32": return INT32[0] = Math.trunc(value), INT32[0];
                    case "uint32": return UINT32[0] = Math.trunc(value), UINT32[0];
                    case "float": return Math.fround(value);
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
        }
    }

    static equals(type, a, b) {
        switch (type.toString()) {
            case "color": return a.equals(b);
            default: return a === b;
        }
    }
}
