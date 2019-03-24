import { Pointer } from "../../support/pointer.js";
import { Tool } from "./tool.js";

export class PanTool extends Tool {
    constructor() {
        super();
        this.pointer = new Pointer();
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
    }

    onActivate() {
        this.pointer.activate(this.editor.element, 1);
    }

    onDeactivate() {
        this.pointer.deactivate();
    }

    onPointerMove(event) {
        if (this.pointer.dragging) {
            this.editor.view.x -= event.movementX / this.editor.view.scale;
            this.editor.view.y -= event.movementY / this.editor.view.scale;
        }
    }
}
