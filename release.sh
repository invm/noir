#!/bin/bash
# requires cargo-bump and pnpm

type=$1
# valivate type is major|minor|patch or matches \d\.\d\.\d
valid=$(echo "$type" | grep -E "major|minor|patch|^[0-9]+\.[0-9]+\.[0-9]+$")
if [ "$valid" ]; then
	echo "Bumping $type version"
	cd src-tauri || exit
	cargo bump "$type"
	cargo check
	cd .. || exit
	git add .
	git commit -m "chore: bump rust version to $type"
	pnpm release --release-as "$type"
else
	echo "Invalid bump type"
	exit 1
fi
