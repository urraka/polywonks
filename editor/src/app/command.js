import { pascalToDash } from "../common/format.js";

export class Command {
    constructor(provider) {
        this.provider = provider;
        this.emitChange = () => this.provider.emit("commandchange", { name: this.commandName });
        this.emitInfo = message => this.provider.emit("commandinfo", { message });
    }

    get enabled() {
        return true;
    }

    get checked() {
        return false;
    }

    get commandName() {
        return this._commandName || (this._commandName = this.constructor.commandName);
    }

    dispose() { }

    exec(params) {
        if (this.enabled) {
            return this.onExec(params);
        }
    }

    hold(params) {
        if (this.enabled) {
            return this.onHold(params);
        }
    }

    release(params) {
        if (this.enabled) {
            return this.onRelease(params);
        }
    }

    onExec(_params) {
        throw new Error("Must implement");
    }

    onHold(_params) {
        throw new Error("Must implement");
    }

    onRelease(_params) {
        throw new Error("Must implement");
    }

    static get commandName() {
        return pascalToDash(this.name.replace(/Command$/, ""));
    }

    static get symbol() {
        return Command._symbol || (Command._symbol = Symbol());
    }

    static registry(ProviderClass) {
        return ProviderClass[Command.symbol] || (ProviderClass[Command.symbol] = new Map());
    }

    static register(ProviderClass, CommandClass) {
        const registry = Command.registry(ProviderClass);
        const name = CommandClass.commandName;
        if (registry.has(name)) {
            throw new Error("A command with the same name is already registered");
        }
        registry.set(name, CommandClass);
    }

    static provide(provider) {
        const commands = provider[Command.symbol] || (provider[Command.symbol] = new Map());
        for (const [name, CommandClass] of Command.registry(provider.constructor)) {
            if (!commands.has(name)) {
                commands.set(name, new CommandClass(provider));
            }
        }
    }

    static dispose(provider) {
        for (const command of provider[Command.symbol].values()) {
            command.dispose();
        }
    }

    static isProvider(provider) {
        return provider && !!provider[Command.symbol];
    }

    static find(provider, name) {
        if (Command.isProvider(provider)) {
            const ch = name.charAt(0);
            return provider[Command.symbol].get(ch === "+" || ch === "-" ? name.slice(1) : name);
        }
    }

    static exec(provider, name, params) {
        const command = Command.find(provider, name);
        if (command) {
            switch (name.charAt(0)) {
                case "+": return command.hold(params);
                case "-": return command.release(params);
                default: return command.exec(params);
            }
        }
    }
}
