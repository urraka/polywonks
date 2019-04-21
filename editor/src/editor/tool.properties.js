import * as ui from "../ui/ui.js";

export class ToolPropertiesItem extends ui.ListViewItem {
    constructor(editor, tool) {
        super("");
        this.editor = editor;
        this.tool = tool;
        this.sheet = new ui.PropertySheet();
        this.element.classList.add("tool-properties");
        this.element.append(this.sheet.element);
        this.editor.map.on("insert", e => this.onNodeInsertOrRemove(e));
        this.editor.map.on("remove", e => this.onNodeInsertOrRemove(e));
        this.tool.on("attributechange", e => this.onToolAttrChange(e));
        this.sheet.on("propertychange", e => this.onPropertyChange(e));
        this.reset();
    }

    onNodeInsertOrRemove(event) {
        if (event.target === this.editor.map.resources) {
            this.reset();
        }
    }

    onToolAttrChange(event) {
        this.sheet.properties[event.attribute].reset(this.tool.attr(event.attribute));
    }

    onPropertyChange(event) {
        const { key, value } = event.property;
        this.tool.attr(key, value);
    }

    reset() {
        this.sheet.clear();
        for (const [key, attr] of this.tool.attributes) {
            let dataType = attr.dataType;
            if (dataType === "node") {
                const map = this.editor.map;
                if (key === "image") {
                    dataType = [...map.resources.descendants("image")];
                } else if (key === "texture") {
                    dataType = [null, ...map.resources.descendants("texture")];
                }
            }
            this.sheet.addProperty(key, attr.value, dataType, key);
        }
    }
}
