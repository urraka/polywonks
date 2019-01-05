import { Vertex } from "./vertex.js";

export class Sprite {
    constructor(texture, w, h, u0, u1, v0, v1) {
        this.texture = texture;
        this.width = w;
        this.height = h;
        this.u0 = u0;
        this.u1 = u1;
        this.v0 = v0;
        this.v1 = v1;
    }

    computeVertices(color, transform) {
        const w = this.width;
        const h = this.height;

        const vertices = [
            new Vertex(0, 0, this.u0, this.v0, color),
            new Vertex(w, 0, this.u1, this.v0, color),
            new Vertex(w, h, this.u1, this.v1, color),
            new Vertex(0, h, this.u0, this.v1, color)
        ];

        for (const vertex of vertices) {
            const x = transform.multiplyVectorX(vertex);
            const y = transform.multiplyVectorY(vertex);
            vertex.x = x;
            vertex.y = y;
        }

        return vertices;
    }
}
