import { Pointer } from "../../common/pointer.js";
import { Tool } from "./tool.js";

export class PanTool extends Tool {
    constructor(button = 0) {
        super();
        this.button = button;
        this.pointer = new Pointer();
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
    }

    get text() {
        return "Pan";
    }

    get statusText() {
        return "Pan";
    }

    onActivate() {
        this.pointer.activate(this.editor.element, this.button);
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

Tool.register(PanTool);
Tool.registerPassive(PanTool.bind(null, 1));
