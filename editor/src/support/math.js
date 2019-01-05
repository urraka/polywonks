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
