#!/usr/bin/env python3

#import requests
from bs4 import BeautifulSoup
import re
import time
import random
import os
import requests
from itertools import tee

COURSES_DIR = '/Users/jeremysigrist/Development/disc_golf_weather_forecast/forecasters-edge/scripts/data/all_courses/'

def pairwise(iterable):
    """
    s -> (s0,s1), (s1,s2), (s2, s3), ...
    """
    a, b = tee(iterable)
    next(b, None)
    return zip(a, b)

def get_course_page_urls():
    base_url = 'https://www.pdga.com/course-directory/advanced?title=&field_course_location_country=US&field_course_location_locality=&field_course_location_administrative_area=All&field_course_location_postal_code=&field_course_type_value=All&rating_value=All&field_course_holes_value=18-100&field_course_total_length_value=All&field_course_target_type_value=All&field_course_tee_type_value=All&field_location_type_value=All&field_course_camping_value=All&field_course_facilities_value=All&field_course_fees_value=All&field_course_handicap_value=All&field_course_private_value=All&field_course_signage_value=All&field_cart_friendly_value=All&page='

    course_urls = set()
    start = 0
    end = 80
    try:
        for i in range(start, end):
            url = base_url + str(i)
            print(f'Analyzing {i+1} of {end}')
            reqs = requests.get(url)

            soup = BeautifulSoup(reqs.text, 'html.parser')
            for link in soup.find_all('a'):
                href = str(link.get('href'))

                match = re.match(r'/course-directory/course/[\w-]+$', href)
                if match:
                    course_urls.add(f'https://www.pdga.com{href}')
            time.sleep(random.random() + 0.9) # Try not to get blocked
    except BaseException as err:
        print(err)

    outfile_name = './data/course_urls.csv'
    with open(outfile_name, mode='w', encoding='utf8') as outfile:
        courses = list(course_urls)
        courses.sort()
        outfile.writelines(f'{c}\n' for c in courses)
        print(f'Course urls saved to {outfile_name}')
        print('Use download_all_files.sh and rename_all_files.sh to download/rename all of these')

class DiscGolfCourse:

    def __init__(self):
        self.name: str = ''
        self.city: str = ''
        self.state: str = ''
        self.country: str = ''
        self.zipcode: str = ''
        self.numHoles: int = -1
        self.lat: str = ''
        self.lon: str = ''
        #TODO: More of these?

    def __str__(self) -> str:
        attributes = [self.name, str(self.numHoles), self.lat, self.lon]
        return ','.join(attributes)

    def headers(self) -> str:
        return 'Name, Number of holes, Latitude, Longitude'

def find_next_matching(tag, pattern, accessor):
    
    counter = 0
    while not re.match(pattern, accessor(tag)) and counter < 100:
        counter += 1
        tag = tag.next

    return str(tag.string)


def analyzeIndividualCourse(filename: str) -> DiscGolfCourse:

    with open(os.path.join(COURSES_DIR, filename), mode='r') as infile:
        contents = infile.read()
    
    course = DiscGolfCourse()
    
    soup = BeautifulSoup(contents, 'html.parser')
    f = lambda tag: tag.has_attr('property') and 'og:title' in str(tag.get('property'))
    tags = soup.find_all(f)
    course.name = str(tags[0].get('content'))

    f = lambda tag: tag.has_attr('property') and 'og:latitude' in str(tag.get('property'))
    tags = soup.find_all(f)
    course.lat = str(tags[0].get('content'))

    f = lambda tag: tag.has_attr('property') and 'og:longitude' in str(tag.get('property'))
    tags = soup.find_all(f)
    course.lon = str(tags[0].get('content'))
    
    f = lambda tag: tag.text and '# Holes' in tag.text
    a = [tag for tag in soup.find_all(f) if len(tag.text) < 100]
    course.numHoles = int(find_next_matching(a[0], r'[\d]+', lambda t: str(t.string)))
    
    if ',' in course.name:
        print(f'Warning: comma in name of course {course.name}')

    return course
    

def analyzeAllCourses():
    files = [f for f in os.listdir('./data/all_courses/') if f.endswith('.html')]
    files.sort()
    
    start = 0
    end = len(files)
    counter = 0
    courses = []
    try:
        for f in files[start:end]:
            courses.append(analyzeIndividualCourse(f))
            #time.sleep(random.random() + 0.4) # Try not to get blocked

            counter += 1
    except BaseException as err:
        print(f'Analyzed from {start} to {start + counter} of {len(files)} courses before encountering error:\n')
        print(err)
        print()


    outfile_path = 'data/usa_courses_full.csv'
    include_headers = not os.path.isfile(outfile_path)
    
    with open(outfile_path, mode='a', encoding='utf8') as outfile:
        if include_headers and courses:
            outfile.write(courses[0].headers() + '\n')
        outfile.writelines(f'{str(c)}\n' for c in courses)
        print(f'Added {counter} course(s) to {outfile_path}')
            

if __name__ == '__main__':
    start_time = time.time()
    analyzeAllCourses()
    end_time = time.time()
    print(f'Execution time: {end_time-start_time:.2f} seconds')
