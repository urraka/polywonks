import { EditorFunction } from "./base.js";

class TextureTransformFunction extends EditorFunction {
    get enabled() { return false; }
}

class TextureResetFunction extends TextureTransformFunction { }
class TextureFlipHorizontalFunction extends TextureTransformFunction { }
class TextureFlipVerticalFunction extends TextureTransformFunction { }
class TextureRotate90CwFunction extends TextureTransformFunction { }
class TextureRotate90CcwFunction extends TextureTransformFunction { }

EditorFunction.register(TextureResetFunction);
EditorFunction.register(TextureFlipHorizontalFunction);
EditorFunction.register(TextureFlipVerticalFunction);
EditorFunction.register(TextureRotate90CwFunction);
EditorFunction.register(TextureRotate90CcwFunction);
