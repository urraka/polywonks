import * as xMath from "./math.js";

/**
 * @param {Image} image - The image to process.
 * @param {Object} params - Options.
 * @param {boolean} [params.premultiply=false] - Premultiply alpha.
 * @param {boolean} [params.padding=false] - Add 1px transparent padding (helps with border filtering).
 * @param {boolean} [params.colorKey=null] - Make pixels with given color transparent.
 * @param {boolean} [params.npot=false] - Resize to npot if necessary.
 * @returns {ImageData}
 */
export function processImage(image, params) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    {
        let dx = 0;
        let dy = 0;
        let dw = image.width;
        let dh = image.height;
        let w = image.width;
        let h = image.height;

        if (params.padding) {
            dx = 1;
            dy = 1;
            w = image.width + 2;
            h = image.height + 2;
        }

        if (params.npot) {
            w = xMath.npot(w);
            h = xMath.npot(h);
            dw = w - (params.padding ? 2 : 0);
            dh = h - (params.padding ? 2 : 0);
        }

        canvas.width = w;
        canvas.height = h;
        context.drawImage(image, dx, dy, dw, dh);
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorKey = params.colorKey;

    for (let y = 0, i = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; i += 4, x++) {
            if (colorKey) {
                if (data[i + 0] === colorKey.r && data[i + 1] === colorKey.g &&
                    data[i + 2] === colorKey.b && data[i + 3] === colorKey.a) {
                    data.set([0, 0, 0, 0], i);
                }
            }

            if (params.premultiply) {
                const alpha = data[i + 3] / 255;
                data[i + 0] = Math.round(data[i + 0] * alpha);
                data[i + 1] = Math.round(data[i + 1] * alpha);
                data[i + 2] = Math.round(data[i + 2] * alpha);
            }
        }
    }

    return imageData;
}

/**
 * Function for generating an antialiased gradient circle.
 * @param {Color} color - Output for the pixel color.
 * @param {Number} x - Current pixel x-coordinate.
 * @param {Number} y - Current pixel y-coordinate.
 * @param {Number} w - Width of the image being generated.
 * @param {Number} h - Height of the image being generated.
 */
export function gradientCircle() {
    return function (color, x, y, w, h) {
        const D = w / 2;
        const dist = Math.sqrt((x - D) * (x - D) + (y - D) * (y - D));
        const t = Math.max(0, Math.min(1, dist - (D - 1)));
        const shape = 1 - t * t * (3 - 2 * t);
        const intensity = shape * (Math.pow(dist / D, 3) + Math.min(0.5, (1 - (dist / D))));
        const a = Math.round(255 * Math.max(0, Math.min(1, intensity)));
        color.set(a, a, a, a); // this is white premultiplied with alpha
    };
}

export function rectangle(borderWidth, fillColor, borderColor) {
    return function (color, x, y, w, h) {
        if (x < borderWidth || (w - x) <= borderWidth || y < borderWidth || (h - y) <= borderWidth) {
            color.set(borderColor);
        } else {
            color.set(fillColor);
        }

        const alpha = color.a / 255;
        color.r = Math.round(color.r * alpha);
        color.g = Math.round(color.g * alpha);
        color.b = Math.round(color.b * alpha);
    };
}
