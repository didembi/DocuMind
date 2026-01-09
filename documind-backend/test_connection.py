#!/usr/bin/env python
"""Test Supabase and Gemini connections"""

import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

print("🔍 Testing Backend Configuration...\n")

# Test 1: Environment Variables
print("1️⃣ Checking Environment Variables:")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")

if not supabase_url or "YOUR-PROJECT" in supabase_url:
    print("   ❌ SUPABASE_URL is not set or using placeholder")
    exit(1)
else:
    print(f"   ✅ SUPABASE_URL: {supabase_url[:30]}...")

if not supabase_key or supabase_key == "your-anon-key-here":
    print("   ❌ SUPABASE_KEY is not set or using placeholder")
    exit(1)
else:
    print(f"   ✅ SUPABASE_KEY: {supabase_key[:30]}...")

if not gemini_key or gemini_key == "your-gemini-api-key-here":
    print("   ❌ GEMINI_API_KEY is not set or using placeholder")
    exit(1)
else:
    print(f"   ✅ GEMINI_API_KEY: {gemini_key[:30]}...")

# Test 2: Supabase Connection
print("\n2️⃣ Testing Supabase Connection:")
try:
    from supabase import create_client

    # Try with service role key first (bypasses RLS)
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    print(f"   Using service role key: {service_key[:30]}...")

    client = create_client(supabase_url, service_key)
    response = client.table('documents').select('*', count='exact').execute()
    print(f"   ✅ Connected! Documents count: {response.count}")
except Exception as e:
    print(f"   ❌ Connection failed: {e}")
    exit(1)

# Test 3: Gemini API
print("\n3️⃣ Testing Gemini API:")
try:
    import google.generativeai as genai
    genai.configure(api_key=gemini_key)

    # Test embedding
    result = genai.embed_content(
        model="models/embedding-001",
        content="test",
        task_type="semantic_similarity"
    )
    print(f"   ✅ Gemini API working! Embedding size: {len(result['embedding'])}")
except Exception as e:
    print(f"   ❌ Gemini API failed: {e}")
    exit(1)

print("\n🎉 All tests passed! Backend is ready to use.")
