import { Renderer } from "./render.js";
import { Editor } from "./editor.js";

export class App {
    static launch() {
        window.app = new App();
    }

    constructor() {
        this.renderer = new Renderer(window.innerWidth, window.innerHeight);
        this.editor = new Editor(this.renderer);
        this.editor.redraw();

        document.body.querySelector(".loading").remove();
        document.body.appendChild(this.renderer.context.canvas);
        document.body.appendChild(this.editor.element);

        window.addEventListener("resize", e => this.onResize(e));
        window.addEventListener("resize", e => this.onResize(e));
        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
    }

    onResize() {
        this.renderer.width = this.editor.element.offsetWidth;
        this.renderer.height = this.editor.element.offsetHeight;
        this.editor.redraw();
    }

    onDrop(event) {
        const reader = new FileReader();
        reader.addEventListener("load", () => this.editor.loadFromBuffer(reader.result));
        reader.readAsArrayBuffer(event.dataTransfer.files[0]);
        event.preventDefault();
    }

    onDragOver(event) {
        event.preventDefault();
    }

    onDragEnter(event) {
        event.preventDefault();
    }
}
