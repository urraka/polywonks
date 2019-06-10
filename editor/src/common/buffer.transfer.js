if (!ArrayBuffer.transfer) {
    ArrayBuffer.transfer = function (source, length) {
        if (!(source instanceof ArrayBuffer)) {
            throw new TypeError("Source must be an instance of ArrayBuffer");
        }

        if (length <= source.byteLength) {
            return source.slice(0, length);
        }

        const sourceView = new Uint8Array(source);
        const destView = new Uint8Array(new ArrayBuffer(length));
        destView.set(sourceView);
        return destView.buffer;
    };
}
