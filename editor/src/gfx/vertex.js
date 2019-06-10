import { Color } from "../common/color.js";

export class Vertex {
    constructor(x = 0, y = 0, u = 0, v = 0, color = new Color(255, 255, 255)) {
        this.x = x;
        this.y = y;
        this.u = u;
        this.v = v;
        this.color = new Color(color);
    }
}
