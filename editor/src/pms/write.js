import { BufferWriter } from "../common/buffer.writer.js";

export function pms_write(map) {
    const w = new BufferWriter();

    w.bgra = (color => [..."bgra"].forEach(x => w.u8(color[x])));

    // header

    w.i32(map.version);
    w.str(map.name, 38);
    w.str(map.texture, 24);
    w.bgra(map.backgroundColorTop);
    w.bgra(map.backgroundColorBottom);
    w.i32(map.jetAmount);
    w.u8(map.grenades);
    w.u8(map.medikits);
    w.u8(map.weather);
    w.u8(map.steps);
    w.i32(map.randId);

    // polygons

    w.i32(map.polygons.length);

    for (const polygon of map.polygons) {
        for (const vertex of polygon.vertices) {
            w.f32(vertex.x);
            w.f32(vertex.y);
            w.f32(vertex.z);
            w.f32(vertex.rhw);
            w.bgra(vertex.color);
            w.f32(vertex.u);
            w.f32(vertex.v);
        }

        for (const normal of polygon.normals) {
            w.f32(normal.x);
            w.f32(normal.y);
            w.f32(normal.z);
        }

        w.u8(polygon.type);
    }

    // sectors

    w.i32(map.sectorsDivision);
    w.i32(map.numSectors);

    for (const sector of map.sectors) {
        w.u16(sector.length);

        for (const polyIndex of sector) {
            w.u16(polyIndex);
        }
    }

    // props

    w.i32(map.props.length);

    for (const prop of map.props) {
        w.u8(prop.active);
        w.skip(1);
        w.u16(prop.style);
        w.i32(prop.width);
        w.i32(prop.height);
        w.f32(prop.x);
        w.f32(prop.y);
        w.f32(prop.rotation);
        w.f32(prop.scaleX);
        w.f32(prop.scaleY);
        w.u8(prop.alpha);
        w.skip(3);
        w.bgra(prop.color);
        w.u8(prop.level);
        w.skip(3);
    }

    // scenery

    w.i32(map.scenery.length);

    for (const scenery of map.scenery) {
        w.str(scenery.name, 50);
        w.u16(scenery.timestamp.timeValue);
        w.u16(scenery.timestamp.dateValue);
    }

    // colliders

    w.i32(map.colliders.length);

    for (const collider of map.colliders) {
        w.u8(collider.active);
        w.skip(3);
        w.f32(collider.x);
        w.f32(collider.y);
        w.f32(collider.radius);
    }

    // spawns

    w.i32(map.spawns.length);

    for (const spawn of map.spawns) {
        w.u8(spawn.active);
        w.skip(3);
        w.i32(spawn.x);
        w.i32(spawn.y);
        w.u32(spawn.team);
    }

    // waypoints

    w.i32(map.waypoints.length);

    for (const waypoint of map.waypoints) {
        w.u8(waypoint.active);
        w.skip(3);
        w.i32(waypoint.id);
        w.i32(waypoint.x);
        w.i32(waypoint.y);
        w.u8(waypoint.left);
        w.u8(waypoint.right);
        w.u8(waypoint.up);
        w.u8(waypoint.down);
        w.u8(waypoint.jet);
        w.u8(waypoint.path);
        w.u8(waypoint.action);
        w.skip(5);
        w.i32(Math.min(20, waypoint.connections.length));

        for (const connection of waypoint.connections.slice(0, 20)) {
            w.i32(connection);
        }

        w.skip(4 * Math.max(0, 20 - waypoint.connections.length));
    }

    // this will prevent polyworks from opening this map
    if (map.randId < 0 && map.version === 12) {
        w.i32(-0x80000000);
    }

    return w.truncate();
}
