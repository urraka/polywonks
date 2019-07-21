import * as ui from "../ui/ui.js";
import { EventEmitter } from "../common/event.js";
import { keybindings as DefaultBindings } from "../config.js";

const Modifiers = ["Meta", "Ctrl", "Alt", "Shift"];

export class Keybindings extends EventEmitter {
    constructor() {
        super();
        this.bindings = {};
        this.pushed = new Set();
        for (const [key, entry] of Object.entries(DefaultBindings)) {
            if (typeof entry === "string") {
                this.add(key, entry);
            } else {
                const entries = entry.slice();
                while (entries.length) {
                    const cmd = entries.shift();
                    const params = typeof entries[0] === "object" ? entries.shift() : null;
                    this.add(key, cmd, params);
                }
            }
        }

        document.addEventListener("keydown", e => this.onKeyDown(e));
        document.addEventListener("keyup", e => this.onKeyUp(e));
        window.addEventListener("blur", () => this.onFocusLost());
        ui.Dialog.on("modalstart", () => this.onFocusLost());
    }

    static get instance() {
        return Keybindings._instance || (Keybindings._instance = new Keybindings());
    }

    static on(...args) {
        return Keybindings.instance.on(...args);
    }

    static off(...args) {
        return Keybindings.instance.off(...args);
    }

    static find(command) {
        return Keybindings.instance.find(command);
    }

    static findAll(command) {
        return Keybindings.instance.findAll(command);
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

        const k = key.toUpperCase();
        this.bindings[k] = this.bindings[k] || [];
        this.bindings[k].push({ command, params, key });
    }

    keysText(binding) {
        const modifiers = binding.key.slice(0, 4).split("")
            .map((ch, i) => ch === "1" ? Modifiers[i] : "")
            .filter(m => m !== "")
            .join("+");
        return modifiers ? modifiers + "+" + binding.key.slice(5) : binding.key.slice(5);
    }

    find(command) {
        for (const bindingGroup of Object.values(this.bindings)) {
            for (const binding of bindingGroup) {
                if (binding.command === command) {
                    return this.keysText(binding);
                }
            }
        }
        return null;
    }

    findAll(command) {
        const result = [];
        for (const bindingGroup of Object.values(this.bindings)) {
            for (const binding of bindingGroup) {
                if (binding.command === command) {
                    result.push({ command, params: binding.params, keys: this.keysText(binding) });
                }
            }
        }
        return result;
    }

    onKeyDown(event) {
        if (!event.repeat && !ui.Dialog.activeDialog && !(event.target instanceof HTMLInputElement)) {
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

            const bindingGroup = this.bindings[key[0]] || this.bindings[key[1]];

            if (bindingGroup) {
                event.preventDefault();
                for (const binding of bindingGroup) {
                    if (binding.command.startsWith("+")) this.pushed.add(binding.command);
                    this.emit("command", { command: binding.command, params: binding.params });
                }
            }
        }
    }

    onKeyUp(event) {
        if (!ui.Dialog.activeDialog) {
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

            for (const [k, bindingGroup] of Object.entries(this.bindings)) {
                for (const binding of bindingGroup) {
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
        }
    }

    onFocusLost() {
        for (const command of this.pushed) {
            this.pushed.delete(command);
            this.emit("command", { command: "-" + command.slice(1) });
        }
    }
}
