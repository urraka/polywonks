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
import * as editor_commands from "./editor/editor.commands.js";
import * as map_explorer from "./editor/map.explorer.js";
import * as map_properties from "./editor/map.properties.js";
import * as tool_properties from "./editor/tool.properties.js";
import * as selection from "./editor/selection.js";
import * as grid from "./editor/grid.js";
import * as snapping from "./editor/snapping.js";
import * as view from "./editor/view.js";
import * as tool from "./editor/tools/tool.js";
import * as toolset from "./editor/toolset.js";
import * as editor_sidebar from "./editor/sidebar.js";
import * as history from "./editor/history.js";
import * as edit from "./editor/edit.js";

import * as app from "./app/app.js";
import * as app_commands from "./app/app.commands.js";
import * as command from "./app/command.js";
import * as file from "./app/file.js";
import * as render from "./app/render.js";
import * as settings from "./app/settings.js";
import * as keybindings from "./app/keybindings.js";
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
        command,
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
        edit,
        editor,
        editor_commands,
        map_explorer,
        map_properties,
        tool_properties,
        selection,
        grid,
        snapping,
        view,
        tool,
        toolset,
        editor_sidebar,
        history,

        // app
        app,
        app_commands,
        file,
        render,
        settings,
        keybindings,
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
