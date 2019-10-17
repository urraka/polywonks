import { EventEmitter } from "../../common/event.js";
import { pascalToDash } from "../../common/format.js";
import { iter } from "../../common/iter.js";
import { Node } from "../../map/map.js";

export class Tool extends EventEmitter {
    constructor() {
        super();
        this.editor = null;
        this.attributes = new Map();
    }

    get activated() {
        return !!this.editor;
    }

    get status() {
        return this.activated ? this.statusText : "";
    }

    get statusText() {
        return "";
    }

    get cursorImage() {
        return "default";
    }

    attr(name, value) {
        return Node.prototype.attr.call(this, name, value);
    }

    activate(editor) {
        if (!editor) {
            throw new Error("Undefined editor object in Tool.activate(editor)");
        }

        if (!this.editor || this.editor !== editor) {
            this.deactivate();
            this.editor = editor;
            this.onActivate();
            this.emit("change");
            this.emit("statuschange");
        }
    }

    deactivate() {
        if (this.editor) {
            this.onDeactivate();
            this.editor = null;
            this.emit("change");
            this.emit("statuschange");
        }
    }

    reset() {
        if (this.editor) {
            const editor = this.editor;
            this.deactivate();
            this.activate(editor);
        }
    }

    onCommand() { }

    static get toolName() {
        return pascalToDash(this.name.replace(/Tool$/, ""));
    }

    static get tools() {
        return Tool._tools || (Tool._tools = new Map());
    }

    static get passiveTools() {
        return Tool._passiveTools || (Tool._passiveTools = new Map());
    }

    static register(tool) {
        Tool.tools.set(tool.toolName, tool);
    }

    static registerPassive(tool) {
        Tool.passiveTools.set(tool.toolName, tool);
    }

    static instantiate(tools) {
        const instances = new Map();
        iter(tools).each(([key, tool]) => instances.set(key, new tool()));
        return instances;
    }
}
