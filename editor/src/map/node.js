import { EventEmitter, Event } from "../common/event.js";
import { ValueType } from "../common/type.js";
import { capitalize } from "../common/format.js";
import { Attribute } from "./attribute.js";

export class Node extends EventEmitter {
    constructor() {
        super();
        this.id = null;
        this.owner = null;
        this.parentNode = null;
        this.firstChild = null;
        this.lastChild = null;
        this.nextSibling = null;
        this.previousSibling = null;
        this.attributes = new Map();
        this.attributes.set("text", new Attribute("string", ""));
    }

    get nodeName() {
        return "#node";
    }

    get defaultText() {
        return capitalize(this.nodeName) + (this.id ? " #" + this.id.split("#").pop() : "");
    }

    toString() {
        return this.attr("text") || this.defaultText;
    }

    emit(...args) {
        let event = args[0];
        if (!(event instanceof Event)) {
            const [type, data = null, target = this] = args;
            event = new Event(type, data, target);
        }

        super.emit(event);
        if (this.parentNode) {
            this.parentNode.emit(event);
        }
    }

    attr(name, value) {
        const attribute = this.attributes.get(name);

        if (!attribute) {
            throw new Error("Invalid attribute");
        }

        if (value === undefined) {
            return attribute.value;
        } else {
            const val = attribute.value;
            attribute.value = value;

            if (!ValueType.equals(attribute.dataType, val, attribute.value)) {
                this.emit("attributechange", { attribute: name });
                this.emit("change");
            }
        }
    }

    remove() {
        if (this.parentNode) {
            if (this.parentNode.firstChild === this) {
                this.parentNode.firstChild = this.nextSibling;
            }
            if (this.parentNode.lastChild === this) {
                this.parentNode.lastChild = this.previousSibling;
            }
            if (this.previousSibling) {
                this.previousSibling.nextSibling = this.nextSibling;
            }
            if (this.nextSibling) {
                this.nextSibling.previousSibling = this.previousSibling;
            }

            const parent = this.parentNode;
            this.parentNode = null;
            this.nextSibling = null;
            this.previousSibling = null;

            parent.emit("remove", { node: this });
            parent.emit("change");
        }
    }

    insert(positionNode, node) {
        if (positionNode && positionNode.parentNode !== this) {
            throw new Error("Position node must be a child node");
        }

        node.remove();
        node.parentNode = this;
        node.nextSibling = positionNode;
        node.previousSibling = positionNode ? positionNode.previousSibling : this.lastChild;

        if (node.previousSibling) {
            node.previousSibling.nextSibling = node;
        }

        if (positionNode) {
            positionNode.previousSibling = node;
        } else {
            this.lastChild = node;
        }

        if (this.firstChild === positionNode) {
            this.firstChild = node;
        }

        for (const n of node.tree()) {
            if (n.owner !== this.owner) {
                n.id = this.owner ? this.owner.generateId(n.nodeName) : null;
                n.owner = this.owner;
            }
        }

        this.emit("insert", { node });
        this.emit("change");
    }

    append(node) {
        this.insert(null, node);
    }

    appendTo(node) {
        node.append(this);
    }

    contains(node) {
        for (; node; node = node.parentNode) {
            if (node === this) return true;
        }
        return false;
    }

    clone() {
        const node = new this.constructor();
        for (const [key, attr] of this.attributes) {
            node.attr(key, attr.value);
        }
        return node;
    }

    *children(nodeName) {
        let node = this.firstChild;
        if (nodeName) {
            while (node) {
                if (node.nodeName === nodeName) yield node;
                node = node.nextSibling;
            }
        } else {
            while (node) {
                yield node;
                node = node.nextSibling;
            }
        }
    }

    *descendants(nodeName) {
        let node = this.firstChild;
        if (nodeName) {
            while (node) {
                if (node.nodeName === nodeName) yield node;
                yield* node.descendants(nodeName);
                node = node.nextSibling;
            }
        } else {
            while (node) {
                yield node;
                yield* node.descendants();
                node = node.nextSibling;
            }
        }
    }

    *ancestors(nodeName) {
        let node = this.parentNode;
        if (nodeName) {
            while (node) {
                if (node.nodeName === nodeName) yield node;
                node = node.parentNode;
            }
        } else {
            while (node) {
                yield node;
                node = node.parentNode;
            }
        }
    }

    *tree(nodeName) {
        if (!nodeName || this.nodeName === nodeName) yield this;
        yield* this.descendants(nodeName);
    }

    closest(nodeName) {
        if (this.nodeName === nodeName) {
            return this;
        } else if (this.parentNode) {
            return this.parentNode.closest(nodeName);
        }
    }

    intersectsPoint(x, y, scale) {
        return false;
    }

    intersectsRect(x, y, w, h, scale) {
        return false;
    }

    containedByRect(x, y, w, h, scale) {
        return false;
    }

    *nodesAt(x, y, scale) {
        for (const childNode of this.children()) {
            yield* childNode.nodesAt(x, y, scale);
        }
        if (this.intersectsPoint(x, y, scale)) {
            yield this;
        }
    }

    *nodesIntersectingRect(x, y, w, h, scale) {
        for (const childNode of this.children()) {
            yield* childNode.nodesIntersectingRect(x, y, w, h, scale);
        }
        if (this.intersectsRect(x, y, w, h, scale)) {
            yield this;
        }
    }

    *nodesContainedByRect(x, y, w, h, scale) {
        for (const childNode of this.children()) {
            yield* childNode.nodesContainedByRect(x, y, w, h, scale);
        }
        if (this.containedByRect(x, y, w, h, scale)) {
            yield this;
        }
    }

    *nodesTransformable() {
        if (this.isTransformable) {
            yield this;
        }
        for (const childNode of this.children()) {
            yield* childNode.nodesTransformable();
        }
    }

    get isTransformable() {
        return false;
    }

    get rootNode() {
        let node = this;
        while (node.parentNode) {
            node = node.parentNode;
        }
        return node;
    }

    get visible() {
        return true;
    }

    get hasPosition() {
        return false;
    }
}
