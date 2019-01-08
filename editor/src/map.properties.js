import * as ui from "./ui/ui.js";

export class MapProperties extends ui.PropertySheet {
    constructor(editor) {
        super();
        this.element.classList.add("map-properties");
        this.editor = editor;
        this.node = null;
        this.on("propertychange", e => this.onPropertyChange(e));
        if (this.editor) {
            this.editor.on("selectionchange", () => this.onSelectionChange());
        }
    }

    onPropertyChange(event) {
        this.node.attr(event.property.key, event.property.value);
    }

    onSelectionChange() {
        this.clear();
        this.node = this.editor.selection.nodes.values().next().value || this.editor.map;
        for (const [key, attr] of this.node.attributes) {
            this.addProperty(key, attr.value, attr.dataType);
        }
    }
}
