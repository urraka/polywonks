import { Path } from "./support/path.js";
import { cfg } from "./settings.js";

export class File {
    static read(type, path, callback) {
        path = Path.resolve("/", path);
        path = File.exists(path) || path;

        if (path.startsWith("/soldat/") || path.startsWith("/polydrive/")) {
            if (window.location.hostname.endsWith(".github.io")) {
                if (type === "json" && (path === "/soldat/" || path === "/polydrive/")) {
                    setTimeout(() => callback([]));
                } else {
                    setTimeout(() => callback(null));
                }
                return;
            } else {
                path = "/api/read" + path;
            }
        } else if (path.startsWith("/library/")) {
            path = cfg("app.library-url") + path.substring("/library/".length);
        } else {
            setTimeout(() => callback(null));
            return;
        }

        const img = (type === "image");
        const req = (img ? new Image() : new XMLHttpRequest());
        req.addEventListener("load", () => callback(img ? req : req.response));
        req.addEventListener("error", () => callback(null));
        req.addEventListener("abort", () => callback(null));

        if (img) {
            req.crossOrigin = "Anonymous";
            req.src = encodeURI(path);
        } else {
            req.responseType = type;
            req.open("GET", encodeURI(path));
            req.send();
        }

        return req;
    }

    static readBuffer(path, callback) {
        return this.read("arraybuffer", path, callback);
    }

    static readText(path, callback) {
        return this.read("text", path, callback);
    }

    static readJson(path, callback) {
        return this.read("json", path, callback);
    }

    static readImage(path, callback) {
        return this.read("image", path, callback);
    }

    static write(path, data, callback) {
        path = Path.resolve("/", path);

        if (!path.startsWith("/polydrive/") && !path.startsWith("/soldat/")) {
            setTimeout(() => callback(false));
            return;
        }

        path = "/api/write" + path;

        const req = new XMLHttpRequest();
        req.addEventListener("load", () => callback && callback(true));
        req.addEventListener("error", () => callback && callback(false));
        req.addEventListener("abort", () => callback && callback(false));
        req.open("PUT", path);
        req.send(data);
    }

    static refresh(mount, callback) {
        const tree = [];
        let count = 0;
        let total = 0;

        function onload(list, dir) {
            if (list) {
                list = list.map(path => dir + path);
                tree.push(...list);
                list.forEach(path => path.endsWith("/") && read(path));
            }

            if (++count == total) {
                tree.sort();
                File.tree = File.tree || {};
                File.tree[mount] = tree;
                callback(File.tree[mount].slice(0));
            }
        }

        function read(dir) {
            total++;
            File.read("json", dir, list => onload(list, dir));
        }

        if (mount === "soldat" || mount === "polydrive") {
            read("/" + mount + "/");
        } else if (mount === "library") {
            total++;
            File.read("text", "/library/" + cfg("app.library-index"), data => {
                const list = data ? data.split(/\r?\n/).filter(path => path !== "" && !path.endsWith("/")) : [];
                onload(list, "/library/");
            });
        } else {
            throw new Error("Invalid mount");
        }
    }

    static exists(path) {
        if (!path.startsWith("/")) {
            throw new Error("File.exists(path) - path is not absolute.");
        }

        const mount = path.substring(1).split("/").shift();
        path = path.toLowerCase();
        return File.tree && File.tree[mount] && File.tree[mount].find(entry => entry.toLowerCase() === path);
    }
}
