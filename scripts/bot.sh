#!/usr/bin/env bash

SCRIPT_PATH="$(readlink -f "$0")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
exec bun "$SCRIPT_DIR/cli.ts" -t light -b white "$@"

