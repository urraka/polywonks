export function iter(iterable) {
    return new Iter(iterable);
}

function* filter(iterable, fn) {
    for (const item of iterable) {
        if (fn(item)) yield item;
    }
}

class Iter {
    constructor(iterable) {
        this.iterable = iterable;
    }

    filter(fn) {
        return iter(filter(this.iterable, fn));
    }

    each(fn) {
        let index = 0;
        for (const item of this.iterable) {
            fn(item, index++);
        }
    }

    map(fn) {
        let index = 0;
        let result = [];
        for (const item of this.iterable) {
            result.push(fn(item, index++));
        }
        return result;
    }

    find(fn) {
        for (const item of this.iterable) {
            if (fn(item)) return item;
        }
    }

    includes(searchItem) {
        for (const item of this.iterable) {
            if (item === searchItem) return true;
        }
        return false;
    }

    first() {
        for (const item of this.iterable) {
            return item;
        }
    }

    last() {
        let result;
        for (const item of this.iterable) {
            result = item;
        }
        return result;
    }

    count() {
        let n = 0;
        for (const item of this.iterable) n++;
        return n;
    }

    [Symbol.iterator]() {
        return this.iterable[Symbol.iterator]();
    }
}
