#!/bin/bash

# Set the file name of the urls to download
URL_FILE="../course_urls.csv"

# Loop through each line in the file
while IFS= read -r url
do
  # Download the url
  wget "$url"
  #echo "Downloading " "$url"
  
  # Generate a random number between 0.5 and 1.5 seconds
  sleep "$(awk -v min=0.5 -v max=1.5 'BEGIN{srand(); print min+rand()*(max-min)}')"

done < "$URL_FILE"
