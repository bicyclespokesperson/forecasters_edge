#!/usr/bin/env python3

import requests
import json

# Test endpoint
url = "http://localhost:8000/api/courses/123/submit"

# Test data with only rating, no description
data = {
    "user_id": "test_user_rating_only",
    "conditions_rating": 4
}

print("Testing condition submission with rating only (no description)...")
print(f"Sending to {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ SUCCESS: Rating-only submission accepted!")
        
        # Now fetch the data to verify it was saved
        get_url = "http://localhost:8000/api/courses/123/data"
        get_response = requests.get(get_url)
        
        if get_response.status_code == 200:
            course_data = get_response.json()
            print(f"\nFetched course data:")
            print(json.dumps(course_data, indent=2))
            
            if course_data.get("conditions"):
                conditions = course_data["conditions"]
                if conditions["rating"] == 4 and conditions["description"] is None:
                    print("✅ VERIFIED: Rating saved correctly with null description!")
                else:
                    print(f"⚠️  Unexpected conditions: {conditions}")
            else:
                print("❌ No conditions found in response")
        else:
            print(f"❌ Failed to fetch course data: {get_response.status_code}")
            
    else:
        print(f"❌ FAILED: {response.status_code}")
        if response.text:
            print(f"Response: {response.text}")
            
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to server. Is it running on localhost:8000?")
except Exception as e:
    print(f"❌ Error: {e}")