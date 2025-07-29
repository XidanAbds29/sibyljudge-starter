// Test WebSocket connectivity
const testWebSocket = () => {
  const wsUrl =
    "wss://ftnicgwmghquikbwwxql.supabase.co/realtime/v1/websocket?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmljZ3dtZ2hxdWlrYnd3eHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NTIwMzksImV4cCI6MjA2NDMyODAzOX0.85tY_P5nvFWJVsA29Z26bH2YkoCbHkhUHtkRVThr5zg&vsn=1.0.0";

  console.log("Testing WebSocket connection...");

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("✅ WebSocket connection established successfully!");
    // Close the connection after successful test
    ws.close();
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket connection failed:", error);
  };

  ws.onclose = (event) => {
    if (event.wasClean) {
      console.log(
        `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
      );
    } else {
      console.error("Connection died");
    }
  };
};

export default testWebSocket;
