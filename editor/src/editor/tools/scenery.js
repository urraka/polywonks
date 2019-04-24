import { iter } from "../../support/iter.js";
import { Color } from "../../support/color.js";
import { SceneryNode, Attribute, PivotNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { CreateTool } from "./create.js";

export class SceneryTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("image", new Attribute("node", null));
    }

    get status() {
        if (!this.targetLayer) {
            return "Select a layer";
        } else {
            return "Create scenery";
        }
    }

    onActivate() {
        super.onActivate();
        this.updateScenery();
    }

    onAttrChange() {
        this.updateScenery();
        this.editor.redraw();
    }

    onPointerBegin() {
        if (this.targetLayer && this.handle.visible) {
            this.beginEditing();
            this.editor.selection.clear();
            const command = new EditorCommand(this.editor);
            command.insert(this.targetLayer, null, this.node);
            const image = this.node.attr("image");
            if (image && !iter(this.editor.map.resources.descendants("image")).includes(image)) {
                command.insert(this.editor.map.resources, null, image);
            }
            this.editor.do(command);
            this.endEditing();
        }
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.updateScenery();
        this.editor.redraw();
    }

    createNode() {
        const scenery = new SceneryNode();
        scenery.append(new PivotNode());
        return scenery;
    }

    updateScenery() {
        const image = this.attr("image");
        if (image) {
            this.node.attr("image", image);
            this.node.attr("x", this.handle.x);
            this.node.attr("y", this.handle.y);
            this.node.attr("width", image.attr("width") || this.editor.renderer.textureInfo(image).width);
            this.node.attr("height", image.attr("height") || this.editor.renderer.textureInfo(image).height);
            this.node.attr("color", this.attr("color"));
        }
    }

    updateHandle() {
        super.updateHandle();
        this.handle.visible = this.handle.visible && !!this.attr("image");
    }
}
