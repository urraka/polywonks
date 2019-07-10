import { iter } from "../../common/iter.js";
import { Mat3x3 } from "../../common/matrix.js";
import { VertexNode, TriangleNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { EditorFunction } from "./base.js";
import { TransformFunction, FlipFunction, RotateFunction } from "./transform.js";

class TextureTransformFunction extends TransformFunction {
    *nodes() {
        for (const node of this.editor.selection.nodes) {
            if ((node instanceof VertexNode) && node.parentNode) {
                yield node;
            } else if (node instanceof TriangleNode) {
                yield* node.children("vertex");
            }
        }
    }

    onExec() {
        const command = new EditorCommand(this.editor);
        const transform = this.computeTransform(this.origin());
        const uvTransformsCache = new Map();
        for (const vertex of new Set(this.nodes())) {
            const uvTransform = this.uvTransform(uvTransformsCache, vertex.parentNode, transform);
            this.applyTransform(command, vertex, uvTransform);
        }
        this.editor.history.do(command);
    }

    uvTransform(uvTransformsCache, triangle, transform) {
        if (!uvTransformsCache.has(triangle)) {
            uvTransformsCache.set(triangle, this.computeUVTransform(triangle, transform));
        }
        return uvTransformsCache.get(triangle);
    }

    computeUVTransform(triangle, transform) {
        const [a, b, c] = iter(triangle.children("vertex")).map(vertex => ({
            x: transform.multiplyVectorX(vertex),
            y: transform.multiplyVectorY(vertex),
            u: vertex.u,
            v: vertex.v,
        }));

        return Mat3x3.triangleToTriangleTransform(
            a.x, a.y, b.x, b.y, c.x, c.y,
            a.u, a.v, b.u, b.v, c.u, c.v,
        );
    }

    applyTransform(command, vertex, uvTransform) {
        if (uvTransform) {
            command.attr(vertex, "u", uvTransform.multiplyVectorX(vertex));
            command.attr(vertex, "v", uvTransform.multiplyVectorY(vertex));
        }
    }
}

class TextureResetFunction extends TextureTransformFunction {
    onExec() {
        const command = new EditorCommand(this.editor);
        for (const vertex of new Set(this.nodes())) {
            const texture = vertex.parentNode.attr("texture");
            if (texture) {
                const w = texture.attr("width") || this.editor.textureInfo(texture).width;
                const h = texture.attr("height") || this.editor.textureInfo(texture).height;
                command.attr(vertex, "u", w !== 0 ? vertex.x / w : 0);
                command.attr(vertex, "v", h !== 0 ? vertex.y / h : 0);
            } else {
                command.attr(vertex, "u", 0);
                command.attr(vertex, "v", 0);
            }
        }
        this.editor.history.do(command);
    }
}

class TextureFlipFunction extends TextureTransformFunction {
    get scaleX() { return 1; }
    get scaleY() { return 1; }
    computeTransform(...args) {
        return FlipFunction.prototype.computeTransform.call(this, ...args);
    }
}

class TextureRotateFunction extends TextureTransformFunction {
    get rotationAngle() { return 0; }
    computeTransform(...args) {
        return RotateFunction.prototype.computeTransform.call(this, ...args);
    }
}

class TextureFlipHorizontalFunction extends TextureFlipFunction {
    get scaleX() { return -1; }
}

class TextureFlipVerticalFunction extends TextureFlipFunction {
    get scaleY() { return -1; }
}

class TextureRotate90CwFunction extends TextureRotateFunction {
    get rotationAngle() { return -0.5 * Math.PI; }
}

class TextureRotate90CcwFunction extends TextureRotateFunction {
    get rotationAngle() { return 0.5 * Math.PI; }
}

EditorFunction.register(TextureResetFunction);
EditorFunction.register(TextureFlipHorizontalFunction);
EditorFunction.register(TextureFlipVerticalFunction);
EditorFunction.register(TextureRotate90CwFunction);
EditorFunction.register(TextureRotate90CcwFunction);
