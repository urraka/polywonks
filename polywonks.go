package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/getlantern/systray"
	homedir "github.com/mitchellh/go-homedir"
	"github.com/urraka/open-golang/open"
)

func httpErrorHandler(code int) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, http.StatusText(code), code)
	})
}

func badRequestHandler() http.Handler       { return httpErrorHandler(http.StatusBadRequest) }
func forbiddenHandler() http.Handler        { return httpErrorHandler(http.StatusForbidden) }
func internalErrorHandler() http.Handler    { return httpErrorHandler(http.StatusInternalServerError) }
func methodNotAllowedHandler() http.Handler { return httpErrorHandler(http.StatusMethodNotAllowed) }

func readHandler(path string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		file, err := os.Open(path)
		if err != nil {
			http.NotFoundHandler().ServeHTTP(w, r)
			return
		}
		defer file.Close()

		info, err := file.Stat()
		if err != nil {
			http.NotFoundHandler().ServeHTTP(w, r)
			return
		}

		if strings.HasSuffix(path, "/") {
			if !info.IsDir() {
				http.NotFoundHandler().ServeHTTP(w, r)
				return
			}

			dirs, err := file.Readdir(-1)
			if err != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}

			list := make([]string, len(dirs))
			for i := 0; i < len(dirs); i++ {
				if dirs[i].IsDir() {
					list[i] = dirs[i].Name() + "/"
				} else {
					list[i] = dirs[i].Name()
				}
			}

			data, err := json.Marshal(list)
			if err != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Content-Length", strconv.Itoa(len(data)))
			w.WriteHeader(http.StatusOK)
			io.Copy(w, bytes.NewReader(data))
		} else {
			if info.IsDir() {
				http.NotFoundHandler().ServeHTTP(w, r)
				return
			}

			size := info.Size()
			mimeType := mime.TypeByExtension(filepath.Ext(path))

			if mimeType == "" {
				var buf [512]byte
				n, _ := io.ReadFull(file, buf[:])
				mimeType = http.DetectContentType(buf[:n])
				if _, err := file.Seek(0, io.SeekStart); err != nil {
					internalErrorHandler().ServeHTTP(w, r)
					return
				}
			}

			w.Header().Set("Content-Type", mimeType)
			w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
			w.WriteHeader(http.StatusOK)
			io.Copy(w, file)
		}
	})
}

func hasExtension(path string, allowedExts []string) bool {
	pathExt := strings.ToLower(filepath.Ext(path))
	for _, ext := range allowedExts {
		if pathExt == ext {
			return true
		}
	}
	return false
}

func writeHandler(path string, allowedExts []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(path, "/") {
			if os.MkdirAll(path, os.ModePerm) != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}

			w.WriteHeader(http.StatusOK)
		} else {
			dir, filepath := filepath.Split(path)

			if !hasExtension(filepath, allowedExts) {
				forbiddenHandler().ServeHTTP(w, r)
				return
			}

			if os.MkdirAll(dir, os.ModePerm) != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}

			file, err := os.Create(path)
			if err != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}
			defer file.Close()

			if _, err := io.Copy(file, r.Body); err != nil {
				internalErrorHandler().ServeHTTP(w, r)
				return
			}

			w.WriteHeader(http.StatusOK)
		}
	})
}

func sanitizeRequestPath(path string) (bool, string) {
	if !strings.HasPrefix(path, "/") || strings.Contains(path, "\\") {
		return false, path
	}

	for _, str := range strings.Split(path, "/") {
		if str == "." || str == ".." {
			return false, path
		}
	}

	return true, path
}

func filesHandler(method string, root string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != method {
			methodNotAllowedHandler().ServeHTTP(w, r)
			return
		}

		if valid, path := sanitizeRequestPath(r.URL.Path); valid {
			switch method {
			case http.MethodGet:
				readHandler(root+path).ServeHTTP(w, r)
			case http.MethodPut:
				writeHandler(root+path, []string{".pms", ".polywonks", ".zip"}).ServeHTTP(w, r)
			default:
				methodNotAllowedHandler().ServeHTTP(w, r)
			}
		} else {
			badRequestHandler().ServeHTTP(w, r)
		}
	})
}

func dummyHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			methodNotAllowedHandler().ServeHTTP(w, r)
			return
		}

		if valid, path := sanitizeRequestPath(r.URL.Path); valid && path == "/" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "[]")
		} else {
			http.NotFoundHandler().ServeHTTP(w, r)
		}
	})
}

func sanitizeConfigPath(path string) string {
	expandedPath, _ := homedir.Expand(path)
	return strings.TrimRight(strings.Replace(expandedPath, "\\", "/", -1), "/")
}

func loadConfig(path string) map[string]string {
	loaded := map[string]string{}
	defaults := map[string]string{
		"addr":      "localhost:22122",
		"soldat":    "",
		"polydrive": sanitizeConfigPath("~/polydrive"),
		"icon":      sanitizeConfigPath("icon/polywonks-white.ico"),
		"launch":    "default",
	}

	if file, err := os.Open(path); err == nil {
		defer file.Close()
		scanner := bufio.NewScanner(file)

		for scanner.Scan() {
			parts := strings.SplitN(scanner.Text(), "=", 2)

			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				if _, exists := defaults[key]; exists {
					loaded[key] = strings.TrimSpace(parts[1])
				}
			}
		}

		if err := scanner.Err(); err != nil {
			log.Println("Error while loading config")
		}
	}

	loaded["soldat"] = sanitizeConfigPath(loaded["soldat"])
	loaded["polydrive"] = sanitizeConfigPath(loaded["polydrive"])
	loaded["icon"] = sanitizeConfigPath(loaded["icon"])

	if loaded["addr"] == "" {
		loaded["addr"] = defaults["addr"]
	}

	if loaded["polydrive"] == "" {
		loaded["polydrive"] = defaults["polydrive"]
	}

	if loaded["icon"] == "" {
		loaded["icon"] = defaults["icon"]
	}

	return loaded
}

func handleStripPrefix(path string, handler http.Handler) {
	http.Handle(path, http.StripPrefix(strings.TrimRight(path, "/"), handler))
}

func startServer(cfg map[string]string) {
	if cfg["soldat"] != "" {
		handleStripPrefix("/api/read/soldat/", filesHandler(http.MethodGet, cfg["soldat"]))
		handleStripPrefix("/api/write/soldat/", filesHandler(http.MethodPut, cfg["soldat"]))
	} else {
		handleStripPrefix("/api/read/soldat/", dummyHandler())
	}

	handleStripPrefix("/api/read/polydrive/", filesHandler(http.MethodGet, cfg["polydrive"]))
	handleStripPrefix("/api/write/polydrive/", filesHandler(http.MethodPut, cfg["polydrive"]))

	http.Handle("/api/", badRequestHandler())
	http.Handle("/", http.FileServer(http.Dir("editor")))
	http.ListenAndServe(cfg["addr"], nil)
}

func launchEditor(cfg map[string]string) {
	url := "http://" + cfg["addr"] + "/"
	if cfg["launch"] == "default" {
		open.Start(url)
	} else {
		open.StartWith(url, cfg["launch"])
	}
}

func main() {
	cfg := loadConfig("polywonks.cfg")
	os.MkdirAll(cfg["polydrive"], os.ModePerm)

	onReady := func() {
		if file, err := os.Open(cfg["icon"]); err == nil {
			if iconBytes, err := ioutil.ReadAll(file); err == nil {
				systray.SetIcon(iconBytes)
			}
			file.Close()
		}

		systray.SetTitle("Polywonks")
		systray.SetTooltip("Polywonks")

		launch := systray.AddMenuItem("Launch", "Open polywonks editor in the browser")
		polydrive := systray.AddMenuItem("Polydrive", "Open polydrive directory")
		shutdown := systray.AddMenuItem("Shutdown", "Shutdown polywonks server")

		go func() {
			for {
				select {
				case <-shutdown.ClickedCh:
					systray.Quit()
				case <-polydrive.ClickedCh:
					open.Start(cfg["polydrive"])
				case <-launch.ClickedCh:
					launchEditor(cfg)
				}
			}
		}()

		go func() {
			startServer(cfg)
			systray.Quit()
		}()

		launchEditor(cfg)
	}

	onExit := func() {
		os.Exit(0)
	}

	systray.Run(onReady, onExit)
}
