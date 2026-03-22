// @ts-nocheck — R3F v8 JSX intrinsic elements not typed
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { useSimulationStore } from '../stores/simulation';
import AgentNode from './AgentNode';

const AGENT_COLORS = [
  '#00f0ff',
  '#7b2ff7',
  '#ff2d55',
  '#00ff88',
  '#ffaa00',
  '#ff6b6b',
  '#4ecdc4',
  '#a855f7',
];

function arrangeInCircle(count: number, radius = 3): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
  });
}

function Scene() {
  const { agents, selectedAgentId, selectAgent, tickHistory } = useSimulationStore();

  const homePositions = useMemo(() => arrangeInCircle(agents.length), [agents.length]);
  const latestTick = tickHistory[tickHistory.length - 1];

  // Build interaction targets: agentId → { partnerId, action, meetingPoint }
  const interactionMap = useMemo(() => {
    const map = new Map<
      string,
      { partnerId: string; action: string; meetingPoint: [number, number, number] }
    >();
    if (!latestTick) return map;

    for (const interaction of latestTick.interactions) {
      const [idA, idB] = interaction.participants;
      if (!idA || !idB) continue;

      const idxA = agents.findIndex((a) => a.id === idA);
      const idxB = agents.findIndex((a) => a.id === idB);
      if (idxA < 0 || idxB < 0) continue;

      const posA = homePositions[idxA];
      const posB = homePositions[idxB];
      if (!posA || !posB) continue;

      // Meeting point: midpoint between the two agents, slightly raised
      const meetX = (posA[0] + posB[0]) / 2;
      const meetZ = (posA[2] + posB[2]) / 2;
      const meetingPoint: [number, number, number] = [meetX, 0, meetZ];

      const actionA = interaction.actions[idA] ?? '';
      const actionB = interaction.actions[idB] ?? '';

      map.set(idA, { partnerId: idB, action: actionA, meetingPoint });
      map.set(idB, { partnerId: idA, action: actionB, meetingPoint });
    }
    return map;
  }, [latestTick, agents, homePositions]);

  return (
    <>
      {/* Bright, clear lighting */}
      <ambientLight intensity={0.7} color="#e8e0ff" />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} color="#7b2ff7" />
      <pointLight position={[0, 6, 0]} intensity={0.6} color="#00f0ff" distance={20} />

      {/* Ground */}
      <Grid
        position={[0, -0.5, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a3e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a5e"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      <ContactShadows
        position={[0, -0.49, 0]}
        scale={15}
        blur={2}
        far={4}
        opacity={0.4}
        color="#000020"
      />

      {/* Agents */}
      {agents.map((agent, i) => {
        const homePos = homePositions[i];
        if (!homePos) return null;
        const agentState = latestTick?.agentStates.find((s) => s.identity.id === agent.id);
        const wealth = agentState?.resources.wealth ?? agent.wealth;
        const interactionInfo = interactionMap.get(agent.id);

        return (
          <AgentNode
            key={agent.id}
            homePosition={homePos}
            name={agent.name}
            agentId={agent.id}
            wealth={wealth}
            isSelected={selectedAgentId === agent.id}
            color={AGENT_COLORS[i % AGENT_COLORS.length] ?? '#ffffff'}
            onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
            interactionTarget={interactionInfo?.meetingPoint ?? null}
            actionLabel={interactionInfo?.action ?? null}
          />
        );
      })}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={15}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function AgentGraph() {
  return (
    <Canvas
      camera={{ position: [0, 5, 8], fov: 60 }}
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #151530 50%, #1a1a3e 100%)' }}
      shadows
    >
      <Scene />
    </Canvas>
  );
}
