import { Color } from "./common/color.js";

export const settings = {
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
    "editor.snap-to-grid": true,
    "editor.snap-to-objects": true,
    "view.grid": true,
    "view.background": true,
    "view.polygons": "texture",
    "view.wireframe": false,
    "view.vertices": false,
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

export const keybindings = {
    "Ctrl+Z": "undo",
    "Ctrl+Shift+Z": "redo",
    "Ctrl+X": "cut",
    "Ctrl+C": "copy",
    "Ctrl+V": "paste",
    "Ctrl+M": "new-map",
    "Ctrl+O": "show-explorer",
    "Ctrl+S": "save",
    "F9": "export",
    "Ctrl+F9": "export-as",
    "Ctrl+Shift+S": "save-as",
    "Delete": "delete",
    "Shift+PageUp": "send-to-back",
    "PageUp": "send-backward",
    "PageDown": "bring-forward",
    "Shift+PageDown": "bring-to-front",
    "Ctrl+0": "reset-viewport",
    "Ctrl++": "zoom-in",
    "Ctrl+-": "zoom-out",
    "Ctrl": "select-cycle",
    "Shift+Ctrl": "select-cycle",
    "Alt+Ctrl": "select-cycle",
    "Shift": "+select-add",
    "Alt": "+select-subtract",
    "V": "selection-vert-switch",
    "E": ["set-tool", { tool: "pan" }],
    "Q": ["set-tool", { tool: "select" }],
    "M": ["set-tool", { tool: "move-objects" }],
    "T": ["set-tool", { tool: "move-texture" }],
    "F": ["set-tool", { tool: "paint" }],
    "P": ["set-tool", { tool: "polygon" }],
    "S": ["set-tool", { tool: "scenery" }],
    "A": ["set-tool", { tool: "spawn" }],
    "C": ["set-tool", { tool: "collider" }],
    "W": ["set-tool", { tool: "waypoint" }],
    "N": ["set-tool", { tool: "connection" }],
};

export const menu = [
    ["File", [
        ["New", "new-map"],
        [],
        ["Open...", "show-explorer"],
        [],
        ["Save", "save"],
        ["Save As...", "save-as"],
        ["Download...", "save-download"],
        [],
        ["Export", "export"],
        ["Export As...", "export-as"],
        ["Export Download...", "export-download"],
    ]],
    ["Edit", [
        ["Undo", "undo"],
        ["Redo", "redo"],
        [],
        ["Delete", "delete"],
        [],
        ["Cut", "cut"],
        ["Copy", "copy"],
        ["Paste", "paste"],
    ]],
    ["Selection", [
        ["Switch Vertices/Polygons", "selection-vert-switch"],
    ]],
    ["Object", [
        ["Texture", [
            ["Reset", "texture-reset"],
            [],
            ["Rotate 90° CW", "texture-rotate-90-cw"],
            ["Rotate 90° CCW", "texture-rotate-90-ccw"],
            ["Flip Horizontal", "texture-flip-horizontal"],
            ["Flip Vertical", "texture-flip-vertical"],
        ]],
        [],
        ["Rotate 90° CW", "rotate-90-cw"],
        ["Rotate 90° CCW", "rotate-90-ccw"],
        ["Flip Horizontal", "flip-horizontal"],
        ["Flip Vertical", "flip-vertical"],
        [],
        ["Send to Back", "send-to-back"],
        ["Send Backward", "send-backward"],
        ["Bring Forward", "bring-forward"],
        ["Bring to Front", "bring-to-front"],
    ]],
    ["View", [
        ["Reset Viewport", "reset-viewport"],
        ["Zoom In", "zoom-in"],
        ["Zoom Out", "zoom-out"],
        [],
        ["Snap to Grid", "toggle-snap-to-grid"],
        ["Snap to Objects", "toggle-snap-to-objects"],
        [],
        ["Show Grid", "toggle-grid"],
        ["Show Background", "toggle-background"],
        ["Show Vertices", "toggle-vertices"],
        ["Show Wireframe", "toggle-wireframe"],
        ["Polygons", [
            ["Texture", "show-polygon-texture"],
            ["Plain Color", "show-polygon-plain"],
            ["Hide", "show-polygon-none"],
        ]],
    ]],
    ["Help", [
        ["Github", "browse-to-github"],
    ]],
];
