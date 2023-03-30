#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
import re
import time
import random
import os
from itertools import tee

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

class DiscGolfCourse:

    def __init__(self):
        self.name: str = ''
        self.city: str = ''
        self.state: str = ''
        self.country: str = ''
        self.zipcode: str = ''
        self.numHoles: int = 18
        self.lat: str = ''
        self.lon: str = ''
        #TODO: More of these?

    def __str__(self) -> str:
        attributes = [self.name, self.city, self.state, self.country, self.zipcode, str(self.numHoles), self.lat, self.lon]
        return ','.join(attributes)

    def headers(self) -> str:
        return 'Name, City, State, Country, ZIP Code, Number of holes, Latitude, Longitude'

def analyzeIndividualCourse(url: str) -> DiscGolfCourse:

    fake_data_path = 'data/pdga_milo.html'
    #fake_data_path = 'data/pdga_eco.html'
    
    contents = ''
    if fake_data_path:
        with open(fake_data_path, mode='r') as infile:
            contents = infile.read()
    else:
        reqs = requests.get(url)
        contents = reqs.text
    
    course = DiscGolfCourse()
    
    soup = BeautifulSoup(contents, 'html.parser')
    f = lambda tag: tag.has_attr('class') and tag.string and 'og:title' in tag.string
    course.name = soup.find_all(f)[0].next.next.next.next.next.next.string
    
    f = lambda tag: tag.has_attr('class') and tag.string and 'og:latitude' in tag.string
    course.lat = soup.find_all(f)[0].next.next.next.next.next.next.contents[0]
    
    f = lambda tag: tag.has_attr('class') and tag.string and 'og:longitude' in tag.string
    course.lon = soup.find_all(f)[0].next.next.next.next.next.next.contents[0]
    
    f = lambda tag: tag.text and '12' in tag.text
    #f = lambda tag: tag.text and 'Holes' in tag.text
    a = [tag for tag in soup.find_all(f)]
    a = [v for v in a if len(v.text) < 100]
    print('\n'.join(str(a) for v in a))
    print(len(a))
    print('-------------------------------------------')
    print(a[0])
    v = a[0]
    print(v)
    for i in range(1, 40):
        v = v.next
        print(f'{i} {v}')
    print('-------------------------------------------')
    print(len(a))
    
    #course.name = ''
    course.city = ''
    course.state = ''
    course.country = ''
    course.zipcode = ''
    course.numHoles = 18
    #course.parkingLotLocation = ''
    #course.firstTeeLocation = ''

    if ',' in course.name:
        print(f'Warning: comma in name of course {course.name}')

    return course
    

def analyzeAllCourses():
    with open('./data/course_urls.csv', mode='r') as infile:
        course_urls = [line.strip() for line in infile.readlines()]

        start = 0
        end = 1 # len(course_urls)
        counter = 0
        courses = []
        try:
            for url in course_urls[start:end]:
                courses.append(analyzeIndividualCourse(url))
                #time.sleep(random.random() + 0.4) # Try not to get blocked

                counter += 1
        except BaseException as err:
            print(f'Analyzed from {start} to {start + counter} of {len(course_urls)} courses before encountering error:\n')
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
    analyzeAllCourses()
