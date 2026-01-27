#!/usr/bin/env python
"""Test Supabase and Ollama connections"""

import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

print("🔍 Testing Backend Configuration...\n")

# Test 1: Environment Variables
print("1️⃣ Checking Environment Variables:")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
ollama_url = os.getenv("OLLAMA_BASE_URL")
ollama_model = os.getenv("OLLAMA_MODEL")

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

if not ollama_url:
    print("   ❌ OLLAMA_BASE_URL is not set")
    exit(1)
else:
    print(f"   ✅ OLLAMA_BASE_URL: {ollama_url}")

if not ollama_model:
    print("   ❌ OLLAMA_MODEL is not set")
    exit(1)
else:
    print(f"   ✅ OLLAMA_MODEL: {ollama_model}")

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

# Test 3: Ollama Connection
print("\n3️⃣ Testing Ollama Connection:")
try:
    import httpx

    # Test Ollama API
    response = httpx.get(f"{ollama_url}/api/tags", timeout=10.0)
    response.raise_for_status()
    models = response.json()

    # Check if our model is available
    available_models = [model['name'] for model in models.get('models', [])]
    if ollama_model in available_models:
        print(f"   ✅ Ollama working! Model '{ollama_model}' is available")
        print(f"   Available models: {available_models}")
    else:
        print(f"   ⚠️ Ollama working but model '{ollama_model}' not found")
        print(f"   Available models: {available_models}")
        print("   Run: ollama pull {ollama_model}")
except Exception as e:
    print(f"   ❌ Ollama connection failed: {e}")
    print("   Make sure Ollama is running: ollama serve")
    exit(1)

print("\n🎉 All tests passed! Backend is ready to use.")
