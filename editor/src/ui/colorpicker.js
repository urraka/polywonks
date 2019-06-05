import { clamp } from "../support/math.js";
import { Color } from "../support/color.js";
import { EventEmitter } from "../support/event.js";
import { ValueType } from "../support/type.js";
import { Pointer } from "../support/pointer.js";
import { PropertySheet, PropertyTextItem } from "./propertysheet.js";
import { elem } from "./common.js";

const HTML = /*html*/`
<div class="color-picker" tabindex="-1">
    <div class="color-picker-palette">
        <div class="color-picker-preview">
            <button><span></span></button>
            <button><span></span></button>
        </div>
        <div class="color-picker-palette-buttons"></div>
    </div>
    <div class="color-picker-values">
        <div class="color-picker-props"></div>
        <div class="color-picker-ctrls">
            <div class="color-picker-color">
                <svg width="1" height="1"></svg>
                <div class="color-picker-saturation">
                    <div class="color-picker-value" tabindex="0">
                        <div class="color-picker-crosshair"></div>
                    </div>
                </div>
            </div>
            <div class="color-picker-hue" tabindex="0">
                <div class="color-picker-handle"></div>
            </div>
            <div class="color-picker-alpha">
                <div class="color-picker-alpha-value" tabindex="0">
                    <div class="color-picker-handle"></div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

const VALUE_HANDLERS = {
    valueToString: value => ValueType.toString("uint8", value),
    valueFromString: str => ValueType.fromString("uint8", str),
};

class Draggable extends EventEmitter {
    constructor(element) {
        super();
        this.element = element;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerChange(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerChange(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerChange(e.mouseEvent));
        this.pointer.activate(element.parentElement, 0);
        this.element.closest("[tabindex]").addEventListener("keydown", e => this.onKeyDown(e));
        this.reset(0, 0);
    }

    onKeyDown(event) {
        const mul = event.shiftKey ? 5 : 1;
        switch (event.key) {
            case "ArrowLeft": this.move(-1 * mul, 0); break;
            case "ArrowRight": this.move(1 * mul, 0); break;
            case "ArrowUp": this.move(0, -1 * mul); break;
            case "ArrowDown": this.move(0, 1 * mul); break;
        }
    }

    move(dx, dy) {
        const rect = this.element.parentElement.getBoundingClientRect();
        dx = dx / rect.width;
        dy = dy / rect.height;
        this.set(this.x + dx, this.y + dy);
    }

    onPointerChange(event) {
        if (this.pointer.dragging) {
            const rect = this.element.parentElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.set(x / rect.width, y / rect.height);
        }
    }

    reset(x, y) {
        this._x = clamp(x, 0, 1);
        this._y = clamp(y, 0, 1);
        this.element.style.left = (this.x * 100) + "%";
        this.element.style.top = (this.y * 100) + "%";
    }

    set(x, y) {
        const xPrev = this.x;
        const yPrev = this.y;
        this.reset(x, y);
        if (xPrev !== this.x || yPrev !== this.y) {
            this.emit("change");
        }
    }

    get x() { return this._x; }
    get y() { return this._y; }
}

class Crosshair extends EventEmitter {
    constructor(element) {
        super();
        this.draggable = new Draggable(element);
        this.draggable.on("change", () => this.emit("change"));
    }
    reset(s, v) { this.draggable.reset(s, 1 - v); }
    get saturation() { return this.draggable.x; }
    get value() { return 1 - this.draggable.y; }
}

class BarHandle extends EventEmitter {
    constructor(element) {
        super();
        this.draggable = new Draggable(element);
        const reset = this.draggable.reset.bind(this.draggable);
        this.draggable.reset = (x, y) => reset(0, y);
        this.draggable.on("change", () => this.emit("change"));
    }
    reset(value) { this.draggable.reset(0, 1 - value); }
    get value() { return 1 - this.draggable.y; }
}

class Palette extends EventEmitter {
    constructor() {
        super();
        this.colors = [];
        for (let i = 0; i < 20; i++) {
            const t = (i / 19) * 255;
            this.colors.push(new Color(t, t, t));
        }
        this.load();
        this.saveTimeout = undefined;
    }

    save() {
        if (this.saveTimeout === undefined) {
            this.saveTimeout = setTimeout(() => {
                try {
                    const colors = this.colors.map(color => color.toString());
                    localStorage.setItem("pwk.palette", JSON.stringify(colors));
                } catch (e) { }
                this.saveTimeout = undefined;
            }, 800);
        }
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem("pwk.palette"));
            if (data) {
                for (let i = 0, n = Math.min(20, data.length); i < n; i++) {
                    this.colors[i] = new Color(data[i]);
                }
            }
        } catch (e) { }
    }

    getColor(index) {
        return new Color(this.colors[index]);
    }

    setColor(index, color) {
        if (this.colors[index] && !color.equals(this.colors[index])) {
            this.colors[index] = new Color(color);
            this.emit("change", { index });
            this.save();
        }
    }
}

export class ColorPicker extends EventEmitter {
    constructor(color = new Color(0, 0, 0)) {
        super();
        this.onFocusOut = this.onFocusOut.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWindowScrollOrResize = this.onWindowScrollOrResize.bind(this);
        this.onPaletteChange = this.onPaletteChange.bind(this);
        this.onPaletteClick = this.onPaletteClick.bind(this);

        this.element = document.createRange().createContextualFragment(HTML).firstElementChild;
        this.createPalette();

        const previewButton = this.element.querySelector(".color-picker-preview > button:first-child");
        previewButton.addEventListener("click", e => this.onPreviewButtonClick(e));

        this.sheet = new PropertySheet();
        this.sheet.immediateChange = true;
        this.sheet.addProperty(new PropertyTextItem("r", "R", color.r, VALUE_HANDLERS));
        this.sheet.addProperty(new PropertyTextItem("g", "G", color.g, VALUE_HANDLERS));
        this.sheet.addProperty(new PropertyTextItem("b", "B", color.b, VALUE_HANDLERS));
        this.sheet.addProperty(new PropertyTextItem("a", "A", color.a, VALUE_HANDLERS));
        this.sheet.on("propertychange", () => this.onPropsChange());
        this.element.querySelector(".color-picker-props").appendChild(this.sheet.element);

        this.crosshair = new Crosshair(this.element.querySelector(".color-picker-crosshair"));
        this.crosshair.on("change", () => this.onCtrlsChange());

        this.hueHandle = new BarHandle(this.element.querySelector(".color-picker-hue .color-picker-handle"));
        this.hueHandle.on("change", () => this.onCtrlsChange());

        this.alphaHandle = new BarHandle(this.element.querySelector(".color-picker-alpha .color-picker-handle"));
        this.alphaHandle.on("change", () => this.onCtrlsChange());

        this.initialColor = color;
        this.reset(color);
    }

    static show(positionElement, color) {
        const colorPicker = new ColorPicker(color);
        colorPicker.show(positionElement);
        return colorPicker;
    }

    show(positionElement) {
        document.body.append(this.element);
        const rcPosition = positionElement.getBoundingClientRect();
        const rcPicker = this.element.getBoundingClientRect();
        this.element.style.left = rcPosition.left + rcPosition.width + 4 + "px";
        this.element.style.top = rcPosition.top + "px";
        if (rcPosition.top + rcPicker.height > window.innerHeight) {
            this.element.style.top = Math.max(0, rcPosition.top + rcPosition.height - rcPicker.height) + "px";
            this.element.appendChild(this.element.querySelector(".color-picker-palette"));
        }
        setTimeout(() => document.addEventListener("focusout", this.onFocusOut, true));
        document.addEventListener("keydown", this.onKeyDown, true);
        window.addEventListener("scroll", this.onWindowScrollOrResize, true);
        window.addEventListener("resize", this.onWindowScrollOrResize, true);
        this.palette.on("change", this.onPaletteChange);
        this.updatePaletteColors();
        this.activePaletteIndex = undefined;
        setTimeout(() => this.element.focus());
    }

    close(reason = "", originalEvent = null) {
        if (this.emit("willclose", { reason, originalEvent })) {
            document.removeEventListener("focusout", this.onFocusOut, true);
            document.removeEventListener("keydown", this.onKeyDown, true);
            window.removeEventListener("scroll", this.onWindowScrollOrResize, true);
            window.removeEventListener("resize", this.onWindowScrollOrResize, true);
            this.palette.off("change", this.onPaletteChange);
            this.element.remove();
            this.emit("close", { reason, originalEvent });
        }
    }

    onKeyDown(event) {
        switch (event.key) {
            case "Enter": this.close("submit", event); break;
            case "Escape": this.close("cancel", event); break;
        }
    }

    onFocusOut(event) {
        if (!this.element.contains(event.relatedTarget)) {
            this.close("focuslost", event);
        }
    }

    onWindowScrollOrResize(event) {
        this.close("reflow", event);
    }

    onPreviewButtonClick(event) {
        this.close("submit", event);
    }

    onPaletteChange(event) {
        this.updatePaletteColor(event.index);
    }

    onPaletteClick(event) {
        const button = event.currentTarget;
        const index = [...button.parentElement.children].indexOf(button);
        this.color = this.palette.getColor(index);
        if (event.type === "dblclick") {
            if (this.activePaletteIndex === index) {
                this.activePaletteIndex = undefined;
            } else {
                this.activePaletteIndex = index;
            }
        }
    }

    get activePaletteIndex() {
        return this._activePaletteIndex;
    }

    set activePaletteIndex(index) {
        if (this._activePaletteIndex !== undefined) {
            this.element.querySelector(".color-picker-palette-buttons .active").classList.remove("active");
        }
        if (index !== undefined) {
            const button = this.element.querySelector(`.color-picker-palette-buttons button:nth-child(${index + 1})`);
            button.classList.add("active");
        }
        this._activePaletteIndex = index;
    }

    colorFromHSVControls() {
        return Color.fromHSV(
            this.hueHandle.value,
            this.crosshair.saturation,
            this.crosshair.value,
            this.alphaHandle.value
        );
    }

    onCtrlsChange() {
        this.color = this.colorFromHSVControls();
    }

    onPropsChange() {
        this.color = new Color(...[..."rgba"].map(t => this.sheet.properties[t].value));
    }

    updateHSVControls(color) {
        if (!this.colorFromHSVControls().equals(color)) {
            const [h, s, v, a] = color.toHSV();
            this.crosshair.reset(s, v);
            this.hueHandle.reset(h);
            this.alphaHandle.reset(a);
        }
        this.hueBackground = this.hueHandle.value;
        this.alphaGradient = color;
        this.previewColor = color;
    }

    reset(color) {
        this._color = color;
        [..."rgba"].forEach(t => this.sheet.properties[t].reset(color[t]));
        this.updateHSVControls(color);
        if (this.activePaletteIndex !== undefined) {
            this.palette.setColor(this.activePaletteIndex, color);
        }
    }

    set color(color) {
        const prevColor = this.color;
        this.reset(color);
        if (!prevColor.equals(this.color)) {
            this.emit("change");
        }
    }

    get color() {
        return this._color || (this._color = new Color(0, 0, 0));
    }

    set previewColor(color) {
        const elem = this._previewColor || (this._previewColor = this.element.querySelector(".color-picker-preview > button:first-child > span"));
        elem.style.backgroundColor = color.toString("rgba");
    }

    set alphaGradient(color) {
        const start = new Color(color, 0);
        const end = new Color(color, 255);
        const elem = this._alphaBackground || (this._alphaBackground = this.element.querySelector(".color-picker-alpha-value"));
        elem.style.background = `linear-gradient(to top, ${start.toString("rgba")}, ${end.toString()})`;
    }

    set hueBackground(hue) {
        const color = Color.fromHSV(hue, 1, 1);
        const elem = this._hueBackground || (this._hueBackground = this.element.querySelector(".color-picker-color"));
        elem.style.backgroundColor = color.toString("rgba");
    }

    set initialColor(color) {
        const button = elem("button");
        const span = elem("span");
        button.appendChild(span);
        button.addEventListener("click", () => this.color = color);
        span.style.backgroundColor = color.toString("rgba");
        this.element.querySelector(".color-picker-preview > button:last-child").replaceWith(button);
    }

    get palette() {
        return ColorPicker.palette || (ColorPicker.palette = new Palette());
    }

    createPalette() {
        const buttons = this.element.querySelector(".color-picker-palette-buttons");
        for (let i = 0; i < this.palette.colors.length; i++) {
            const button = elem("button"), span = elem("span");
            button.append(span);
            button.addEventListener("click", this.onPaletteClick);
            button.addEventListener("dblclick", this.onPaletteClick);
            buttons.appendChild(button);
        }
    }

    updatePaletteColors() {
        for (let i = 0; i < this.palette.colors.length; i++) {
            this.updatePaletteColor(i);
        }
    }

    updatePaletteColor(index) {
        const element = this.element.querySelector(`.color-picker-palette-buttons > button:nth-child(${index + 1}) > span`);
        element.style.backgroundColor = this.palette.getColor(index).toString("rgba");
    }
}
