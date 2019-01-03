import * as ui from "./ui.js";

export class MapExplorer extends ui.TreeView {
    constructor(map) {
        super();
        this.element.classList.add("map-explorer");

        if (map) {
            const root = this.addNode(this, map);
            root.expanded = true;
        }
    }

    addNode(parentItem, node) {
        const item = parentItem.addItem(new ui.TreeItem(node.attr("text") || node.nodeName, node));
        for (const childNode of node.children()) {
            this.addNode(item, childNode);
        }
        return item;
    }
}
