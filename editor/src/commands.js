import * as ui from "./ui.js";
import { cfg } from "./settings.js";

export class NewMapCommand extends ui.Command {
    execute() {
        app.open();
    }
}

export class BrowseToGithubCommand extends ui.Command {
    execute() {
        window.open(cfg("app.github"));
    }
}

export class ResetViewportCommand extends ui.Command {
    execute() {
        app.editor.view.reset();
    }
}

export class ToggleGridCommand extends ui.Command {
    execute() {
        cfg("view.grid", !cfg("view.grid"));
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.grid");
    }
}

export class ToggleBackgroundCommand extends ui.Command {
    execute() {
        cfg("view.background", !cfg("view.background"));
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.background");
    }
}

export class ShowPolygonTextureCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "texture");
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.polygons") === "texture";
    }
}

export class ShowPolygonPlainCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "plain");
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.polygons") === "plain";
    }
}

export class ShowPolygonNoneCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "none");
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.polygons") === "none";
    }
}

export class ToggleWireframeCommand extends ui.Command {
    execute() {
        cfg("view.wireframe", !cfg("view.wireframe"));
        app.editor.redraw();
    }

    get checked() {
        return cfg("view.wireframe");
    }
}

export class UndoCommand extends ui.Command {
    execute() {
        app.editor.undo();
    }

    get enabled() {
        return app.editor.commandHistory.length > app.editor.undone;
    }
}

export class RedoCommand extends ui.Command {
    execute() {
        app.editor.redo();
    }

    get enabled() {
        return app.editor.undone > 0;
    }
}
