import { Tool } from "./tool.js";

export class PanTool extends Tool {
    constructor() {
        super();
        this.position = { x: 0, y: 0 };
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onCursorChange = this.onCursorChange.bind(this);
    }

    get text() {
        return "Pan";
    }

    get statusText() {
        return "Pan";
    }

    get button() {
        return this.editor.cursor.leftButton;
    }

    onActivate() {
        this.updatePosition();
        this.editor.cursor.on("move", this.onPointerMove);
        this.editor.cursor.on("visibilitychange", this.onCursorChange);
    }

    onDeactivate() {
        this.editor.cursor.off("move", this.onPointerMove);
        this.editor.cursor.off("visibilitychange", this.onCursorChange);
    }

    onCursorChange() {
        this.updatePosition();
    }

    onPointerMove() {
        if (this.button.pressed) {
            const dx = this.editor.cursor.x - this.position.x;
            const dy = this.editor.cursor.y - this.position.y;
            this.editor.cursor.off("move", this.onPointerMove);
            this.editor.view.set(this.editor.view.x - dx, this.editor.view.y - dy);
            this.editor.cursor.on("move", this.onPointerMove);
        }
        this.updatePosition();
    }

    updatePosition() {
        this.position.x = this.editor.cursor.x;
        this.position.y = this.editor.cursor.y;
    }
}

export class PassivePanTool extends PanTool {
    get button() {
        return this.editor.cursor.middleButton;
    }
}

Tool.register(PanTool);
Tool.registerPassive(PassivePanTool);
