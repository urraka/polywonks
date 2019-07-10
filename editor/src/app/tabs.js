import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { Path } from "../common/path.js";
import { EventEmitter } from "../common/event.js";

export class EditorTabs extends EventEmitter {
    constructor(app) {
        super();
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

    addEditor(editor) {
        const prevPanel = this.tabView.activePanel;
        const prevEditor = this.activeEditor;
        const panel = this.tabView.addPanel(new ui.TabPanel(Path.filename(editor.saveName), editor));
        editor.on("historychange", this.onEditorHistoryChange.bind(this, editor, panel));
        if (prevPanel && prevEditor.openedAsDefault && !prevEditor.modified) {
            prevPanel.close();
        }
    }

    onEditorHistoryChange(editor, panel) {
        panel.title = Path.filename(editor.saveName);
        panel.modified = editor.modified;
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
        if (editor.modified) {
            event.preventDefault();
            ui.confirm("Closing", `Save changes to ${Path.filename(editor.saveName)}?`, "yes", result => {
                switch (result) {
                    case "yes":
                        editor.exec("save").then(() => event.panel.close());
                        break;
                    case "no":
                        editor.onSave();
                        event.panel.close();
                        break;
                }
            });
        }
    }

    onTabClose(event) {
        this.emit("close", { editor: event.panel.content });
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
            if (editor.modified) {
                event.preventDefault();
                event.returnValue = "";
                break;
            }
        }
    }
}
