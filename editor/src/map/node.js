export class Node {
    constructor(nodeName) {
        this.owner = null;
        this.nodeName = nodeName;
        this.parentNode = null;
        this.firstChild = null;
        this.lastChild = null;
        this.nextSibling = null;
        this.previousSibling = null;
        this.attributes = new Map();
    }

    attr(name, value) {
        if (value === undefined) {
            return this.attributes.get(name);
        } else {
            this.attributes.set(name, value);
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

            this.parentNode = null;
            this.nextSibling = null;
            this.previousSibling = null;
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
            n.owner = this.owner;
        }
    }

    append(node) {
        this.insert(null, node);
    }

    appendTo(node) {
        node.append(this);
    }

    *children() {
        let node = this.firstChild;
        while (node) {
            yield node;
            node = node.nextSibling;
        }
    }

    *descendants() {
        let node = this.firstChild;
        while (node) {
            yield node;
            for (const childNode of node.descendants()) {
                yield childNode;
            }
            node = node.nextSibling;
        }
    }

    *ancestors() {
        let node = this.parentNode;
        while (node) {
            yield node;
            node = node.parentNode;
        }
    }

    *tree() {
        yield this;
        for (const node of this.descendants()) {
            yield node;
        }
    }

    *filter(iterator, classType) {
        if (typeof classType === "function") {
            for (const node of iterator) {
                if (node instanceof classType) {
                    yield node;
                }
            }
        } else if (classType.length) {
            for (const node of iterator) {
                if (classType.some(T => node instanceof T)) {
                    yield node;
                }
            }
        } else {
            throw new Error("Invalid filter");
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
            if (childNode.intersectsPoint(x, y, scale)) {
                yield childNode;
            }
            yield *childNode.nodesAt(x, y, scale);
        }
    }

    *nodesIntersectingRect(x, y, w, h, scale) {
        for (const childNode of this.children()) {
            if (childNode.intersectsRect(x, y, w, h, scale)) {
                yield childNode;
            }
            yield *childNode.nodesIntersectingRect(x, y, w, h, scale);
        }
    }

    *nodesContainedByRect(x, y, w, h, scale) {
        for (const childNode of this.children()) {
            if (childNode.containedByRect(x, y, w, h, scale)) {
                yield childNode;
            }
            yield *childNode.nodesContainedByRect(x, y, w, h, scale);
        }
    }

    get rootNode() {
        let node = this;
        while (node.parentNode) {
            node = node.parentNode;
        }
        return node;
    }
}
