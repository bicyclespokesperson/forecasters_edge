#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#     "requests"
# ]
# ///

"""
A script to send various requests to the Forecaster's Edge backend API.
"""

import argparse
import requests
import json

HOSTNAME = "http://localhost:8000/"
BASE_URL = f"{HOSTNAME}/api"


def send_request(request_type):
    """Sends a request to the backend based on the request_type."""

    endpoints = {
        "health": f"{HOSTNAME}/health",
        "rating-dimensions": f"{BASE_URL}/rating-dimensions",
        "course-data": f"{BASE_URL}/courses/613/data",
        "submit-combined": f"{BASE_URL}/courses/613/submit",
        "bulk-course-data": f"{BASE_URL}/courses/bulk?ids=101,102,103",
    }

    if request_type not in endpoints:
        print(f"Error: Invalid request type '{request_type}'")
        return

    url = endpoints[request_type]

    try:
        if request_type == "submit-combined":
            headers = {"Content-Type": "application/json"}
            data = {
                "user_id": "test_user_789",
                "ratings": {"difficulty": 3, "quality": 4},
                "conditions_rating": 5,
                "conditions_description": "excellent conditions today",
            }

            response = requests.post(url, headers=headers, data=json.dumps(data))
        else:
            response = requests.get(url)

        response.raise_for_status()  # Raise an exception for bad status codes

        print(f"Request to {url} successful!")

        if response.text:
            try:
                print("Response JSON:")
                print(json.dumps(response.json(), indent=2))
            except json.JSONDecodeError:
                print("Response Text:")
                print(response.text)

    except requests.exceptions.RequestException as e:
        print(f"Error sending request to {url}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Send test requests to the Forecaster's Edge backend."
    )
    parser.add_argument(
        "request_type",
        choices=[
            "health",
            "rating-dimensions",
            "course-data",
            "submit-combined",
            "bulk-course-data",
        ],
        help="The type of request to send.",
    )

    args = parser.parse_args()
    send_request(args.request_type)
