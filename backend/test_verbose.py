#!/usr/bin/env python3
"""
Test script to demonstrate verbose logging in the backend API.
Run the backend with: cargo run -- -v
Then run this script: python test_verbose.py
"""

import requests
import json

BASE_URL = "http://localhost:3000"

def test_health():
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}, Response: {response.text}")

def test_bulk_course_data():
    print("\nTesting /api/courses/bulk endpoint...")
    response = requests.get(f"{BASE_URL}/api/courses/bulk?ids=1,2,3")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Response received (check server output for verbose logs)")
    else:
        print(f"Response: {response.text}")

def test_single_course_data():
    print("\nTesting /api/courses/1/data endpoint...")
    response = requests.get(f"{BASE_URL}/api/courses/1/data")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Response received (check server output for verbose logs)")
    else:
        print(f"Response: {response.text}")

def test_submit_rating():
    print("\nTesting POST /api/courses/1/ratings endpoint...")
    rating_data = {
        "user_id": "test_user",
        "ratings": {
            "quality": 4,
            "difficulty": 3
        }
    }
    response = requests.post(
        f"{BASE_URL}/api/courses/1/ratings", 
        json=rating_data
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Rating submitted (check server output for verbose logs)")
    else:
        print(f"Response: {response.text}")

def test_submit_condition():
    print("\nTesting POST /api/courses/1/conditions endpoint...")
    condition_data = {
        "user_id": "test_user",
        "rating": 4,
        "description": "great conditions"
    }
    response = requests.post(
        f"{BASE_URL}/api/courses/1/conditions", 
        json=condition_data
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Condition submitted (check server output for verbose logs)")
    else:
        print(f"Response: {response.text}")

if __name__ == "__main__":
    print("Testing backend API endpoints...")
    print("Make sure to run the backend with: cargo run -- -v")
    print("=" * 50)
    
    try:
        test_health()
        test_bulk_course_data()
        test_single_course_data()
        test_submit_rating()
        test_submit_condition()
        print("\n" + "=" * 50)
        print("Tests completed! Check the backend terminal for verbose output.")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend. Make sure it's running on localhost:3000")
        print("Start it with: cargo run -- -v")