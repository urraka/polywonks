import * as ui from "./ui/ui.js";
import { cfg } from "./settings.js";

export class NewMapCommand extends ui.Command {
    execute() {
        this.app.open();
    }
}

export class ShowExplorerCommand extends ui.Command {
    execute() {
        this.app.sidebar.setActiveTab("sidebar-explorer");
    }
}

export class OpenFileCommand extends ui.Command {
    execute(params) {
        this.app.open(params.path);
    }
}

export class SaveCommand extends ui.Command {
    execute() {
        this.app.editor.save();
    }
}

export class SaveAsCommand extends ui.Command {
    execute() {
        this.app.editor.saveAs();
    }
}

export class ExportCommand extends ui.Command {
    execute() {
        this.app.editor.export();
    }
}

export class ExportAsCommand extends ui.Command {
    execute() {
        this.app.editor.exportAs();
    }
}

export class BrowseToGithubCommand extends ui.Command {
    execute() {
        window.open(cfg("app.github"));
    }
}

export class ResetViewportCommand extends ui.Command {
    execute() {
        this.app.editor.view.reset();
    }
}

export class ToggleGridCommand extends ui.Command {
    execute() {
        cfg("view.grid", !cfg("view.grid"));
    }

    get checked() {
        return cfg("view.grid");
    }
}

export class ToggleBackgroundCommand extends ui.Command {
    execute() {
        cfg("view.background", !cfg("view.background"));
    }

    get checked() {
        return cfg("view.background");
    }
}

export class ShowPolygonTextureCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "texture");
    }

    get checked() {
        return cfg("view.polygons") === "texture";
    }
}

export class ShowPolygonPlainCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "plain");
    }

    get checked() {
        return cfg("view.polygons") === "plain";
    }
}

export class ShowPolygonNoneCommand extends ui.Command {
    execute() {
        cfg("view.polygons", "none");
    }

    get checked() {
        return cfg("view.polygons") === "none";
    }
}

export class ToggleWireframeCommand extends ui.Command {
    execute() {
        cfg("view.wireframe", !cfg("view.wireframe"));
    }

    get checked() {
        return cfg("view.wireframe");
    }
}

export class UndoCommand extends ui.Command {
    execute() {
        this.app.editor.undo();
    }

    get enabled() {
        return this.app.editor.commandHistory.length > this.app.editor.undone;
    }
}

export class RedoCommand extends ui.Command {
    execute() {
        this.app.editor.redo();
    }

    get enabled() {
        return this.app.editor.undone > 0;
    }
}

export class RefreshExplorerCommand extends ui.Command {
    execute(params) {
        const explorer = this.app.sidebar.explorers.find(e => e.root === params.mount);
        if (explorer) {
            explorer.refresh();
        }
    }
}
