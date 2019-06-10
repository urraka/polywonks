import * as Sectors from "./sectors.js";
import { pms_read } from "./read.js";
import { pms_write } from "./write.js";
import { Color } from "../common/color.js";
import { Enum } from "../common/enum.js";

// -------------------------------------------------------------------------- //
// enums

export const PolyType = new Enum({
    Normal: 0,
    OnlyBulletsCollide: 1,
    OnlyPlayersCollide: 2,
    NoCollide: 3,
    Ice: 4,
    Deadly: 5,
    BloodyDeadly: 6,
    Hurts: 7,
    Regenerates: 8,
    Lava: 9,
    AlphaBullets: 10,
    AlphaPlayers: 11,
    BravoBullets: 12,
    BravoPlayers: 13,
    CharlieBullets: 14,
    CharliePlayers: 15,
    DeltaBullets: 16,
    DeltaPlayers: 17,
    Bouncy: 18,
    Explosive: 19,
    HurtsFlaggers: 20,
    FlaggerCollides: 21,
    NonFlaggerCollides: 22,
    FlagCollides: 23,
    Background: 24,
    BackgroundTransition: 25
});

export const WeatherType = new Enum({
    None: 0,
    Rain: 1,
    Sandstorm: 2,
    Snow: 3
});

export const StepsType = new Enum({
    HardGround: 0,
    SoftGround: 1,
    None: 2
});

export const ActionType = new Enum({
    None: 0,
    StopAndCamp: 1,
    Wait1Second: 2,
    Wait5Seconds: 3,
    Wait10Seconds: 4,
    Wait15Seconds: 5,
    Wait20Seconds: 6
});

export const PathType = new Enum({
    Path1: 1,
    Path2: 2
});

export const SpawnTeam = new Enum({
    General: 0,
    Alpha: 1,
    Bravo: 2,
    Charlie: 3,
    Delta: 4,
    AlphaFlag: 5,
    BravoFlag: 6,
    Grenades: 7,
    Medikits: 8,
    Clusters: 9,
    Vest: 10,
    Flamer: 11,
    Berserker: 12,
    Predator: 13,
    YellowFlag: 14,
    RamboBow: 15,
    StatGun: 16
});

// -------------------------------------------------------------------------- //
// functions

export const sectorsDivision = Sectors.sectorsDivision;
export const generateSectors = Sectors.generateSectors;

// -------------------------------------------------------------------------- //
// structs

export class Map {
    constructor() {
        this.version = 0;
        this.name = "";
        this.texture = "";
        this.backgroundColorTop = new Color();
        this.backgroundColorBottom = new Color();
        this.jetAmount = 0;
        this.grenades = 0;
        this.medikits = 0;
        this.weather = 0;
        this.steps = 0;
        this.randId = 0;
        this.polygons = [];
        this.sectorsDivision = 0;
        this.numSectors = 25;
        this.sectors = [];
        this.props = [];
        this.scenery = [];
        this.colliders = [];
        this.spawns = [];
        this.waypoints = [];
    }

    toArrayBuffer() {
        return pms_write(this);
    }

    static fromArrayBuffer(arrayBuffer) {
        return pms_read(arrayBuffer);
    }
}

export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Vertex {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rhw = 0;
        this.color = new Color();
        this.u = 0;
        this.v = 0;
    }
}

export class Polygon {
    constructor() {
        this.vertices = [new Vertex(), new Vertex(), new Vertex()];
        this.normals = [new Vec3(), new Vec3(), new Vec3()];
        this.type = 0;
    }
}

export class Prop {
    constructor() {
        this.active = true;
        this.style = 0;
        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scaleX = 0;
        this.scaleY = 0;
        this.alpha = 0;
        this.color = new Color();
        this.level = 0;
    }
}

export class Timestamp {
    constructor() {
        this.timeValue = 0;
        this.dateValue = 0;
    }
}

export class Scenery {
    constructor() {
        this.name = "";
        this.timestamp = new Timestamp();
    }
}

export class Collider {
    constructor() {
        this.active = true;
        this.x = 0;
        this.y = 0;
        this.radius = 0;
    }
}

export class Spawn {
    constructor() {
        this.active = true;
        this.x = 0;
        this.y = 0;
        this.team = 0;
    }
}

export class Waypoint {
    constructor() {
        this.active = true;
        this.id = 0;
        this.x = 0;
        this.y = 0;
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.jet = false;
        this.path = 0;
        this.action = 0;
        this.connections = [];
    }
}
