import { Path } from "../common/path.js";
import { Node } from "./node.js";

export class ResourceNode extends Node {
    get path() {
        return this.pathFrom(this.owner ? Path.dir(this.owner.path) : "");
    }

    pathFrom(location) {
        const src = this.attr("src");
        if (!src || src.startsWith("/")) return src;
        if (location) return Path.resolve(location, src);
        return "";
    }
}
