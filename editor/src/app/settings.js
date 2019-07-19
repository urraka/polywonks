import * as ui from "../ui/ui.js";
import * as PMS from "../pms/pms.js";
import { EventEmitter } from "../common/event.js";
import { Enum } from "../common/enum.js";
import { Color } from "../common/color.js";
import { settings as DefaultSettings } from "../config.js";
import { Property } from "./property.js";
import { File } from "./file.js";

const settings = Object.assign({}, DefaultSettings);

export const PolygonMode = new Enum({
    None: 0,
    Plain: 1,
    Texture: 2,
});

export const ExportMode = new Enum({
    Polyworks: 11,
    Soldat171: 12,
});

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
            sheet.addProperty(Property.item(key, name, Settings.type(key), Settings.get(key)));
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

    static off(...args) {
        Settings.emitter.off(...args);
    }
}
