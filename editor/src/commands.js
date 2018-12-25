import * as ui from "./ui.js";
import { cfg } from "./settings.js";

export class BrowseToGithubCommand extends ui.Command {
    execute() {
        window.open(cfg("app.github"));
    }
}
