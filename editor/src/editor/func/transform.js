import { iter } from "../../common/iter.js";
import { Mat2d } from "../../common/matrix.js";
import { normalizeAngle } from "../../common/math.js";
import { SceneryNode, LayerNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { EditorFunction } from "./base.js";

export class TransformFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.onCommandWillChange = this.onCommandWillChange.bind(this);
        this.editor.selection.on("change", () => this.emit("change"));
    }

    get enabled() {
        return !!iter(this.nodes()).first();
    }

    *nodes() {
        for (const node of this.editor.selection.nodes) {
            if (node !== this.editor.map && !(node instanceof LayerNode)) {
                yield* node.nodesTransformable();
            }
        }
    }

    handle() {
        const handle = this.editor.toolset.currentTool.handle;
        return handle && handle.visible ? handle : null;
    }

    origin() {
        const { x, y } = this.handle() || iter(this.nodes()).first();
        return { x, y };
    }

    onExec() {
        const command = new EditorCommand(this.editor);
        command.on("willchange", this.onCommandWillChange);
        const transform = this.computeTransform(this.origin());
        for (const node of new Set(this.nodes())) {
            this.applyTransform(command, node, transform);
        }
        this.editor.do(command);
    }

    onCommandWillChange(event) {
        const handle = this.handle();
        if (handle) {
            const { x, y } = handle;
            const command = event.target;
            command.once("change", () => handle.reset(x, y, handle.referenceNode));
        }
    }

    computeTransform(_origin) {
        throw new Error("Must implement");
    }

    applyTransform(command, node, transform) {
        command.attr(node, "x", transform.multiplyVectorX(node));
        command.attr(node, "y", transform.multiplyVectorY(node));
    }
}

export class FlipFunction extends TransformFunction {
    get scaleX() { return 1; }
    get scaleY() { return 1; }
    get sizeAttributeName() { return ""; }

    computeTransform({ x, y }) {
        return Mat2d.translate(x, y)
            .multiply(Mat2d.scale(this.scaleX, this.scaleY))
            .multiply(Mat2d.translate(-x, -y));
    }

    applyTransform(command, node, transform) {
        super.applyTransform(command, node, transform);
        if (node instanceof SceneryNode) {
            command.attr(node, this.sizeAttributeName, -node.attr(this.sizeAttributeName));
            command.attr(node, "rotation", normalizeAngle(-node.attr("rotation")));
        }
    }
}

export class RotateFunction extends TransformFunction {
    get rotationAngle() { return 0; }

    computeTransform({ x, y }) {
        return Mat2d.translate(x, y)
            .multiply(Mat2d.rotate(this.rotationAngle))
            .multiply(Mat2d.translate(-x, -y));
    }

    applyTransform(command, node, transform) {
        super.applyTransform(command, node, transform);
        if (node instanceof SceneryNode) {
            command.attr(node, "rotation", normalizeAngle(node.attr("rotation") + this.rotationAngle));
        }
    }
}

class FlipHorizontalFunction extends FlipFunction {
    get scaleX() { return -1; }
    get sizeAttributeName() { return "width"; }
}

class FlipVerticalFunction extends FlipFunction {
    get scaleY() { return -1; }
    get sizeAttributeName() { return "height"; }
}

class Rotate90CwFunction extends RotateFunction {
    get rotationAngle() { return -0.5 * Math.PI; }
}

class Rotate90CcwFunction extends RotateFunction {
    get rotationAngle() { return 0.5 * Math.PI; }
}

EditorFunction.register(FlipHorizontalFunction);
EditorFunction.register(FlipVerticalFunction);
EditorFunction.register(Rotate90CwFunction);
EditorFunction.register(Rotate90CcwFunction);
