import { EventEmitter } from "../../common/event.js";
import { pascalToDash } from "../../common/format.js";
import { iter } from "../../common/iter.js";

export class EditorFunction extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
    }

    get enabled() {
        return true;
    }

    exec(params) {
        if (this.enabled) {
            this.onExec(params);
        }
    }

    onExec(params) {
        throw new Error("Must implement");
    }

    static get functions() {
        return EditorFunction._functions || (EditorFunction._functions = {});
    }

    static register(func) {
        const name = pascalToDash(func.name.replace(/Function$/, ""));
        EditorFunction.functions[name] = func;
    }

    static instantiate(editor) {
        const instances = {};
        for (const [name, func] of Object.entries(EditorFunction.functions)) {
            instances[name] = new func(editor);
        }
        return instances;
    }

    static includes(name) {
        return iter(Object.keys(EditorFunction.functions)).includes(name);
    }
}
