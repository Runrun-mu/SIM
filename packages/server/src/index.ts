import websocket from '@fastify/websocket';
import { SERVER_PORT, WS_PATH } from '@sim/shared';
import Fastify from 'fastify';
import { SimulationHandler } from './ws/handler';

const server = Fastify({ logger: true });

await server.register(websocket);

server.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

server.get('/api/scenarios', async () => {
  return [
    {
      type: 'prisoners-dilemma',
      name: "Prisoner's Dilemma",
      description:
        'Agents are randomly paired and must choose to cooperate or defect. Classic game theory scenario.',
    },
    {
      type: 'wealth-distribution',
      name: 'Wealth Distribution',
      description:
        'Agents trade resources with each other. Observe wealth concentration and inequality dynamics.',
    },
  ];
});

server.register(async (fastify) => {
  fastify.get(WS_PATH, { websocket: true }, (socket, _req) => {
    const handler = new SimulationHandler(socket);

    socket.on('message', (message: Buffer) => {
      handler.handleMessage(message.toString());
    });

    socket.on('close', () => {
      server.log.info('WebSocket client disconnected');
    });

    socket.on('error', (err: Error) => {
      server.log.error(err, 'WebSocket error');
    });
  });
});

const start = async () => {
  try {
    await server.listen({ port: SERVER_PORT, host: '0.0.0.0' });
    server.log.info(`Server running on http://localhost:${SERVER_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export { server };
