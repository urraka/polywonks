import { Color } from "../../common/color.js";
import { iter } from "../../common/iter.js";
import { SceneryNode, Attribute, PivotNode, ImageNode } from "../../map/map.js";
import { Renderer } from "../../app/render.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class SceneryTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("image", new Attribute("node", null));
        this.onNodeInsert = this.onNodeInsert.bind(this);
    }

    get text() {
        return "Scenery";
    }

    get statusText() {
        return "Create scenery";
    }

    onActivate() {
        super.onActivate();
        this.setDefaultAttribute("image");
        this.editor.map.on("insert", this.onNodeInsert);
    }

    onDeactivate() {
        super.onDeactivate();
        this.editor.map.off("insert", this.onNodeInsert);
    }

    onNodeInsert(event) {
        if (!this.attr("image") && (event.node instanceof ImageNode)) {
            this.setDefaultAttribute("image");
        }
    }

    createNode() {
        const scenery = new SceneryNode();
        scenery.append(new PivotNode());
        return scenery;
    }

    updateNode() {
        const image = this.attr("image");
        if (image) {
            this.node.attr("image", image);
            this.node.attr("x", this.handle.x);
            this.node.attr("y", this.handle.y);
            this.node.attr("width", image.attr("width") || Renderer.textureInfo(image).width);
            this.node.attr("height", image.attr("height") || Renderer.textureInfo(image).height);
            this.node.attr("color", this.attr("color"));
        }
    }

    updateHandle() {
        super.updateHandle();
        this.handle.visible = this.handle.visible && !!this.attr("image");
    }

    chooseDefaultLayer() {
        const layers = iter(this.editor.map.children("layer"));
        return layers.find(layer => layer.attr("type") === "scenery-middle") || super.chooseDefaultLayer();
    }
}

Tool.register(SceneryTool);
