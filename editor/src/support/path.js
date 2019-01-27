export class Path {
    static resolve(cwd, path) {
        if (path.startsWith("/")) {
            cwd = "/";
        }

        const base = cwd.split("/").filter(x => x !== "");
        const rest = path.split("/").filter(x => x !== "");
        const full = base.concat(rest);

        const result = [];
        for (const part of full) {
            if (part === "..") {
                result.pop();
            } else if (part !== ".") {
                result.push(part);
            }
        }

        if (path.endsWith("/") && result.length > 0) {
            return "/" + result.join("/") + "/";
        } else {
            return "/" + result.join("/");
        }
    }

    static filename(path) {
        const n = path.lastIndexOf("/");
        return path.substring(n + 1);
    }

    static dir(path) {
        const n = path.lastIndexOf("/");
        return path.substring(0, n + 1);
    }

    static ext(path) {
        const i = path.lastIndexOf(".");
        return i >= 0 ? path.substring(i) : "";
    }

    static replaceExtension(path, ext) {
        const i = path.lastIndexOf(".");
        return i >= 0 ? path.substring(0, i) + ext : path + ext;
    }

    // split("/root/dir/file") -> ["/", "dir/", "file"]
    static split(path) {
        if (!path || typeof path !== "string") {
            throw new Error("Path.split() - Invalid path.");
        }

        const result = path.split("/").map((s, i, arr) => {
            return i < arr.length - 1 ? s + "/" : s;
        });

        return path.endsWith("/") ? result.slice(0, -1) : result;
    }
}
