import * as fmt from "./format.js";

export class Enum {
    static valueToName(enumType, enumValue) {
        for (const key of Object.keys(enumType)) {
            if (enumType[key] === enumValue) {
                return fmt.pascalToDash(key);
            }
        }

        throw new Error("Invalid enum value");
    }

    static nameToValue(enumType, name) {
        return enumType[fmt.dashToPascal(name)];
    }

    static *values(enumType) {
        for (const key of Object.keys(enumType)) {
            yield enumType[key];
        }
    }
}
