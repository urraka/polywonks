export function pascalToDash(str) {
    return str.replace(/([A-Z]|[0-9]+)/g, (m, p1) => "-" + p1.toLowerCase()).replace(/^-/, "");
}

export function dashToPascal(str) {
    return str.replace(/(^.|-.)/g, (m, p1) => p1.slice(-1).toUpperCase());
}

export function dashToCamel(str) {
    return str.replace(/(-.)/g, (m, p1) => p1.slice(-1).toUpperCase());
}

export function isPascalCase(str) {
    return /^[A-Z][A-z0-9]*$/.test(str);
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
