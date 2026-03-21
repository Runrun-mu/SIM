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
      description: 'Classic game theory: cooperate or defect.',
    },
    {
      type: 'wealth-distribution',
      name: 'Wealth Distribution',
      description: 'Trade resources, observe inequality.',
    },
    {
      type: 'public-goods',
      name: 'Public Goods Game',
      description: 'Contribute to a shared pool. Free-rider problem.',
    },
    {
      type: 'ultimatum-game',
      name: 'Ultimatum Game',
      description: 'Propose a split; accept or reject.',
    },
    {
      type: 'dictator-game',
      name: 'Dictator Game',
      description: 'Dictator decides the split. Study altruism.',
    },
    {
      type: 'hawk-dove',
      name: 'Hawk-Dove Game',
      description: 'Aggressive vs peaceful strategies.',
    },
    { type: 'trust-game', name: 'Trust Game', description: 'Invest and return. Build trust.' },
    { type: 'minority-game', name: 'Minority Game', description: 'Choose A or B. Minority wins.' },
    {
      type: 'tragedy-of-commons',
      name: 'Tragedy of the Commons',
      description: 'Shared resource extraction dilemma.',
    },
    {
      type: 'axelrod-tournament',
      name: 'Axelrod Tournament',
      description: 'Iterated PD round-robin tournament.',
    },
    {
      type: 'schelling-segregation',
      name: 'Schelling Segregation',
      description: 'Agents prefer similar neighbors.',
    },
    {
      type: 'voting-model',
      name: 'Voting Model',
      description: 'Multi-round voting for candidates.',
    },
    { type: 'sir-epidemic', name: 'SIR Epidemic', description: 'Disease spreading simulation.' },
    {
      type: 'social-influence',
      name: 'Social Influence',
      description: 'Opinion dynamics and consensus.',
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
