#!/bin/bash
# Starts JupyterLab configured for brian.os embedding
# Usage: ./start-jupyter.sh

JUPYTER=$(which jupyter)

echo "Starting JupyterLab for brian.os..."
echo "  URL:   http://localhost:8888/lab?token=brianOS"
echo "  Root:  $(pwd)/notebooks"
echo ""

$JUPYTER lab \
  --no-browser \
  --port=8888 \
  --ServerApp.token='brianOS' \
  --ServerApp.allow_origin='*' \
  --ServerApp.root_dir="$(dirname "$0")/notebooks"
