import { File } from "./file.js";

const defaultSettings = {
    "theme.background": "#1e1e1e",
    "theme.selection-fill": "rgba(200, 200, 0, 0.5)",
    "theme.selection-border": "#ff0",
    "theme.selection-rect-fill": "rgba(200, 200, 0, 0.5)",
    "theme.selection-rect-border": "#ff0",
    "theme.selection-preview-border": "rgba(255, 255, 255, 0.3)",
    "theme.selection-reactive-border": "rgba(255, 255, 0, 0.5)",
    "theme.selection-subtract-border": "rgb(255, 0, 0)",
    "theme.grid-color": "#404040",
    "theme.grid-color-division": "rgba(64, 64, 64, 0.5)",
    "theme.waypoint-color": "#999",
    "theme.vertex-fill": "#fff",
    "theme.vertex-border": "#000",
    "editor.grid-size": 100,
    "editor.grid-divisions": 5,
    "editor.grid-limit": 10,
    "editor.zoom-factor": 1.25,
    "editor.zoom-max": 16,
    "editor.zoom-min": 1 / 16,
    "editor.undo-limit": 100,
    "editor.selection-rect-threshold": 5,
    "editor.vertex-size": 7,
    "editor.waypoint-size": 11,
    "view.grid": true,
    "view.background": true,
    "view.polygons": "texture",
    "view.wireframe": false,
    "map.color-top": "#1e1e1e",
    "map.color-bottom": "#1e1e1e",
    "map.jet": 0,
    "map.grenades": 0,
    "map.medikits": 0,
    "map.weather": "none",
    "map.steps": "hard-ground",
    "map.collider-radius": 8,
    "app.library-url": "//urraka.github.io/soldat-map/data/",
    "app.library-index": "filelist",
    "app.github": "https://github.com/urraka/polywonks",
};

const settings = Object.assign({}, defaultSettings);

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

export class Settings {
    static get(name) {
        if (!(name in settings)) {
            throw new Error("Invalid setting");
        }
        return settings[name];
    }

    static getDefault(name) {
        if (!(name in defaultSettings)) {
            throw new Error("Invalid setting");
        }
        return defaultSettings[name];
    }

    static set(name, value) {
        if (!(name in defaultSettings)) {
            throw new Error("Invalid setting");
        }
        settings[name] = value;
    }

    static list() {
        return Object.keys(defaultSettings);
    }

    static defaults(name) {
        return defaultSettings[name];
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
}
