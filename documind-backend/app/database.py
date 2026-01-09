from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client with service role key (bypasses RLS)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

async def test_connection():
    """Test Supabase connection"""
    try:
        response = supabase.table('documents').select('*', count='exact').execute()
        print(f"✅ Supabase connected. Documents count: {response.count}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
