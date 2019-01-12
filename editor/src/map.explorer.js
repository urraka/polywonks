import * as ui from "./ui/ui.js";

export class MapExplorer extends ui.TreeView {
    constructor(editor) {
        super();
        this.element.classList.add("map-explorer");
        this.addNode(this, editor.map).expanded = true;
    }

    addNode(parentItem, node) {
        const item = parentItem.addItem(new ui.TreeItem(node.attr("text") || node.nodeName, node));
        for (const childNode of node.children()) {
            this.addNode(item, childNode);
        }
        return item;
    }
}
