#!/bin/sh

"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-16.png -w 16 -h 16
"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-32.png -w 32 -h 32
"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-48.png -w 48 -h 48
"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-64.png -w 64 -h 64
"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-128.png -w 128 -h 128
"${inkscape:=inkscape}" polywonks.svg -C -j -i black -e polywonks-black-256.png -w 256 -h 256

"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-16.png -w 16 -h 16
"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-32.png -w 32 -h 32
"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-48.png -w 48 -h 48
"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-64.png -w 64 -h 64
"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-128.png -w 128 -h 128
"${inkscape:=inkscape}" polywonks.svg -C -j -i white -e polywonks-white-256.png -w 256 -h 256

magick convert \
    polywonks-black-16.png \
    polywonks-black-32.png \
    polywonks-black-48.png \
    polywonks-black-64.png \
    polywonks-black-128.png \
    polywonks-black-256.png \
    polywonks-black.ico

magick convert \
    polywonks-white-16.png \
    polywonks-white-32.png \
    polywonks-white-48.png \
    polywonks-white-64.png \
    polywonks-white-128.png \
    polywonks-white-256.png \
    polywonks-white.ico
