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


def test_submit_combined():
    print("\nTesting POST /api/courses/1/submit endpoint (combined)...")
    combined_data = {
        "user_id": "test_user",
        "ratings": {
            "quality": 4,
            "difficulty": 3
        },
        "conditions_rating": 5,
        "conditions_description": "excellent conditions"
    }
    response = requests.post(
        f"{BASE_URL}/api/courses/1/submit", 
        json=combined_data
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Combined submission successful (check server output for verbose logs)")
    else:
        print(f"Response: {response.text}")

def test_submit_combined_optional():
    print("\nTesting POST /api/courses/2/submit endpoint (optional fields)...")
    combined_data = {
        "user_id": "test_user",
        "conditions_rating": 3,
        "conditions_description": "muddy"
    }
    response = requests.post(
        f"{BASE_URL}/api/courses/2/submit", 
        json=combined_data
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Combined submission with optional fields successful (check server output for verbose logs)")
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
        test_submit_combined()
        test_submit_combined_optional()
        print("\n" + "=" * 50)
        print("Tests completed! Check the backend terminal for verbose output.")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend. Make sure it's running on localhost:3000")
        print("Start it with: cargo run -- -v")