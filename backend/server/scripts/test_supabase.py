# Simple script to test Supabase connectivity
import requests
import websocket
import json

def test_supabase_connectivity():
    # Test HTTPS connection
    supabase_url = "https://ftnicgwmghquikbwwxql.supabase.co"
    try:
        response = requests.get(supabase_url)
        print(f"✅ HTTPS connection successful (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ HTTPS connection failed: {str(e)}")

    # Test WebSocket connection
    ws_url = "wss://ftnicgwmghquikbwwxql.supabase.co/realtime/v1/websocket"
    try:
        ws = websocket.create_connection(ws_url, timeout=10)
        print("✅ WebSocket connection successful")
        ws.close()
    except Exception as e:
        print(f"❌ WebSocket connection failed: {str(e)}")

if __name__ == "__main__":
    print("Testing Supabase connectivity...")
    test_supabase_connectivity()
