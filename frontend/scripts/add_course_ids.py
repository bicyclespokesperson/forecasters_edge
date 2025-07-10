#!/usr/bin/env -S uv run
# /// script
# dependencies = []
# ///

import csv
from pathlib import Path

def add_course_ids():
    """Add sequential ID numbers to the USA courses CSV file."""
    
    csv_path = Path("data/usa_courses.csv")
    backup_path = Path("data/usa_courses.csv.backup")
    
    # Create backup
    if csv_path.exists():
        csv_path.replace(backup_path)
        print(f"Created backup: {backup_path}")
    
    # Read the backup and add IDs
    courses = []
    with open(backup_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for i, row in enumerate(reader, 1):
            if row and len(row) >= 4:  # Skip empty rows
                courses.append([i] + row)
    
    # Write new file with ID column
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ID'] + header)
        writer.writerows(courses)
    
    print(f"Added IDs to {len(courses)} courses")
    print(f"Updated: {csv_path}")

if __name__ == "__main__":
    add_course_ids()