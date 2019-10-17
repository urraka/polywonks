import { Pointer } from "../../common/pointer.js";
import { cfg, Settings } from "../../app/settings.js";
import { Tool } from "./tool.js";

export class CursorTool extends Tool {
    constructor() {
        super();
        this.image = "default";
        this.position = { x: 0, y: 0 };
        this.clientX = 0;
        this.clientY = 0;

        this.pointer = new Pointer();
        this.pointer.on("move", e => this.onPointerEvent(e));
        this.pointer.on("buttondown", e => this.onPointerEvent(e));
        this.leftButton = this.pointer.button(0);
        this.middleButton = this.pointer.button(1);
        this.rightButton = this.pointer.button(2);

        this.onToolsetChange = this.onToolsetChange.bind(this);
        this.onViewChange = this.onViewChange.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onSettingChange = this.onSettingChange.bind(this);
    }

    get statusText() {
        return this.visible ? `${Math.round(this.position.x)}, ${Math.round(this.position.y)}` : "";
    }

    get visible() {
        return !!this._visible;
    }

    set visible(value) {
        if (this.visible !== value) {
            this._visible = value;
            this.emit("visibilitychange");
        }
    }

    get x() {
        return this.position.x;
    }

    get y() {
        return this.position.y;
    }

    onActivate() {
        Settings.on("change", this.onSettingChange);
        this.editor.toolset.on("statuschange", this.onToolsetChange);
        this.editor.view.on("change", this.onViewChange);
        this.editor.element.addEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
        this.pointer.dragThreshold = cfg("editor.drag-threshold");
        this.pointer.activate(this.editor.element);
    }

    onDeactivate() {
        Settings.off("change", this.onSettingChange);
        this.editor.toolset.off("statuschange", this.onToolsetChange);
        this.editor.view.off("change", this.onViewChange);
        this.editor.element.removeEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
        this.pointer.deactivate();
    }

    onSettingChange(event) {
        if (event.setting === "editor.drag-threshold") {
            this.pointer.dragThreshold = cfg("editor.drag-threshold");
        }
    }

    onToolsetChange() {
        const current = this.image;
        this.image = this.editor.toolset.currentTool.cursorImage;
        this.editor.element.classList.remove(`cursor-${current}`);
        this.editor.element.classList.add(`cursor-${this.image}`);
    }

    onViewChange() {
        if (this.visible) {
            this.updatePosition();
        }
    }

    onPointerEvent(event) {
        if (event.mouseEvent) {
            this.clientX = event.mouseEvent.clientX;
            this.clientY = event.mouseEvent.clientY;
            this.updatePosition();
            this.visible = true;
        }
    }

    onMouseEnter() {
        this.visible = true;
    }

    onMouseLeave() {
        this.visible = false;
    }

    updatePosition() {
        const rect = this.editor.element.getBoundingClientRect();
        const pos = this.editor.view.canvasToMap(this.clientX - rect.left, this.clientY - rect.top);
        if (pos.x !== this.position.x || pos.y !== this.position.y) {
            this.position.x = pos.x;
            this.position.y = pos.y;
            this.emit("move");
        }
    }
}

Tool.registerPassive(CursorTool);
