import * as ui from "./ui.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor.js";
import { Explorer } from "./explorer.js";
import { Path } from "./path.js";

export class App extends ui.Panel {
    static launch() {
        window.app = new App();
    }

    constructor() {
        super("app");
        this.splitView = new ui.SplitView(300);
        this.sidebar = this.splitView.panels[0];
        this.mainView = this.splitView.panels[1];

        this.statusbar = new ui.Statusbar();
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("cursor", "right", 100);
        this.statusbar.set("cursor", "0, 0");

        this.append(this.splitView);
        this.append(this.statusbar);

        this.renderer = new Renderer();
        this.editor = new Editor(this.renderer);
        this.explorers = ["polydrive", "soldat", "library"].map(root => new Explorer(root));

        this.mainView.append(this.renderer.context.canvas);
        this.mainView.append(this.editor);
        this.explorers.forEach(explorer => this.sidebar.append(explorer));

        document.body.querySelector(".startup-loading").remove();
        document.body.append(this.element);

        window.addEventListener("resize", e => this.onResize(e));
        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));

        this.onResize();
        this.explorers.forEach(explorer => explorer.refesh());
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
