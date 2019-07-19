import { EventEmitter } from "../common/event.js";
import { Command } from "../app/command.js";
import { Tool } from "./tools/tool.js";
import "./tools/cursor.js";
import "./tools/pan.js";
import "./tools/zoom.js";
import "./tools/select.js";
import "./tools/select.commands.js";
import "./tools/move.objects.js";
import "./tools/move.texture.js";
import "./tools/move.commands.js";
import "./tools/paint.js";
import "./tools/paint.commands.js";
import "./tools/polygon.js";
import "./tools/scenery.js";
import "./tools/spawn.js";
import "./tools/collider.js";
import "./tools/waypoint.js";
import "./tools/connection.js";

export class Toolset extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.tools = Tool.instantiate(Tool.tools);
        this.passiveTools = Tool.instantiate(Tool.passiveTools);
        this.defineGetters();
        this.onToolChange = () => this.emit("toolstatechange");
        this.onToolStatusChange = () => this.emit("statuschange");
        this.currentTool = this.tools.get("select");
    }

    get status() {
        return this.currentTool.status;
    }

    get currentTool() {
        return this._currentTool;
    }

    set currentTool(tool) {
        const prevTool = this.currentTool;
        const activated = this.currentTool && this.currentTool.activated;
        if (this.currentTool) {
            this.currentTool.deactivate();
            this.currentTool.off("change", this.onToolChange);
            this.currentTool.off("statuschange", this.onToolStatusChange);
        }
        this._currentTool = tool;
        this.currentTool.on("change", this.onToolChange);
        this.currentTool.on("statuschange", this.onToolStatusChange);
        if (this.currentTool !== prevTool) {
            this.emit("activetoolchange");
        }
        if (activated) {
            this.currentTool.activate(this.editor);
        }
    }

    activate() {
        this.passiveTools.forEach(tool => tool.activate(this.editor));
        this.currentTool.activate(this.editor);
    }

    deactivate() {
        this.currentTool.deactivate();
        this.passiveTools.forEach(tool => tool.deactivate(this.editor));
    }

    defineGetters() {
        for (const [name, tool] of this.allTools()) {
            if (!(name in this)) {
                Object.defineProperty(this, name, {
                    get() { return tool; }
                });
            }
        }
    }

    *allTools() {
        for (const entry of this.passiveTools) yield entry;
        for (const entry of this.tools) yield entry;
    }

    *commandProviders() {
        for (const [,tool] of this.allTools()) {
            if (tool.activated && Command.isProvider(tool)) {
                yield tool;
            }
        }
    }

    dispose() {
        for (const [,tool] of this.allTools()) {
            if (Command.isProvider(tool)) {
                Command.dispose(tool);
            }
        }
    }
}
