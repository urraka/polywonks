import "../common/buffer.transfer.js";

export class VertexBuffer {
    constructor(context) {
        this.gl = context.gl;
        this.capacity = 1024;
        this.length = 0;
        this.buffer = new ArrayBuffer(this.capacity * VertexBuffer.VERTEX_SIZE);
        this.u8 = new Uint8Array(this.buffer);
        this.f32 = new Float32Array(this.buffer);
        this.vbo = this.gl.createBuffer();
        this.vboCapacity = 0;
        this.uploaded = false;
    }

    clear() {
        this.length = 0;
    }

    push(vertex) {
        if (this.length === this.capacity) {
            this.capacity = 2 * this.capacity;
            this.buffer = ArrayBuffer.transfer(this.buffer, this.capacity * VertexBuffer.VERTEX_SIZE);
            this.u8 = new Uint8Array(this.buffer);
            this.f32 = new Float32Array(this.buffer);
        }

        let u8index = this.length * VertexBuffer.VERTEX_SIZE;
        let f32index = u8index / Float32Array.BYTES_PER_ELEMENT;

        this.f32[f32index + 0] = vertex.x;
        this.f32[f32index + 1] = vertex.y;
        this.f32[f32index + 2] = vertex.u;
        this.f32[f32index + 3] = vertex.v;
        this.u8.set(vertex.color, u8index + (4 * Float32Array.BYTES_PER_ELEMENT));

        this.length++;
        this.uploaded = false;
    }

    upload() {
        if (!this.uploaded && this.length > 0) {
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

            if (this.capacity > this.vboCapacity) {
                gl.bufferData(gl.ARRAY_BUFFER, this.buffer.byteLength, gl.DYNAMIC_DRAW);
                this.vboCapacity = this.capacity;
            }

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.u8.subarray(0, this.length * VertexBuffer.VERTEX_SIZE));
            this.uploaded = true;
        }
    }

    static get VERTEX_SIZE() {
        return 4 * Float32Array.BYTES_PER_ELEMENT + 4;
    }
}
