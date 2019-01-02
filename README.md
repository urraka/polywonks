#### Build server

To build the server you need to install [Go](https://golang.org/).

```bash
go get github.com/urraka/open-golang/open
go get github.com/getlantern/systray
go get github.com/mitchellh/go-homedir

# windows
go get github.com/akavel/rsrc
rsrc -arch=amd64 -ico icon/polywonks-black.ico,icon/polywonks-white.ico
go build -ldflags -H=windowsgui
rm rsrc.syso

# linux
sudo apt-get install libgtk-3-dev libappindicator3-dev
go build
```
