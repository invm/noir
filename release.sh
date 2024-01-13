#!/bin/bash

type=$1
# valivate type is major|minor|patch or matches \d\.\d\.\d
valid=$(echo "$type" | grep -E "major|minor|patch|^[0-9]+\.[0-9]+\.[0-9]+$")
if [ "$valid" ]; then
	echo "Bumping $type version"
	pnpm release --release-as "$type"
	cd src-tauri || exit
	cargo bump "$type"
	git commit --amend
else
	echo "Invalid bump type"
	exit 1
fi
