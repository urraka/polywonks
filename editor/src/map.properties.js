import * as PMS from "./pms/pms.js";
import * as ui from "./ui/ui.js";
import { LayerNode, ImageNode, TextureNode, WaypointNode } from "./map/map.js";

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
                    dataType = [...map.resources.children()].filter(node => node instanceof ImageNode);
                } else if (key === "texture") {
                    dataType = [...map.resources.children()].filter(node => node instanceof TextureNode);
                } else if (key === "waypoint") {
                    dataType = [...map.waypoints.children()].filter(node => node instanceof WaypointNode);
                }
            }

            this.addProperty(key, attr.value, dataType);
        }
    }
}
