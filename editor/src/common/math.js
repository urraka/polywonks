export function normalizeAngle(x) {
    x = (x + Math.PI) % (2 * Math.PI);
    return x < 0 ? x + Math.PI : x - Math.PI;
}

export function mod(a, b) {
    return ((a % b) + b) % b;
}

export function npot(x) {
    let result = 1;
    while (result < x) {
        result = result << 1;
    }
    return result;
}

export function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

export function sqr(x) {
    return x * x;
}

export function distance2(ax, ay, bx, by) {
    return sqr(ax - bx) + sqr(ay - by);
}

export function distance(ax, ay, bx, by) {
    return Math.sqrt(distance2(ax, ay, bx, by));
}

export function pointToSegmentDistance2(x, y, ax, ay, bx, by) {
    const length2 = distance2(ax, ay, bx, by);
    if (length2 === 0) return distance2(x, y, ax, ay);
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length2));
    return distance2(x, y, ax + t * (bx - ax), ay + t * (by - ay));
}

export function pointToSegmentDistance(x, y, ax, ay, bx, by) {
    return Math.sqrt(distToSegmentSquared(x, y, ax, ay, bx, by));
}

export function rectContainsPoint(x, y, w, h, px, py) {
    let x0, x1, y0, y1;
    w < 0 ? (x0 = x + w, x1 = x) : (x0 = x, x1 = x + w);
    h < 0 ? (y0 = y + h, y1 = y) : (y0 = y, y1 = y + h);
    return x0 <= px && px <= x1 && y0 <= py && py <= y1;
}

export function rectContainsTriangle(x, y, w, h, ax, ay, bx, by, cx, cy) {
    return rectContainsPoint(x, y, w, h, ax, ay) &&
        rectContainsPoint(x, y, w, h, bx, by) &&
        rectContainsPoint(x, y, w, h, cx, cy);
}

export function rectContainsRect(ax, ay, aw, ah, bx, by, bw, bh) {
    let ax0, ax1, ay0, ay1, bx0, bx1, by0, by1;
    aw < 0 ? (ax0 = ax + aw, ax1 = ax) : (ax0 = ax, ax1 = ax + aw);
    ah < 0 ? (ay0 = ay + ah, ay1 = ay) : (ay0 = ay, ay1 = ay + ah);
    bw < 0 ? (bx0 = bx + bw, bx1 = bx) : (bx0 = bx, bx1 = bx + bw);
    bh < 0 ? (by0 = by + bh, by1 = by) : (by0 = by, by1 = by + bh);
    return ax0 <= bx0 && bx1 <= ax1 && ay0 <= by0 && by1 <= ay1;
}

export function rectIntersectsRect(ax, ay, aw, ah, bx, by, bw, bh) {
    let ax0, ax1, ay0, ay1, bx0, bx1, by0, by1;
    aw < 0 ? (ax0 = ax + aw, ax1 = ax) : (ax0 = ax, ax1 = ax + aw);
    ah < 0 ? (ay0 = ay + ah, ay1 = ay) : (ay0 = ay, ay1 = ay + ah);
    bw < 0 ? (bx0 = bx + bw, bx1 = bx) : (bx0 = bx, bx1 = bx + bw);
    bh < 0 ? (by0 = by + bh, by1 = by) : (by0 = by, by1 = by + bh);
    return ax0 <= bx1 && ax1 >= bx0 && ay0 <= by1 && ay1 >= by0;
}

export function rectIntersectsCircle(x, y, w, h, px, py, r) {
    let x0, x1, y0, y1, dx, dy;
    w < 0 ? (x0 = x + w, x1 = x) : (x0 = x, x1 = x + w);
    h < 0 ? (y0 = y + h, y1 = y) : (y0 = y, y1 = y + h);
    dx = px - Math.max(x0, Math.min(x1, px));
    dy = py - Math.max(y0, Math.min(y1, py));
    return (dx * dx) + (dy * dy) <= (r * r);
}

export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const ccw = (ax, ay, bx, by, cx, cy) => (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
    return ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
        ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy);
}

export function signedTriangleArea(ax, ay, bx, by, cx, cy) {
    return 0.5 * (-by * cx + ay * (-bx + cx) + ax * (by - cy) + bx * cy);
}

export function triangleContainsPoint(ax, ay, bx, by, cx, cy, x, y, A = signedTriangleArea(ax, ay, bx, by, cx, cy)) {
    if (A === 0) return false;
    const sign = A < 0 ? -1 : 1;
    const s = (ay * cx - ax * cy + (cy - ay) * x + (ax - cx) * y) * sign;
    const t = (ax * by - ay * bx + (ay - by) * x + (bx - ax) * y) * sign;
    return s >= 0 && t >= 0 && (s + t) <= (2 * A * sign);
}

