import * as PMS from "./pms/pms.js";
import * as ui from "./ui/ui.js";
import { EventEmitter } from "./support/event.js";
import { LayerNode, ImageNode, TextureNode, WaypointNode } from "./map/map.js";
import { AttributeChangeCommand } from "./editor.commands.js";

export class MapProperties extends EventEmitter {
    constructor(editor) {
        super();
        this.sheet = new ui.PropertySheet();
        this.element = this.sheet.element;
        this.element.classList.add("map-properties");
        this.editor = editor;
        this.node = null;
        this.sheet.on("propertychange", e => this.onPropertyChange(e));
        this.editor.on("selectionchange", () => this.onSelectionChange());
        this.editor.map.on("attributechange", e => this.onAttributeChange(e));
    }

    onAttributeChange(event) {
        if (event.target === this.node && this.sheet.properties[event.attribute]) {
            this.sheet.properties[event.attribute].reset(this.node.attr(event.attribute));
        }
    }

    onPropertyChange(event) {
        const key = event.property.key;
        const value = event.property.value;
        const type = this.node.attributes.get(key).dataType;
        const layer = this.node.filter(this.node.ancestors(), LayerNode).next().value;
        const command = new AttributeChangeCommand(this.editor);
        const selection = this.editor.selection;

        const sameLayerType = (node) => {
            const nodeLayer = node.filter(node.ancestors(), LayerNode).next().value;
            return nodeLayer && nodeLayer.attr("type") === layer.attr("type");
        };

        for (const node of (selection.nodes.count > 0 ? selection.nodes : [this.node])) {
            if (node.attributes.has(key) && node.attributes.get(key).dataType === type &&
                (type !== PMS.PolyType || sameLayerType(node))
            ) {
                command.attr(node, key, value);
            }
        }

        if (command.hasChanges) {
            this.editor.do(command);
        }
    }

    onSelectionChange() {
        this.sheet.clear();
        this.node = this.editor.selection.nodes.values().next().value || this.editor.map;
        const layer = this.node.filter(this.node.ancestors(), LayerNode).next().value;

        for (const [key, attr] of this.node.attributes) {
            let dataType = attr.dataType;

            if (layer && dataType === PMS.PolyType) {
                if (layer.attr("type") === "polygons-back") {
                    dataType = PMS.PolyType.filter(v => {
                        return v === PMS.PolyType.Background || v === PMS.PolyType.BackgroundTransition;
                    });
                } else {
                    dataType = PMS.PolyType.filter(v => {
                        return v !== PMS.PolyType.Background && v !== PMS.PolyType.BackgroundTransition;
                    });
                }
            } else if (dataType === "node") {
                const map = this.editor.map;

                if (key === "image") {
                    dataType = [...map.resources.descendants()].filter(node => node instanceof ImageNode);
                } else if (key === "texture") {
                    dataType = [...map.resources.descendants()].filter(node => node instanceof TextureNode);
                } else if (key === "waypoint") {
                    dataType = [...map.waypoints.children()].filter(node => node instanceof WaypointNode);
                }
            }

            this.sheet.addProperty(key, attr.value, dataType);
        }

        this.emit("nodechange");
    }
}
