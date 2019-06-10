import { Color } from "../common/color.js";

export class Texture {
    constructor(context, ...args) {
        const gl = context.gl;
        this.gl = gl;
        this.handle = this.gl.createTexture();
        this.width = 0;
        this.height = 0;

        if (args.length === 1) {
            const image = args[0];
            this.width = image.width;
            this.height = image.height;
            gl.bindTexture(gl.TEXTURE_2D, this.handle);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        } else if (args.length === 3) {
            const w = args[0];
            const h = args[1];
            const f = args[2];
            const imageData = new Uint8Array(w * h * 4);
            const color = new Color();
            const reset = new Color();

            for (let y = 0, offset = 0; y < h; y++) {
                for (let x = 0; x < w; x++ , offset += 4) {
                    color.set(reset);
                    f(color, x, y, w, h);
                    imageData.set(color, offset);
                }
            }

            this.width = w;
            this.height = h;
            gl.bindTexture(gl.TEXTURE_2D, this.handle);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        }

        this.setRepeat(false);
        this.setNearestFilter(false);
    }

    dispose() {
        this.gl.deleteTexture(this.handle);
    }

    setRepeat(enable) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.handle);

        if (enable) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }

    setNearestFilter(enable) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.handle);

        if (enable) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    }

    generateMipmaps() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.handle);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
}