export function rectIntersectsTriangle(x, y, w, h, ax, ay, bx, by, cx, cy) {
    const A = signedTriangleArea(ax, ay, bx, by, cx, cy);
    return rectContainsPoint(x, y, w, h, ax, ay) ||
        rectContainsPoint(x, y, w, h, bx, by) ||
        rectContainsPoint(x, y, w, h, cx, cy) ||
        triangleContainsPoint(ax, ay, bx, by, cx, cy, x + 0, y + 0, A) ||
        triangleContainsPoint(ax, ay, bx, by, cx, cy, x + w, y + 0, A) ||
        triangleContainsPoint(ax, ay, bx, by, cx, cy, x + w, y + h, A) ||
        triangleContainsPoint(ax, ay, bx, by, cx, cy, x + 0, y + h, A) ||
        segmentsIntersect(x + 0, y + 0, x + w, y + 0, ax, ay, bx, by) ||
        segmentsIntersect(x + 0, y + 0, x + w, y + 0, bx, by, cx, cy) ||
        segmentsIntersect(x + 0, y + 0, x + w, y + 0, cx, cy, ax, ay) ||
        segmentsIntersect(x + w, y + 0, x + w, y + h, ax, ay, bx, by) ||
        segmentsIntersect(x + w, y + 0, x + w, y + h, bx, by, cx, cy) ||
        segmentsIntersect(x + w, y + 0, x + w, y + h, cx, cy, ax, ay) ||
        segmentsIntersect(x + w, y + h, x + 0, y + h, ax, ay, bx, by) ||
        segmentsIntersect(x + w, y + h, x + 0, y + h, bx, by, cx, cy) ||
        segmentsIntersect(x + w, y + h, x + 0, y + h, cx, cy, ax, ay) ||
        segmentsIntersect(x + 0, y + h, x + 0, y + 0, ax, ay, bx, by) ||
        segmentsIntersect(x + 0, y + h, x + 0, y + 0, bx, by, cx, cy) ||
        segmentsIntersect(x + 0, y + h, x + 0, y + 0, cx, cy, ax, ay);
}

export function rectIntersectsSegment(x, y, w, h, ax, ay, bx, by) {
    return rectContainsPoint(x, y, w, h, ax, ay) ||
        rectContainsPoint(x, y, w, h, bx, by) ||
        segmentsIntersect(x + 0, y + 0, x + w, y + 0, ax, ay, bx, by) ||
        segmentsIntersect(x + w, y + 0, x + w, y + h, ax, ay, bx, by) ||
        segmentsIntersect(x + w, y + h, x + 0, y + h, ax, ay, bx, by) ||
        segmentsIntersect(x + 0, y + h, x + 0, y + 0, ax, ay, bx, by);
}

export function triangleIntersectsSegment(ax, ay, bx, by, cx, cy, px, py, qx, qy) {
    const A = signedTriangleArea(ax, ay, bx, by, cx, cy);
    return triangleContainsPoint(ax, ay, bx, by, cx, cy, px, py, A) ||
        triangleContainsPoint(ax, ay, bx, by, cx, cy, qx, qy, A) ||
        segmentsIntersect(px, py, qx, qy, ax, ay, bx, by) ||
        segmentsIntersect(px, py, qx, qy, bx, by, cx, cy) ||
        segmentsIntersect(px, py, qx, qy, cx, cy, ax, ay);
}

export function triangleIncenter(ax, ay, bx, by, cx, cy) {
    const a = distance(bx, by, cx, cy);
    const b = distance(ax, ay, cx, cy);
    const c = distance(ax, ay, bx, by);
    const p = a + b + c;
    if (p !== 0) {
        return {
            x: (a * ax + b * bx + c * cx) / p,
            y: (a * ay + b * by + c * cy) / p,
        };
    }
}

export function linesIntersection(p0x, p0y, p1x, p1y, q0x, q0y, q1x, q1y) {
    const rx = p1x - p0x, ry = p1y - p0y;
    const sx = q1x - q0x, sy = q1y - q0y;
    const unum = cross(q0x - p0x, q0y - p0y, rx, ry);
    const uden = cross(rx, ry, sx, sy);
    if (uden !== 0) {
        const u = unum / uden;
        return {
            x: q0x + u * sx,
            y: q0y + u * sy,
        };
    }
}

export function cross(ax, ay, bx, by) {
    return ax * by - ay * bx;
}
