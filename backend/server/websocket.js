const WebSocket = require("ws");
const { authenticateToken } = require("./middleware/authMiddleware");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // Keep track of connected clients
  const clients = new Set();

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    // Add client to the set
    clients.add(ws);

    // Handle client disconnection
    ws.on("close", () => {
      console.log("Client disconnected");
      clients.delete(ws);
    });
  });

  // Function to broadcast updates to all connected clients
  const broadcastUpdate = (type, data) => {
    const message = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  return {
    wss,
    broadcastUpdate,
  };
}

module.exports = setupWebSocket;
