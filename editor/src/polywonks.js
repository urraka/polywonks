// imports preserving namespace

import * as PMS from "./pms/pms.js";
import * as Gfx from "./gfx/gfx.js";
import * as fmt from "./common/format.js";
import * as img from "./common/image.js";
import * as xMath from "./common/math.js";
import * as ui from "./ui/ui.js";

// everything else

import * as buffer_reader from "./common/buffer.reader.js";
import * as buffer_writer from "./common/buffer.writer.js";
import * as color from "./common/color.js";
import * as enm from "./common/enum.js";
import * as event from "./common/event.js";
import * as matrix from "./common/matrix.js";
import * as path from "./common/path.js";
import * as pointer from "./common/pointer.js";
import * as rect from "./common/rect.js";
import * as type from "./common/type.js";
import * as iter from "./common/iter.js";

import * as map from "./map/map.js";

import * as editor from "./editor/editor.js";
import * as map_explorer from "./editor/map.explorer.js";
import * as map_properties from "./editor/map.properties.js";
import * as tool_properties from "./editor/tool.properties.js";
import * as editor_command from "./editor/command.js";
import * as selection from "./editor/selection.js";
import * as grid from "./editor/grid.js";
import * as snapping from "./editor/snapping.js";
import * as view from "./editor/view.js";

import * as tool_collider from "./editor/tools/collider.js";
import * as tool_connection from "./editor/tools/connection.js";
import * as tool_create from "./editor/tools/create.js";
import * as tool_cursor from "./editor/tools/cursor.js";
import * as tool_move from "./editor/tools/move.js";
import * as tool_move_position from "./editor/tools/move.position.js";
import * as tool_move_texture from "./editor/tools/move.texture.js";
import * as tool_pan from "./editor/tools/pan.js";
import * as tool_polygon from "./editor/tools/polygon.js";
import * as tool_scenery from "./editor/tools/scenery.js";
import * as tool_select from "./editor/tools/select.js";
import * as tool_spawn from "./editor/tools/spawn.js";
import * as tool from "./editor/tools/tool.js";
import * as tool_waypoint from "./editor/tools/waypoint.js";
import * as tool_zoom from "./editor/tools/zoom.js";

import * as app from "./app/app.js";
import * as file from "./app/file.js";
import * as render from "./app/render.js";
import * as settings from "./app/settings.js";
import * as sidebar from "./app/sidebar.js";
import * as file_explorer from "./app/file.explorer.js";
import * as clipboard from "./app/clipboard.js";
import * as dialog_save from "./app/dialog.save.js";

export const Polywonks = (() => {
    const namespace = {
        PMS,
        Gfx,
        fmt,
        img,
        xMath,
        ui,
    };

    const modules = [
        // common
        buffer_reader,
        buffer_writer,
        color,
        enm,
        event,
        matrix,
        path,
        pointer,
        rect,
        type,
        iter,

        // map
        map,

        // editor
        editor,
        map_explorer,
        map_properties,
        tool_properties,
        editor_command,
        selection,
        grid,
        snapping,
        view,
        tool_collider,
        tool_connection,
        tool_create,
        tool_cursor,
        tool_move,
        tool_move_position,
        tool_move_texture,
        tool_pan,
        tool_polygon,
        tool_scenery,
        tool_select,
        tool_spawn,
        tool,
        tool_waypoint,
        tool_zoom,

        // app
        app,
        file,
        render,
        settings,
        sidebar,
        file_explorer,
        clipboard,
        dialog_save,
    ];

    modules.forEach(module => {
        Object.keys(module).forEach(key => {
            namespace[key] = module[key];
        });
    });

    return namespace;
})();
