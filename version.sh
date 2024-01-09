#!/bin/bash
set -e

type=$1
if [[ $type == "major" || $type == "minor" || $type == "patch" ]]; then
  echo "Bumping $type version"
  npm version $type
  cd src-tauri
  cargo bump $type
  git commit --amend
else
  echo "Invalid bump type"
  exit 1
fi
