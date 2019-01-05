export class Command {
    execute() {}
    get enabled() { return true; }
    get checked() { return false; }

    static add(name, command) {
        const commands = Command.commands || (Command.commands = new Map());
        commands.set(name, command);
    }

    static find(name) {
        const commands = Command.commands || (Command.commands = new Map());
        return commands.get(name) || Command.dummyCommand || (Command.dummyCommand = new Command());
    }
}
