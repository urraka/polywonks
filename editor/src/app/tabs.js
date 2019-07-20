import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { Path } from "../common/path.js";
import { EventEmitter } from "../common/event.js";

export class EditorTabs extends EventEmitter {
    constructor(app) {
        super();
        this.defaultEditor = null;
        this.tabView = new ui.TabView();
        this.tabView.content.element.prepend(app.renderer.context.canvas);
        this.tabView.on("willchange", e => this.onTabWillChange(e));
        this.tabView.on("change", e => this.onTabChange(e));
        this.tabView.on("willclose", e => this.onTabWillClose(e));
        this.tabView.on("close", e => this.onTabClose(e));
        window.addEventListener("resize", () => this.onResize());
        window.addEventListener("beforeunload", e => this.onBeforeUnload(e));
        ui.Dialog.on("modalstart", () => this.onModalStart());
        ui.Dialog.on("modalend", () => this.onModalEnd());
    }

    get element() {
        return this.tabView.element;
    }

    get activeEditor() {
        const activePanel = this.tabView.activePanel;
        return activePanel ? activePanel.content : null;
    }

    get editors() {
        return iter(this.tabView.panels()).map(panel => panel.content);
    }

    get editorCount() {
        return this.tabView.count;
    }

    addEditor(editor, defaultEditor = false) {
        const prevPanel = this.tabView.activePanel;
        const prevEditor = this.activeEditor;
        const panel = this.tabView.addPanel(new ui.TabPanel(Path.filename(editor.history.saveName), editor));
        editor.history.on("change", this.onEditorHistoryChange.bind(this, editor, panel));
        if (defaultEditor) {
            this.defaultEditor = editor;
        } else if (prevEditor && prevEditor === this.defaultEditor) {
            prevPanel.close();
        }
    }

    onEditorHistoryChange(editor, panel) {
        panel.title = Path.filename(editor.history.saveName);
        panel.modified = editor.history.modified;
        if (editor === this.defaultEditor) {
            this.defaultEditor = null;
        }
    }

    onTabWillChange() {
        const editor = this.activeEditor;
        if (editor) editor.deactivate();
    }

    onTabChange() {
        this.emit("change");
        if (!ui.Dialog.activeDialog) {
            this.activeEditor.activate();
        }
    }

    onTabWillClose(event) {
        const editor = event.panel.content;
        if (editor.history.modified) {
            event.preventDefault();
            ui.confirm("Closing", `Save changes to ${Path.filename(editor.history.saveName)}?`, "yes", result => {
                switch (result) {
                    case "yes":
                        editor.exec("save").then(() => event.panel.close());
                        break;
                    case "no":
                        editor.history.modified = false;
                        event.panel.close();
                        break;
                }
            });
        }
    }

    onTabClose(event) {
        const editor = event.panel.content;
        editor.deactivate();
        editor.dispose();
        this.emit("close", { editor });
    }

    onModalStart() {
        this.activeEditor.deactivate();
    }

    onModalEnd() {
        this.activeEditor.activate();
    }

    onResize() {
        iter(this.editors).each(editor => editor.onResize());
    }

    onBeforeUnload(event) {
        for (const editor of this.editors) {
            if (editor.history.modified) {
                event.preventDefault();
                event.returnValue = "";
                break;
            }
        }
    }
}
