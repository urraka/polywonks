export class Path {
    // returns an absolute path
    static resolve(basedir, path) {
        if (path.startsWith("/")) {
            basedir = "/";
        }

        const base = basedir.split("/").filter(x => x !== "");
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

    static relative(basedir, path) {
        if (!basedir.startsWith("/") || !path.startsWith("/")) {
            throw new Error("Path.relative() - basedir and path must be absolute");
        }

        basedir = Path.split(basedir);
        path = Path.split(path);

        while (basedir.length > 0 && path.length > 0 &&
            basedir[0].toLowerCase() === path[0].toLowerCase()) {
            basedir.shift();
            path.shift();
        }

        while (basedir.length > 0) {
            basedir.pop();
            path.unshift("../");
        }

        return path.join("");
    }

    // returns first directory name of absolute path (lowercased)
    // mount("/Mount/dir/file") -> "mount"
    // mount("mount/dir/file") -> ""
    static mount(path) {
        if (path.startsWith("/")) {
            const i = path.indexOf("/", 1);
            if (i >= 0) {
                return path.substring(1, i).toLowerCase();
            } else {
                return path.substring(1).toLowerCase();
            }
        } else {
            return "";
        }
    }

    static filename(path) {
        const n = path.lastIndexOf("/");
        return path.substring(n + 1);
    }

    // dir("/root/dir/file") -> "/root/dir/"
    // dir("dir/file") -> "dir/"
    // dir("") -> ""
    static dir(path) {
        const n = path.lastIndexOf("/");
        return path.substring(0, n + 1);
    }

    // ext("/root/dir/file.Ext") -> ".Ext"
    static ext(path) {
        const i = path.lastIndexOf(".");
        return i >= 0 ? path.substring(i) : "";
    }

    static replaceExtension(path, ext) {
        const i = path.lastIndexOf(".");
        return i >= 0 ? path.substring(0, i) + ext : path + ext;
    }

    // split("/root/dir/file") -> ["/", "root/", "dir/", "file"]
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
