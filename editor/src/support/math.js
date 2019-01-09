export function mod(a, b) {
    return ((a % b) + b) % b;
}

export function npot(x) {
    let result = 1;
    while (result < x) {
        result = result << 1;
    }
    return result;
}

export function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}
