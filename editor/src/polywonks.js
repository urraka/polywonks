import * as PMS from "./pms/pms.js";
import * as Gfx from "./gfx/gfx.js";
import * as Geometry from "./support/geometry.js";
import * as fmt from "./support/format.js";
import * as img from "./support/image.js";
import * as math from "./support/math.js";
import * as ui from "./ui/ui.js";

import * as buffer_reader from "./support/buffer.reader.js";
import * as buffer_writer from "./support/buffer.writer.js";
import * as color from "./support/color.js";
import * as enm from "./support/enum.js";
import * as event from "./support/event.js";
import * as matrix from "./support/matrix.js";
import * as path from "./support/path.js";
import * as pointer from "./support/pointer.js";
import * as rect from "./support/rect.js";
import * as type from "./support/type.js";
import * as map from "./map/map.js";
import * as app from "./app.js";
import * as editor from "./editor.js";
import * as editor_commands from "./editor.commands.js";
import * as selection from "./selection.js";
import * as file from "./file.js";
import * as render from "./render.js";
import * as render_view from "./render.view.js";
import * as settings from "./settings.js";
import * as tool from "./tool.js";
import * as tool_select from "./tool.select.js";
import * as tool_pan from "./tool.pan.js";
import * as tool_zoom from "./tool.zoom.js";
import * as sidebar from "./sidebar.js";
import * as file_explorer from "./file.explorer.js";
import * as map_explorer from "./map.explorer.js";
import * as map_properties from "./map.properties.js";

export const Polywonks = (() => {
    const namespace = {
        PMS,
        Geometry,
        Gfx,
        fmt,
        img,
        math,
        ui,
    };

    const modules = [
        app,
        buffer_reader,
        buffer_writer,
        color,
        editor,
        editor_commands,
        selection,
        path,
        file,
        map,
        matrix,
        render,
        render_view,
        enm,
        rect,
        type,
        settings,
        tool,
        tool_select,
        tool_pan,
        tool_zoom,
        event,
        pointer,
        sidebar,
        file_explorer,
        map_explorer,
        map_properties,
    ];

    modules.forEach(module => {
        Object.keys(module).forEach(key => {
            namespace[key] = module[key];
        });
    });

    return namespace;
})();
