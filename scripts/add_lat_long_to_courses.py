#!/usr/bin/env python3
#
# Add latitude and longitude to the disc golf courses dataset. 
# Lat lon is a very rough estimate based only on the course's zip code.

import csv

def main():

    courses_filename = './data/disc_golf_usa.csv'
    postal_codes_filename = '../data/zipcode_lat_lon.csv'
    courses_with_postal_codes_filename = './usa_courses.csv'

    to_lat_lon = {}
    with open(postal_codes_filename, mode='r') as infile:
        next(infile)
        for line in infile:
            zip_code, lat, lon = line.strip().split(',')
            to_lat_lon[zip_code] = (lat, lon)

    lines = []
    with open(courses_filename, mode='r', encoding='iso-8859-1') as infile:
        reader = csv.reader(infile, delimiter=',')

        next(reader)
        for line in reader:
            zip_code = line[-3]
            if zip_code in to_lat_lon:
                lat, lon = to_lat_lon[zip_code]
                line.append(lat.strip())
                line.append(lon.strip())
                lines.append(line)
            else:
                print(f'Invalid postal code: {zip_code}')
    
    with open(courses_with_postal_codes_filename, mode='w', encoding='utf-8') as outfile:
        field_names = ['Course','City','State/Province','Country','Postal Code','# Holes','Rating','Approximate_Lat','Approximate_Lon']
        writer = csv.writer(outfile)
        writer.writerow(field_names)
        for row in lines:
            if int(row[5]) >= 18:
                writer.writerow(row)
    
    print(f'Result saved to {courses_with_postal_codes_filename}')

if __name__ == '__main__':
    main()
