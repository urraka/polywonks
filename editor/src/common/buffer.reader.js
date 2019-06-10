export class BufferReader {
    constructor(arrayBuffer) {
        this.offset = 0;
        this.view = new DataView(arrayBuffer);
    }

    skip(byteCount) {
        this.offset += byteCount;
    }

    read(methodName, byteCount) {
        if (this.offset + byteCount <= this.view.byteLength) {
            const value = this.view[methodName](this.offset, true);
            this.offset += byteCount;
            return value;
        } else {
            throw new Error("Buffer reading overflow");
        }

        return 0;
    }

    str(maxLength) {
        const length = this.u8();
        const values = [];

        for (let i = 0; i < length; i++) {
            values.push(this.u8());
        }

        this.skip(Math.max(0, maxLength - length));
        return String.fromCharCode.apply(null, values);
    }

    i8() { return this.read("getInt8", 1); }
    u8() { return this.read("getUint8", 1); }
    i16() { return this.read("getInt16", 2); }
    u16() { return this.read("getUint16", 2); }
    i32() { return this.read("getInt32", 4); }
    u32() { return this.read("getUint32", 4); }
    f32() { return this.read("getFloat32", 4); }
}
