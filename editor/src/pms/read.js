import * as PMS from "./pms.js";
import { BufferReader } from "../common/buffer.reader.js";
import { Color } from "../common/color.js";

export function pms_read(arrayBuffer) {
    const map = new PMS.Map();
    const r = new BufferReader(arrayBuffer);

    r.bgra = (() => Color.bgra(r.u8(), r.u8(), r.u8(), r.u8()));

    // header

    map.version = r.i32();
    map.name = r.str(38);
    map.texture = r.str(24);
    map.backgroundColorTop = r.bgra();
    map.backgroundColorBottom = r.bgra();
    map.jetAmount = r.i32();
    map.grenades = r.u8();
    map.medikits = r.u8();
    map.weather = r.u8();
    map.steps = r.u8();
    map.randId = r.i32();

    // polygons

    for (let i = 0, n = r.i32(); i < n; i++) {
        const polygon = new PMS.Polygon();

        for (let j = 0; j < 3; j++) {
            polygon.vertices[j].x = r.f32();
            polygon.vertices[j].y = r.f32();
            polygon.vertices[j].z = r.f32();
            polygon.vertices[j].rhw = r.f32();
            polygon.vertices[j].color = r.bgra();
            polygon.vertices[j].u = r.f32();
            polygon.vertices[j].v = r.f32();
        }

        for (let j = 0; j < 3; j++) {
            polygon.normals[j].x = r.f32();
            polygon.normals[j].y = r.f32();
            polygon.normals[j].z = r.f32();
        }

        polygon.type = r.u8();
        map.polygons.push(polygon);
    }

    // sectors

    map.sectorsDivision = r.i32();
    map.numSectors = r.i32();

    for (let i = 0, n = 2 * map.numSectors + 1, m = n * n; i < m; i++) {
        const sector = [];

        for (let j = 0, n = r.u16(); j < n; j++) {
            sector.push(r.u16());
        }

        map.sectors.push(sector);
    }

    // props

    for (let i = 0, n = r.i32(); i < n; i++) {
        const prop = new PMS.Prop();
        prop.active = !!r.u8();
        r.skip(1);
        prop.style = r.u16();
        prop.width = r.i32();
        prop.height = r.i32();
        prop.x = r.f32();
        prop.y = r.f32();
        prop.rotation = r.f32();
        prop.scaleX = r.f32();
        prop.scaleY = r.f32();
        prop.alpha = r.u8();
        r.skip(3);
        prop.color = r.bgra();
        prop.level = r.u8();
        r.skip(3);
        map.props.push(prop);
    }

    // scenery

    for (let i = 0, n = r.i32(); i < n; i++) {
        const scenery = new PMS.Scenery();
        scenery.name = r.str(50);
        scenery.timestamp.timeValue = r.u16();
        scenery.timestamp.dateValue = r.u16();
        map.scenery.push(scenery);
    }

    // colliders

    for (let i = 0, n = r.i32(); i < n; i++) {
        const collider = new PMS.Collider();
        collider.active = !!r.u8();
        r.skip(3);
        collider.x = r.f32();
        collider.y = r.f32();
        collider.radius = r.f32();
        map.colliders.push(collider);
    }

    // spawns

    for (let i = 0, n = r.i32(); i < n; i++) {
        const spawn = new PMS.Spawn();
        spawn.active = !!r.u8();
        r.skip(3);
        spawn.x = r.i32();
        spawn.y = r.i32();
        spawn.team = r.u32();
        map.spawns.push(spawn);
    }

    // waypoints

    for (let i = 0, n = r.i32(); i < n; i++) {
        const waypoint = new PMS.Waypoint();
        waypoint.active = !!r.u8();
        r.skip(3);
        waypoint.id = r.i32();
        waypoint.x = r.i32();
        waypoint.y = r.i32();
        waypoint.left = !!r.u8();
        waypoint.right = !!r.u8();
        waypoint.up = !!r.u8();
        waypoint.down = !!r.u8();
        waypoint.jet = !!r.u8();
        waypoint.path = r.u8();
        waypoint.action = r.u8();
        r.skip(5);

        const count = Math.min(20, r.i32());

        for (let j = 0; j < count; j++) {
            waypoint.connections.push(r.i32());
        }

        r.skip(4 * Math.max(0, 20 - count));
        map.waypoints.push(waypoint);
    }

    return map;
}