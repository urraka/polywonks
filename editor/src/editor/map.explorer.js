import * as ui from "../ui/ui.js";
import { EventEmitter } from "../common/event.js";
import { LayerNode } from "../map/layer.js";

export class MapExplorer extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.tree = new ui.TreeView();
        this.element = this.tree.element;
        this.element.classList.add("map-explorer");
        this.itemsByNode = new WeakMap();

        const item = this.addNode(this.tree, this.editor.map);
        item.expanded = true;

        this.tree.on("itemiconclick", e => this.onTreeItemIconClick(e.item));
        this.tree.on("selectionchange", () => this.onTreeSelectionChange());
        this.editor.on("activelayerchange", () => this.updateActiveLayer());
        this.editor.selection.on("change", () => this.onEditorSelectionChange());
        this.editor.map.on("insert", e => this.onNodeInsert(e));
        this.editor.map.on("remove", e => this.onNodeRemove(e));
        this.editor.map.on("attributechange", e => this.onMapAttrChange(e));
        this.editor.map.on("visibilitychange", e => this.onVisibilityChange(e.target));

        this.updateActiveLayer();
    }

    updateActiveLayer() {
        const item = this.itemsByNode.get(this.editor.activeLayer || this.editor.map);
        const activeLayerItem = this.element.querySelector(".active-layer");
        if (activeLayerItem) activeLayerItem.classList.remove("active-layer");
        if (item) item.element.classList.add("active-layer");
    }

    onNodeInsert(event) {
        const parentItem = this.itemsByNode.get(event.target);
        const beforeItem = this.itemsByNode.get(event.node.nextSibling);
        this.addNode(parentItem, event.node, beforeItem);
    }

    onNodeRemove(event) {
        this.itemsByNode.get(event.node).remove();
        this.itemsByNode.delete(event.node);
    }

    onMapAttrChange(event) {
        if (event.attribute === "text") {
            const node = event.target;
            this.itemsByNode.get(node).text = node.toString();
        }
    }

    onVisibilityChange(node) {
        this.itemsByNode.get(node).icon = node.visible ? "visible-icon" : "hidden-icon";;
    }

    onTreeSelectionChange() {
        const selectedItem = this.tree.selectedItem;

        if (selectedItem) {
            this.editor.selection.replace(new Set([selectedItem.data]));
        } else {
            this.editor.selection.clear();
        }
    }

    onTreeItemIconClick(item) {
        const node = item.data;
        if (node instanceof LayerNode) {
            node.visible = !node.visible;
        }
    }

    onEditorSelectionChange() {
        this.tree.clearSelected();
        for (const node of this.editor.selection.nodes) {
            this.itemsByNode.get(node).selected = true;
        }
    }

    addNode(parentItem, node, beforeItem = null) {
        const item = parentItem.addItem(new ui.TreeItem(node.toString(), node), beforeItem);
        this.itemsByNode.set(node, item);
        item.selected = this.editor.selection.nodes.has(node);

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
