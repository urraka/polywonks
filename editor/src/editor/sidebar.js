import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { Keybindings } from "../app/keybindings.js";
import { MapExplorer } from "./map.explorer.js";
import { MapProperties } from "./map.properties.js";
import { ToolPropertiesItem } from "./tool.properties.js";

export class EditorSidebar {
    constructor(editor) {
        this.editor = editor;
        this.panels = new ui.MultiPanelView();
        this.panels.element.classList.add("editor-sidebar-panels");
        this.tools = this.panels.addPanel(null, new ui.ListView());
        this.explorer = this.panels.addPanel("Map", new MapExplorer(editor));
        this.properties = this.panels.addPanel("Map Properties", new MapProperties(editor));

        const bindings = Keybindings.findAll("set-tool");
        for (const [key, tool] of editor.toolset.tools) {
            const item = new ui.ListViewItem(tool.text, tool);
            const binding = bindings.find(b => b.params.tool === key);
            this.tools.content.addItem(item);
            if (binding) {
                item.keyBinding = binding.keys;
            }
            if (tool.attributes.size > 0) {
                this.tools.content.addItem(new ToolPropertiesItem(editor, tool));
            }
            if (tool === editor.toolset.currentTool) {
                this.tools.content.activeItem = item;
            }
        }

        this.properties.content.on("nodechange", () => this.onPropertiesNodeChange());
        this.tools.content.on("itemclick", e => this.onToolItemClick(e));
        this.editor.toolset.on("activetoolchange", () => this.onActiveToolChange());
    }

    get element() {
        return this.panels.element;
    }

    get attached() {
        return !!this.element.parentElement;
    }

    get active() {
        return this.element.classList.contains("active");
    }

    set active(value) {
        return this.element.classList.toggle("active", !!value);
    }

    onPropertiesNodeChange() {
        const props = this.properties.content;
        this.properties.header.title = props.node.nodeName + " properties";
    }

    onToolItemClick(event) {
        this.editor.toolset.currentTool = event.item.data;
    }

    onActiveToolChange() {
        const list = this.tools.content;
        list.activeItem = iter(list.items()).find(item => item.data === this.editor.toolset.currentTool);
    }
}
