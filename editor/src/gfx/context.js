import { VertexBuffer } from "./vertexbuffer.js";
import { DrawBatch } from "./batch.js";
import { Texture } from "./texture.js";

export class Context {
    constructor() {
        const VERT = [
            "uniform mat3 transform;",
            "attribute vec2 in_pos;",
            "attribute vec2 in_texcoords;",
            "attribute vec4 in_color;",
            "varying vec2 texcoords;",
            "varying vec4 color;",
            "void main() {",
            "    color = vec4(in_color.rgb * in_color.a, in_color.a);",
            "    texcoords = in_texcoords;",
            "    gl_Position.xyw = transform * vec3(in_pos, 1.0);",
            "    gl_Position.z = 0.0;",
            "}\n"
        ].join("\n");

        const FRAG = [
            "precision highp float;",
            "varying highp vec2 texcoords;",
            "varying highp vec4 color;",
            "uniform sampler2D sampler;",
            "void main() {",
            "    gl_FragColor = texture2D(sampler, texcoords) * color;",
            "}\n"
        ].join("\n");

        function compile(gl, source, type) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                console.log("Shader error: " + gl.getShaderInfoLog(shader));
            return shader;
        }

        function program(gl, vs, fs) {
            const program = gl.createProgram();
            gl.attachShader(program, compile(gl, vs, gl.VERTEX_SHADER));
            gl.attachShader(program, compile(gl, fs, gl.FRAGMENT_SHADER));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                console.log("Error linking shader program.");
            gl.useProgram(program);
            return program;
        }

        this.canvas = document.createElement("canvas");
        this.gl = this.canvas.getContext("webgl", { alpha: false, antialias: false });

        this.shader = { program: program(this.gl, VERT, FRAG) };
        this.shader.transform = this.gl.getUniformLocation(this.shader.program, "transform");
        this.shader.pos = this.gl.getAttribLocation(this.shader.program, "in_pos");
        this.shader.texcoords = this.gl.getAttribLocation(this.shader.program, "in_texcoords");
        this.shader.color = this.gl.getAttribLocation(this.shader.program, "in_color");

        this.gl.enableVertexAttribArray(this.shader.pos);
        this.gl.enableVertexAttribArray(this.shader.texcoords);
        this.gl.enableVertexAttribArray(this.shader.color);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

        this.whiteTexture = new Texture(this, 16, 16, color => color.set(255, 255, 255));
        this.transparentTexture = new Texture(this, 16, 16, color => color.set(0, 0, 0, 0));
        this.defaultTexture = this.whiteTexture;
    }

    clear(color) {
        this.gl.clearColor(color.r / 255, color.g / 255, color.b / 255, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    draw(batch, transform) {
        if (batch.commands.length === 0) {
            return;
        }

        const gl = this.gl;
        const vertexSize = VertexBuffer.VERTEX_SIZE;
        const f32Size = Float32Array.BYTES_PER_ELEMENT;

        batch.buffer.upload();
        gl.vertexAttribPointer(this.shader.pos, 2, gl.FLOAT, false, vertexSize, 0);
        gl.vertexAttribPointer(this.shader.texcoords, 2, gl.FLOAT, false, vertexSize, 2 * f32Size);
        gl.vertexAttribPointer(this.shader.color, 4, gl.UNSIGNED_BYTE, true, vertexSize, 4 * f32Size);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.uniformMatrix3fv(this.shader.transform, false, transform);

        for (const cmd of batch.commands) {
            gl.bindTexture(gl.TEXTURE_2D, cmd.texture ? cmd.texture.handle : this.defaultTexture.handle);
            gl.drawArrays(cmd.mode, cmd.start, cmd.end - cmd.start);
        }
    }

    createBatch() {
        return new DrawBatch(this);
    }

    createTexture(...args) {
        return new Texture(this, ...args);
    }
}
