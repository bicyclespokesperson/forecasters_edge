#!/usr/bin/env bash

set -e

# Set the directory containing the files to rename
DIRECTORY="./all_courses"

# Loop through all files in the directory
for FILE in "$DIRECTORY"/* ; do
  # Check if the file is a regular file (i.e. not a directory)
  if [ -f "$FILE" ]; then
    # Get the current file name without the extension
    FILENAME=$(basename "$FILE" | cut -f 1 -d '.')

    # Rename the file to include the ".html" extension
    mv "$FILE" "$DIRECTORY/$FILENAME.html"
  fi
done
