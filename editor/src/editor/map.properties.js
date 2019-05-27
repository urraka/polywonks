import * as PMS from "../pms/pms.js";
import * as ui from "../ui/ui.js";
import { iter } from "../support/iter.js";
import { EventEmitter } from "../support/event.js";
import { EditorCommand } from "./command.js";
import { LayerNode } from "../map/map.js";
import { Property } from "../property.js";

export class MapProperties extends EventEmitter {
    constructor(editor) {
        super();
        this.sheet = new ui.PropertySheet();
        this.element = this.sheet.element;
        this.element.classList.add("map-properties");
        this.editor = editor;
        this.sheet.on("propertychange", e => this.onPropertyChange(e));
        this.editor.on("selectionchange", () => this.onSelectionChange());
        this.editor.map.on("attributechange", e => this.onAttributeChange(e));
        this.node = this.editor.map;
    }

    get node() {
        return this._node;
    }

    set node(node) {
        this._node = node;
        this.sheet.clear();
        for (const [key, attr] of this.node.attributes) {
            const property = Property.item(key, key, attr.dataType, attr.value, this.node, this.editor.map);
            if ((this.node instanceof LayerNode) && key === "type") {
                property.readOnly = true;
            }
            this.updateProperty(property);
            this.sheet.addProperty(property);
        }
        this.emit("nodechange");
    }

    updateProperty(property) {
        property.reset(this.node.attr(property.key));
        if (property.key === "text") {
            property.placeholder = this.node.defaultText;
        }
    }

    onAttributeChange(event) {
        const property = this.sheet.properties[event.attribute];
        if (event.target === this.node && property) {
            this.updateProperty(property);
        }
    }

    onPropertyChange(event) {
        const key = event.property.key;
        const value = event.property.value;
        const type = this.node.attributes.get(key).dataType;
        const layer = this.node.closest("layer");
        const command = new EditorCommand(this.editor);
        const selection = this.editor.selection;

        const sameLayerType = (node) => {
            const nodeLayer = node.closest("layer");
            return nodeLayer && nodeLayer.attr("type") === layer.attr("type");
        };

        for (const node of (selection.nodes.size > 0 ? selection.nodes : [this.node])) {
            if (node.attributes.has(key) && node.attributes.get(key).dataType === type &&
                (type !== PMS.PolyType || sameLayerType(node))
            ) {
                command.attr(node, key, value);
            }
        }

        this.editor.do(command);
    }

    onSelectionChange() {
        this.node = iter(this.editor.selection.nodes).first() || this.editor.map;
    }
}
