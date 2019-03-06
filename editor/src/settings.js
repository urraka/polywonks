import * as ui from "./ui/ui.js";
import * as PMS from "./pms/pms.js";
import { File } from "./file.js";
import { EventEmitter } from "./support/event.js";
import { Enum } from "./support/enum.js";
import { Color } from "./support/color.js";

export const PolygonMode = new Enum({
    None: 0,
    Plain: 1,
    Texture: 2,
});

export const ExportMode = new Enum({
    Polyworks: 11,
    Soldat171: 12,
});

const DefaultSettings = {
    "theme.background": new Color("#1e1e1e"),
    "theme.selection-fill": new Color("rgba(200, 200, 0, 0.5)"),
    "theme.selection-border": new Color("#ff0"),
    "theme.selection-rect-fill": new Color("rgba(200, 200, 0, 0.5)"),
    "theme.selection-rect-border": new Color("#ff0"),
    "theme.selection-preview-border": new Color("rgba(255, 255, 255, 0.3)"),
    "theme.selection-reactive-border": new Color("rgba(255, 255, 0, 0.5)"),
    "theme.selection-subtract-border": new Color("rgb(255, 0, 0)"),
    "theme.grid-color": new Color("#404040"),
    "theme.grid-color-division": new Color("rgba(64, 64, 64, 0.5)"),
    "theme.waypoint-color": new Color("#999"),
    "theme.vertex-fill": new Color("#fff"),
    "theme.vertex-border": new Color("#000"),
    "theme.guides": new Color("#8080ff"),
    "theme.guides-active": new Color("#99f"),
    "theme.guides-snap": new Color("#ffd700"),
    "editor.grid-size": 100,
    "editor.grid-divisions": 5,
    "editor.grid-limit": 10,
    "editor.zoom-factor": 1.25,
    "editor.zoom-max": 16,
    "editor.zoom-min": 1 / 16,
    "editor.undo-limit": 100,
    "editor.drag-threshold": 5,
    "editor.vertex-size": 7,
    "editor.waypoint-size": 11,
    "editor.snap-radius": 5,
    "view.grid": true,
    "view.background": true,
    "view.polygons": "texture",
    "view.wireframe": false,
    "map.color-top": new Color("#1e1e1e"),
    "map.color-bottom": new Color("#1e1e1e"),
    "map.jet": 0,
    "map.grenades": 0,
    "map.medikits": 0,
    "map.weather": "none",
    "map.steps": "hard-ground",
    "map.collider-radius": 8,
    "app.library-url": "//urraka.github.io/soldat-map/data/",
    "app.library-index": "filelist",
    "app.github": "https://github.com/urraka/polywonks",
    "app.export-location": "/soldat/maps/",
    "app.export-mode": "soldat-171",
};

const settings = Object.assign({}, DefaultSettings);

export function cfg(name, value) {
    if (value !== undefined) {
        Settings.set(name, value);
    } else {
        return Settings.get(name);
    }
}

export function cfgDefault(name) {
    return Settings.getDefault(name);
}

export class Settings extends ui.MultiPanelView {
    constructor() {
        super();
        this.sheets = {};

        for (const key of Settings.list()) {
            const [category, name] = key.split(".");
            const sheet = this.sheets[category] || (this.sheets[category] = new ui.PropertySheet());
            sheet.addProperty(key, Settings.get(key), Settings.type(key), name);
        }

        for (const [category, sheet] of Object.entries(this.sheets).sort(([a], [b]) => a.localeCompare(b))) {
            this.addPanel(category === "map" ? "map defaults" : category, sheet);
            sheet.on("propertychange", e => this.onPropertyChange(e));
        }

        Settings.on("change", e => this.onSettingChange(e.setting));
    }

    onPropertyChange(event) {
        Settings.set(event.property.key, event.property.value);
    }

    onSettingChange(setting) {
        const [category, name] = setting.split(".");
        this.sheets[category].properties[setting].reset(Settings.get(setting));
    }

    static get(name) {
        if (!(name in settings)) {
            throw new Error("Invalid setting");
        }
        return settings[name];
    }

    static getDefault(name) {
        if (!(name in DefaultSettings)) {
            throw new Error("Invalid setting");
        }
        return DefaultSettings[name];
    }

    static set(name, value) {
        if (!(name in DefaultSettings)) {
            throw new Error("Invalid setting");
        }

        if (settings[name] !== value) {
            settings[name] = value;
            Settings.emitter.emit("change", { setting: name });
        }
    }

    static list() {
        return Object.keys(DefaultSettings);
    }

    static type(key) {
        switch (key) {
            case "editor.grid-divisions": return "uint32";
            case "editor.undo-limit": return "uint32";
            case "view.polygons": return PolygonMode;
            case "map.color-top": return "color";
            case "map.color-bottom": return "color";
            case "map.jet": return "uint16";
            case "map.grenades": return "uint8";
            case "map.medikits": return "uint8";
            case "map.weather": return PMS.WeatherType;
            case "map.steps": return PMS.StepsType;
            case "app.export-mode": return ExportMode;
            default: {
                if (Settings.getDefault(key) instanceof Color) {
                    return "color";
                } else {
                    return typeof Settings.getDefault(key);
                }
            }
        }
    }

    static load() {
        File.readJson("/polydrive/settings.json", data => {
            if (data) {
                for (key of Object.keys(settings)) {
                    if (key in data) {
                        settings[key] = data[key];
                    }
                }
            }
        });
    }

    static save() {
        throw new Error("Not implemented");
    }

    static get emitter() {
        return Settings._emitter || (Settings._emitter = new EventEmitter());
    }

    static on(...args) {
        Settings.emitter.on(...args);
    }
}
