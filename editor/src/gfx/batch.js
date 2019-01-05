import { VertexBuffer } from "./vertexbuffer.js";

export class BatchCommand {
    constructor(mode, texture, start, end) {
        this.mode = mode;
        this.texture = texture;
        this.start = start;
        this.end = end;
    }
}

export class DrawBatch {
    constructor(context) {
        this.buffer = new VertexBuffer(context);
        this.commands = [];
    }

    clear() {
        this.buffer.clear();
        this.commands.splice(0);
    }

    add(mode, texture, vertices) {
        let i = this.buffer.length;
        let n = vertices.length;

        for (const vertex of vertices) {
            this.buffer.push(vertex);
        }

        const last = this.commands[this.commands.length - 1];

        if (last && mode === last.mode && texture === last.texture) {
            last.end += n;
        } else {
            this.commands.push(new BatchCommand(mode, texture, i, i + n));
        }
    }

    addQuad(texture, vertices) {
        this.add(WebGLRenderingContext.TRIANGLES, texture, [
            vertices[0], vertices[1], vertices[2],
            vertices[2], vertices[3], vertices[0]
        ]);
    }

    addSprite(sprite, color, transform) {
        this.addQuad(sprite.texture, sprite.computeVertices(color, transform));
    }
}
