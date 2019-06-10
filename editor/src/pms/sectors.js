import * as xMath from "../common/math.js";
import { PolyType } from "./pms.js";

export function sectorsDivision(bounds) {
    if (bounds.width > bounds.height) {
        return Math.trunc((bounds.width / 2 + 100) / 25);
    } else {
        return Math.trunc((bounds.height / 2 + 100) / 25);
    }
}

export function generateSectors(pms) {
    const d = pms.sectorsDivision;
    const n = pms.numSectors;
    const sectors = Array.from({ length: (2 * n + 1) * (2 * n + 1) }, () => []);
    let polyIndex = 1;

    const round = x => {
        const n = Math.fround(x);
        const r = Math.round(n);
        return Math.abs(n) % 1 === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
    };

    for (const polygon of pms.polygons) {
        if (polygon.type !== PolyType.NoCollide) {
            const xx = polygon.vertices.map(v => v.x);
            const yy = polygon.vertices.map(v => v.y);
            const x0 = Math.max(-n, round((Math.min(...xx) - 1) / d));
            const x1 = Math.min(n, round((Math.max(...xx) + 1) / d));
            const y0 = Math.max(-n, round((Math.min(...yy) - 1) / d));
            const y1 = Math.min(n, round((Math.max(...yy) + 1) / d));

            for (let x = x0; x <= x1; x++) {
                for (let y = y0; y <= y1; y++) {
                    const rect = [d * (x - 0.5) - 1, d * (y - 0.5) - 1, d + 2, d + 2];
                    const triangle = [].concat(...polygon.vertices.map(v => [v.x, v.y]));

                    if (xMath.rectIntersectsTriangle(...rect, ...triangle)) {
                        sectors[(n + x) * (2 * n + 1) + (n + y)].push(polyIndex);
                    }
                }
            }
        }

        polyIndex++;
    }

    return sectors;
}
