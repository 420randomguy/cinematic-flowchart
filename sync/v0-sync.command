#!/bin/bash

# Set paths
ZIP_PATH="/Users/maciejkuciara/Shibuya Dropbox/Maciej Kuciara/V0/cinematic-flowchart/sync/cinematic-flowchart.zip"
TEMP_DIR="/tmp/cinematic-flowchart-unzip"
REPO_DIR="/Users/maciejkuciara/Shibuya Dropbox/Maciej Kuciara/V0/cinematic-flowchart" # 👈 update this

# Stop if the ZIP doesn't exist
if [ ! -f "$ZIP_PATH" ]; then
  echo "Zip file not found: $ZIP_PATH"
  exit 1
fi

# Clear temp, unzip new version
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
unzip "$ZIP_PATH" -d "$TEMP_DIR"

# Copy unzipped content to repo (you can fine-tune which folder inside gets copied)
cp -R "$TEMP_DIR"/* "$REPO_DIR"

# Go to repo, commit, and push
cd "$REPO_DIR"
git add .
git commit -m "Auto-update from V0"
git push

echo "✅ Done! Changes pushed to GitHub."
