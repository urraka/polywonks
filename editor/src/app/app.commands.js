import { Command } from "./command.js";
import { cfg, Settings } from "./settings.js";
import { App } from "./app.js";

class AppCommand extends Command {
    get app() {
        return this.provider;
    }

    static register(CommandClass) {
        Command.register(App, CommandClass);
    }
}

class NewMapCommand extends AppCommand {
    onExec() {
        this.app.openDefault();
        this.app.sidebar.activeTab = "sidebar-tools";
    }
}

class ShowExplorerCommand extends AppCommand {
    onExec() {
        this.app.sidebar.activeTab = "sidebar-explorer";
    }
}

class BrowseToGithubCommand extends AppCommand {
    onExec() {
        window.open(cfg("app.github"));
    }
}

class SettingCommand extends AppCommand {
    constructor(setting, ...args) {
        super(...args);
        this.setting = setting;
        Settings.on("change", e => this.onSettingChange(e));
    }

    onSettingChange(event) {
        if (event.setting === this.setting) {
            this.emitChange();
        }
    }
}

class ToggleSettingCommand extends SettingCommand {
    get checked() {
        return cfg(this.setting);
    }

    onExec() {
        cfg(this.setting, !cfg(this.setting));
    }
}

class ToggleSnapToGridCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("editor.snap-to-grid", ...args);
    }
}

class ToggleSnapToObjectsCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("editor.snap-to-objects", ...args);
    }
}

class ToggleGridCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("view.grid", ...args);
    }
}

class ToggleBackgroundCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("view.background", ...args);
    }
}

class ToggleVerticesCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("view.vertices", ...args);
    }
}

class ToggleWireframeCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("view.wireframe", ...args);
    }
}

class ToggleRestrictSelectionCommand extends ToggleSettingCommand {
    constructor(...args) {
        super("editor.restrict-selection", ...args);
    }
}

class SwitchSettingCommand extends SettingCommand {
    constructor(setting, value, ...args) {
        super(setting, ...args);
        this.value = value;
    }

    get checked() {
        return cfg(this.setting) === this.value;
    }

    onExec() {
        cfg(this.setting, this.value);
    }
}

class ShowPolygonTextureCommand extends SwitchSettingCommand {
    constructor(...args) {
        super("view.polygons", "texture", ...args);
    }
}

class ShowPolygonPlainCommand extends SwitchSettingCommand {
    constructor(...args) {
        super("view.polygons", "plain", ...args);
    }
}

class ShowPolygonNoneCommand extends SwitchSettingCommand {
    constructor(...args) {
        super("view.polygons", "none", ...args);
    }
}

AppCommand.register(NewMapCommand);
AppCommand.register(ShowExplorerCommand);
AppCommand.register(BrowseToGithubCommand);
AppCommand.register(ToggleSnapToGridCommand);
AppCommand.register(ToggleSnapToObjectsCommand);
AppCommand.register(ToggleGridCommand);
AppCommand.register(ToggleBackgroundCommand);
AppCommand.register(ToggleVerticesCommand);
AppCommand.register(ToggleWireframeCommand);
AppCommand.register(ToggleRestrictSelectionCommand);
AppCommand.register(ShowPolygonTextureCommand);
AppCommand.register(ShowPolygonPlainCommand);
AppCommand.register(ShowPolygonNoneCommand);
