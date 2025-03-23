import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

interface CallMessage {
  fromUserId: string;
  toUserId: string;
  audioUrl: string;
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});

export function broadcastCall(message: CallMessage) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

export default wss;