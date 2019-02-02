import * as ui from "./ui/ui.js";
import { LayerNode } from "./map/layer.js";
import { ResourcesNode } from "./map/resources.js";

export class MapExplorer extends ui.TreeView {
    constructor(editor) {
        super();
        this.editor = editor;
        this.element.classList.add("map-explorer");
        this.itemsByNode = new WeakMap();
        this.addNode(this, this.editor.map).expanded = true;
        this.on("itemselect", e => this.onItemSelect(e.data));
        this.on("iconclick", e => this.onIconClick(e.data));
        this.editor.on("selectionchange", () => this.onEditorSelectionChange());
        this.editor.map.on("attributechange", e => this.onMapAttrChange(e));
        this.editor.map.on("visibilitychange", e => this.onVisibilityChange(e.target));
    }

    onMapAttrChange(event) {
        if (event.attribute === "text") {
            const node = event.target;
            this.itemsByNode.get(node).label.textContent = node.toString();
        }
    }

    onVisibilityChange(node) {
        this.itemsByNode.get(node).icon = node.visible ? "visible-icon" : "hidden-icon";;
    }

    onItemSelect(node) {
        if (node) {
            this.editor.selection.replace(new Set([node]));
        } else {
            this.editor.selection.clear();
        }
    }

    onIconClick(node) {
        if (node instanceof LayerNode) {
            node.visible = !node.visible;
        }
    }

    onEditorSelectionChange() {
        this.clearSelected();
        for (const node of this.editor.selection.nodes) {
            const li = this.itemsByNode.get(node).element;
            this.selected.add(li);
            li.classList.add("selected");
        }
    }

    addNode(parentItem, node) {
        const item = parentItem.addItem(new ui.TreeItem(node.toString(), node));
        this.itemsByNode.set(node, item);

        if (node instanceof LayerNode) {
            item.icon = node.visible ? "visible-icon" : "hidden-icon";
        } else if (["resources", "texture", "image"].includes(node.nodeName)) {
            item.icon = node.nodeName + "-icon";
        }

        for (const childNode of node.children()) {
            this.addNode(item, childNode);
        }

        return item;
    }
}
