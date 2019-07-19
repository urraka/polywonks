import * as ui from "../ui/ui.js";
import * as PMS from "../pms/pms.js";
import { iter } from "../common/iter.js";
import { EventEmitter } from "../common/event.js";
import { Property } from "../app/property.js";
import { LayerNode } from "../map/map.js";
import { EditCommand } from "./edit.js";

export class MapProperties extends EventEmitter {
    constructor(editor) {
        super();
        this.sheet = new ui.PropertySheet();
        this.element = this.sheet.element;
        this.element.classList.add("map-properties");
        this.editor = editor;
        this.onAttributeChange = this.onAttributeChange.bind(this);
        this.sheet.on("propertyinput", e => this.onPropertyInput(e));
        this.sheet.on("propertychange", e => this.onPropertyChange(e));
        this.editor.selection.on("change", () => this.onSelectionChange());
        this.editor.map.on("attributechange", this.onAttributeChange);
        this.command = null;
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

    onPropertyChange({ property }) {
        this.changeValue(property.key, property.value);
        this.command = null;
    }

    onPropertyInput({ property }) {
        this.changeValue(property.key, property.currentValue);
    }

    onSelectionChange() {
        this.command = null;
        this.node = iter(this.editor.selection.nodes).first() || this.editor.map;
    }

    changeValue(key, value) {
        this.editor.map.off("attributechange", this.onAttributeChange);
        if (this.command) this.editor.history.undo(this.command);
        this.command = new EditCommand(this.editor);
        const type = this.node.attributes.get(key).dataType;
        const layer = this.node.closest("layer");
        const selection = this.editor.selection;
        const sameLayerType = (node) => {
            const nodeLayer = node.closest("layer");
            return nodeLayer && nodeLayer.attr("type") === layer.attr("type");
        };
        for (const node of (selection.nodes.size > 0 ? selection.nodes : [this.node])) {
            if (node.attributes.has(key) && node.attributes.get(key).dataType === type &&
                (type !== PMS.PolyType || sameLayerType(node))
            ) {
                this.command.attr(node, key, value);
            }
        }
        this.command = this.editor.history.do(this.command);
        this.editor.map.on("attributechange", this.onAttributeChange);
    }
}
