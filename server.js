const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store all drawings
const drawings = [];
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Send existing drawings to new client
  ws.send(JSON.stringify({
    type: 'init',
    drawings: drawings
  }));

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'draw') {
        // Add to drawings array
        drawings.push(data.drawing);
        
        // Send to all other clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'draw',
              drawing: data.drawing
            }));
          }
        });
      }
      
      if (data.type === 'clear') {
        // Clear all drawings
        drawings.length = 0;
        
        // Notify all clients
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'clear'
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Start server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Whiteboard server running on port ${PORT}`);
});