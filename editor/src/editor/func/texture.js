import { iter } from "../../common/iter.js";
import { VertexNode, TriangleNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { EditorFunction } from "./base.js";

class TextureTransformFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", () => this.emit("change"));
    }

    get enabled() {
        return !!iter(this.nodes()).first();
    }

    *nodes() {
        for (const node of this.editor.selection.nodes) {
            if (node instanceof VertexNode) {
                yield node;
            } else if (node instanceof TriangleNode) {
                yield* node.children("vertex");
            }
        }
    }
}

class TextureResetFunction extends TextureTransformFunction {
    onExec() {
        const command = new EditorCommand(this.editor);
        for (const node of new Set(this.nodes())) {
            const texture = node.parentNode && node.parentNode.attr("texture");
            if (texture) {
                const w = texture.attr("width") || this.editor.textureInfo(texture).width;
                const h = texture.attr("height") || this.editor.textureInfo(texture).height;
                command.attr(node, "u", w !== 0 ? node.x / w : 0);
                command.attr(node, "v", h !== 0 ? node.y / h : 0);
            } else {
                command.attr(node, "u", 0);
                command.attr(node, "v", 0);
            }
        }
        this.editor.do(command);
    }
}

class TextureFlipFunction extends TextureTransformFunction {
    get enabled() { return false; }
}

class TextureRotateFunction extends TextureTransformFunction {
    get enabled() { return false; }
}

class TextureFlipHorizontalFunction extends TextureFlipFunction { }
class TextureFlipVerticalFunction extends TextureFlipFunction { }
class TextureRotate90CwFunction extends TextureRotateFunction { }
class TextureRotate90CcwFunction extends TextureRotateFunction { }

EditorFunction.register(TextureResetFunction);
EditorFunction.register(TextureFlipHorizontalFunction);
EditorFunction.register(TextureFlipVerticalFunction);
EditorFunction.register(TextureRotate90CwFunction);
EditorFunction.register(TextureRotate90CcwFunction);
