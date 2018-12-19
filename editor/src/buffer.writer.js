import "./buffer.transfer.js";

export class BufferWriter {
    constructor() {
        this.length = 0;
        this.view = new DataView(new ArrayBuffer(1024));
    }

    truncate() {
        if (this.length < this.view.buffer.byteLength) {
            this.view = new DataView(ArrayBuffer.transfer(this.view.buffer, this.length));
        }

        return this.view.buffer;
    }

    skip(byteCount) {
        for (let i = 0; i < byteCount; i++) {
            this.u8(0);
        }
    }

    write(methodName, value, byteCount) {
        if (this.length + byteCount > this.view.byteLength) {
            this.view = new DataView(ArrayBuffer.transfer(this.view.buffer, 2 * this.view.byteLength));
        }

        this.view[methodName](this.length, value, true);
        this.length += byteCount;
    }

    str(text, maxLength) {
        maxLength = Math.min(maxLength, 255);
        const length = Math.min(text.length, maxLength);

        this.u8(length);

        for (let i = 0; i < length; i++) {
            this.u8(text.charCodeAt(i));
        }

        for (let i = length; i < maxLength; i++) {
            this.u8(0);
        }
    }

    i8(value) { return this.write("setInt8", value, 1); }
    u8(value) { return this.write("setUint8", value, 1); }
    i16(value) { return this.write("setInt16", value, 2); }
    u16(value) { return this.write("setUint16", value, 2); }
    i32(value) { return this.write("setInt32", value, 4); }
    u32(value) { return this.write("setUint32", value, 4); }
    f32(value) { return this.write("setFloat32", value, 4); }
}
