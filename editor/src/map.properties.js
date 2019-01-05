import * as ui from "./ui/ui.js";

export class MapProperties extends ui.PropertySheet {
    constructor() {
        super();
        this.element.classList.add("map-properties");
    }
}
