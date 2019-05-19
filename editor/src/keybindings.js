import { EventEmitter } from "./support/event.js";

const Modifiers = ["Meta", "Ctrl", "Alt", "Shift"];

const DefaultBindings = {
    "Ctrl+Z": "undo",
    "Ctrl+Shift+Z": "redo",
    "Ctrl+X": "cut",
    "Ctrl+C": "copy",
    "Ctrl+V": "paste",
    "Ctrl+M": "new-map",
    "Ctrl+O": "show-explorer",
    "Ctrl+S": "save",
    "F9": "export",
    "Ctrl+F9": "export-as",
    "Ctrl+Shift+S": "save-as",
    "Delete": "delete",
    "Shift+PageUp": "send-to-back",
    "Shift+PageDown": "bring-to-front",
    "Ctrl+0": "reset-viewport",
    "Ctrl++": "zoom-in",
    "Ctrl+-": "zoom-out",
    "Ctrl": "select.cycle",
    "Shift+Ctrl": "select.cycle",
    "Alt+Ctrl": "select.cycle",
    "Shift": "+select.add",
    "Alt": "+select.subtract",
    "E": ["set-tool", { tool: "pan" }],
    "Q": ["set-tool", { tool: "select" }],
    "M": ["set-tool", { tool: "move" }],
    "T": ["set-tool", { tool: "texture" }],
    "P": ["set-tool", { tool: "polygon" }],
    "S": ["set-tool", { tool: "scenery" }],
    "A": ["set-tool", { tool: "spawn" }],
    "C": ["set-tool", { tool: "collider" }],
    "W": ["set-tool", { tool: "waypoint" }],
    "N": ["set-tool", { tool: "connection" }],
};

export class KeyBindings extends EventEmitter {
    constructor() {
        super();
        this.bindings = {};
        this.pushed = new Set();
        for (const [key, command] of Object.entries(DefaultBindings)) {
            if (typeof command === "string") {
                this.add(key, command);
            } else {
                this.add(key, command[0], command[1]);
            }
        }
    }

    add(key, command, params) {
        const keys = key.endsWith("+") ? key.slice(0, -1).split("+").concat(['+']) : key.split("+");
        let modifiers = keys.slice(0, -1);
        key = Modifiers.map(m => modifiers.includes(m) ? "1" : "0").join("") + "_" + keys.pop();

        const re = new RegExp("_(" + Modifiers.join("|") + ")$");
        const match = re.exec(key);

        if (match) {
            const i = Modifiers.indexOf(match[1]);
            key = key.slice(0, i) + "1" + key.slice(i + 1);
            if (match[1] === "Ctrl") {
                key = key.replace("_Ctrl", "_Control");
            }
        }

        this.bindings[key.toUpperCase()] = { command, params, key };
    }

    keysText(binding) {
        const modifiers = binding.key.slice(0, 4).split("")
            .map((ch, i) => ch === "1" ? Modifiers[i] : "")
            .filter(m => m !== "")
            .join("+");
        return modifiers ? modifiers + "+" + binding.key.slice(5) : binding.key.slice(5);
    }

    find(command) {
        for (const binding of Object.values(this.bindings)) {
            if (binding.command === command) {
                return this.keysText(binding);
            }
        }
        return null;
    }

    findAll(command) {
        const result = [];
        for (const binding of Object.values(this.bindings)) {
            if (binding.command === command) {
                result.push({ command, params: binding.params, keys: this.keysText(binding) });
            }
        }
        return result;
    }

    onKeyDown(event) {
        const modifiers = [
            +event.metaKey,
            +event.ctrlKey,
            +event.altKey,
            +event.shiftKey,
        ].join("");

        const key = [
            modifiers + "_" + event.code.toUpperCase(),
            modifiers + "_" + event.key.toUpperCase(),
        ];

        const binding = this.bindings[key[0]] || this.bindings[key[1]];

        if (binding) {
            event.preventDefault();
            if (binding.command.startsWith("+")) this.pushed.add(binding.command);
            this.emit("command", { command: binding.command, params: binding.params });
        }
    }

    onKeyUp(event) {
        const modifiers = [
            +event.metaKey,
            +event.ctrlKey,
            +event.altKey,
            +event.shiftKey,
        ];

        const eventKeyName = [
            event.code.toUpperCase(),
            event.key.toUpperCase(),
        ];

        for (const [k, binding] of Object.entries(this.bindings)) {
            if (this.pushed.has(binding.command)) {
                const keyName = k.slice(5);
                if (eventKeyName[0] === keyName || eventKeyName[1] === keyName ||
                    modifiers.some((m, i) => +k.charAt(i) - m === 1)
                ) {
                    this.pushed.delete(binding.command);
                    this.emit("command", { command: "-" + binding.command.slice(1) });
                }
            }
        }
    }

    onFocusLost() {
        for (const command of this.pushed) {
            this.pushed.delete(command);
            this.emit("command", { command: "-" + command.slice(1) });
        }
    }
}
