#!/usr/bin/env bash

set -euo pipefail

REGISTRY="dhi.io"
TOKEN=""
USER=""

if [ -n "$CODESPACES" ]; then    
    TOKEN="$DOCKERHUB_TOKEN"
    USER="$DOCKERHUB_USER"
elif command -v doppler &> /dev/null; then    
    TOKEN=$(doppler secrets get DOCKERHUB_TOKEN --plain)
    USER=$(doppler secrets get DOCKERHUB_USER --plain)
fi

if [ -z "$TOKEN" ] || [ -z "$USER" ]; then
    echo "Error: No token or user found!"
    exit 1
fi

echo "$TOKEN" | docker login "$REGISTRY" -u "$USER" --password-stdin
