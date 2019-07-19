import { EventEmitter } from "../common/event.js";
import { ClonedNodesCollection } from "../map/map.js";

export class Clipboard {
    static save(data) {
        Clipboard.data = data;
        Clipboard.emitter.emit("change");
    }

    static load() {
        let data = Clipboard.data || null;

        if (data) {
            const clonedNodes = new ClonedNodesCollection();
            data = Object.assign({}, data);
            data.nodes = data.nodes.map(node => clonedNodes.clone(node));
            clonedNodes.resolveReferences();
        }

        return data;
    }

    static empty() {
        return !Clipboard.data;
    }

    static on(...args) {
        Clipboard.emitter.on(...args);
    }

    static off(...args) {
        Clipboard.emitter.off(...args);
    }

    static get emitter() {
        return Clipboard._emitter || (Clipboard._emitter = new EventEmitter());
    }
}
