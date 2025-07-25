#!/usr/bin/env python3
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Get the most recently inserted problem
result = supabase.table('Problem').select('*').order('problem_id', desc=True).limit(1).execute()

if result.data:
    problem = result.data[0]
    print(f"Problem: {problem['external_id']} - {problem['title']}")
    print(f"URL: {problem['url']}")
    
    # Parse and display samples
    if problem['samples']:
        samples = json.loads(problem['samples'])
        print(f"\nFound {len(samples)} sample(s):")
        
        for i, sample in enumerate(samples, 1):
            print(f"\n--- Sample {i} ---")
            print(f"Input (repr): {repr(sample['input'])}")
            print(f"Output (repr): {repr(sample['output'])}")
            print(f"Input (display):\n{sample['input']}")
            print(f"Output (display):\n{sample['output']}")
    else:
        print("No samples found")
else:
    print("No problems found in database")
