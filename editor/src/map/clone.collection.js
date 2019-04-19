export class ClonedNodesCollection {
    constructor() {
        this.cloneToOriginal = new Map();
        this.originalToClone = new Map();
    }

    clone(node) {
        const clone = node.clone();
        this.cloneToOriginal.set(clone, node);
        this.originalToClone.set(node, clone);

        for (const childNode of node.children()) {
            clone.append(this.clone(childNode));
        }

        return clone;
    }

    resolveReferences() {
        for (const [clonedNode,] of this.cloneToOriginal) {
            for (const [key, attr] of clonedNode.attributes) {
                if (attr.dataType === "node" && attr.value) {
                    if (this.originalToClone.get(attr.value)) {
                        clonedNode.attr(key, this.originalToClone.get(attr.value));
                    } else {
                        clonedNode.attr(key, attr.value.clone());
                    }
                }
            }
        }
    }
}
