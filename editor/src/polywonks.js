import * as PMS from "./pms.js";
import * as Geometry from "./geometry.js";
import * as Gfx from "./gfx.js";
import * as fmt from "./format.js";
import * as img from "./image.js";
import * as ui from "./ui.js";
import * as cmd from "./commands.js";

import * as app from "./app.js";
import * as buffer_reader from "./buffer.reader.js";
import * as buffer_writer from "./buffer.writer.js";
import * as color from "./color.js";
import * as editor from "./editor.js";
import * as path from "./path.js";
import * as file from "./file.js";
import * as map_node from "./map.node.js";
import * as map_document from "./map.document.js";
import * as map_node_collider from "./map.node.collider.js";
import * as map_node_image from "./map.node.image.js";
import * as map_node_layer from "./map.node.layer.js";
import * as map_node_scenery from "./map.node.scenery.js";
import * as map_node_spawn from "./map.node.spawn.js";
import * as map_node_texture from "./map.node.texture.js";
import * as map_node_triangle from "./map.node.triangle.js";
import * as map_node_vertex from "./map.node.vertex.js";
import * as map_node_waypoint from "./map.node.waypoint.js";
import * as map_node_connection from "./map.node.connection.js";
import * as matrix from "./matrix.js";
import * as render from "./render.js";
import * as render_view from "./render.view.js";
import * as enm from "./enum.js";
import * as rect from "./rect.js";
import * as settings from "./settings.js";
import * as tool from "./tool.js";
import * as tool_select from "./tool.select.js";
import * as tool_pan from "./tool.pan.js";
import * as event from "./event.js";
import * as pointer from "./pointer.js";
import * as explorer from "./explorer.js";

// Note: Polywonks namespace is made global merely to aid debugging. It's only ever
// use at entry point in index.html

window.Polywonks = { PMS, Geometry, Gfx, fmt, img, ui, cmd };

const modules = [
    app,
    buffer_reader,
    buffer_writer,
    color,
    editor,
    path,
    file,
    map_node,
    map_document,
    map_node_collider,
    map_node_image,
    map_node_layer,
    map_node_scenery,
    map_node_spawn,
    map_node_texture,
    map_node_triangle,
    map_node_vertex,
    map_node_waypoint,
    map_node_connection,
    matrix,
    render,
    render_view,
    enm,
    rect,
    settings,
    tool,
    tool_select,
    tool_pan,
    event,
    pointer,
    explorer,
];

modules.forEach(module => {
    Object.keys(module).forEach(key => {
        window.Polywonks[key] = module[key];
    });
});
