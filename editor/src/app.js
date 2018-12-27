import * as ui from "./ui.js";
import * as cmd from "./commands.js";
import * as fmt from "./format.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor.js";
import { Explorer } from "./explorer.js";
import { Path } from "./path.js";

export class App extends ui.Panel {
    static launch() {
        Object.keys(cmd).forEach(cmdType => {
            if (cmdType.endsWith("Command")) {
                const cmdName = fmt.pascalToDash(cmdType.replace(/Command$/, ""));
                ui.Command.add(cmdName, new cmd[cmdType]());
            }
        });

        window.app = new App();
    }

    constructor() {
        super("app");

        const titlebar = this.append(new ui.TitleBar());
        const clientArea = this.append(new ui.Panel("client-area"));
        const sidebar = clientArea.append(new ui.Panel("sidebar"));
        const mainView = clientArea.append(new ui.Panel("main-view"));

        this.createMenus(titlebar.menu);

        this.statusbar = this.append(new ui.Statusbar());
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("cursor", "right", 100, "right");
        this.statusbar.set("cursor", "0, 0");

        this.renderer = new Renderer();
        mainView.append(this.renderer.context.canvas);

        this.editor = new Editor(this.renderer);
        mainView.append(this.editor);

        const sidebarPanels = new ui.MultiPanelView();
        this.explorers = ["polydrive", "soldat", "library"].map(root => new Explorer(root));
        this.explorers.forEach(explorer => sidebarPanels.addPanel(explorer.root, explorer.tree));
        sidebar.append(sidebarPanels);

        window.addEventListener("resize", e => this.onResize(e));
        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));

        document.body.querySelector(".startup-loading").remove();
        document.body.append(this.element);
        this.onResize();
    }

    createMenus(menubar) {
        const menus = [
            ["File", [
                ["New Map"],
                ["Save"],
                ["Save As..."],
                [],
                ["Settings"],
            ]],
            ["Edit", [
                ["Undo", "undo"],
                ["Redo", "redo"],
            ]],
            ["View", [
                ["Reset Viewport", "reset-viewport"],
                [],
                ["Grid", "toggle-grid"],
                ["Background", "toggle-background"],
                ["Polygons", [
                    ["Texture", "show-polygon-texture"],
                    ["Plain Color", "show-polygon-plain"],
                    ["Hide", "show-polygon-none"],
                ]],
                ["Wireframe", "toggle-wireframe"],
            ]],
            ["Help", [
                ["Github", "browse-to-github"],
            ]],
        ];

        const create = (menu, submenu) => {
            for (const item of submenu) {
                if (item.length === 0) {
                    menu.addItem(new ui.MenuSeparator());
                } else if (item.length === 1 || typeof item[1] === "string") {
                    menu.addItem(new ui.MenuItem(item[0], item[1]));
                } else {
                    create(menu.addItem(new ui.MenuItem(item[0])), item[1]);
                }
            }
        };

        create(menubar, menus);
    }

    open(path) {
        const ext = Path.ext(path).toLowerCase();
        if (ext === ".pms" || ext === ".polywonks") {
            this.editor.load(path);
        }
    }

    status(name, value) {
        this.statusbar.set(name, value);
    }

    onResize() {
        this.renderer.width = this.editor.element.clientWidth;
        this.renderer.height = this.editor.element.clientHeight;
        this.editor.redraw();
    }

    onDrop(event) {
        event.preventDefault();
        if (event.dataTransfer.files.length) {
            const reader = new FileReader();
            reader.addEventListener("load", () => this.editor.loadFromBuffer(reader.result));
            reader.readAsArrayBuffer(event.dataTransfer.files[0]);
        }
    }

    onDragOver(event) {
        event.preventDefault();
    }

    onDragEnter(event) {
        event.preventDefault();
    }
}
