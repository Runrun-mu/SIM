// @ts-nocheck — R3F v8 JSX intrinsic elements not typed
import { OrbitControls, Stars } from '@react-three/drei';
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

function InteractionLines() {
  const { tickHistory, agents } = useSimulationStore();
  const latestTick = tickHistory[tickHistory.length - 1];

  const positions = useMemo(() => arrangeInCircle(agents.length), [agents.length]);

  if (!latestTick) return null;

  return (
    <>
      {latestTick.interactions.map((interaction) => {
        const idxA = agents.findIndex((a) => a.id === interaction.participants[0]);
        const idxB = agents.findIndex((a) => a.id === interaction.participants[1]);
        if (idxA < 0 || idxB < 0) return null;
        const posA = positions[idxA];
        const posB = positions[idxB];
        if (!posA || !posB) return null;

        const points = [posA, posB].flat();

        return (
          <line key={interaction.id}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(points), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" opacity={0.15} transparent />
          </line>
        );
      })}
    </>
  );
}

function Scene() {
  const { agents, selectedAgentId, selectAgent, tickHistory } = useSimulationStore();

  const positions = useMemo(() => arrangeInCircle(agents.length), [agents.length]);
  const latestTick = tickHistory[tickHistory.length - 1];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00f0ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#7b2ff7" />

      <Stars radius={50} depth={50} count={2000} factor={3} fade speed={0.5} />

      {agents.map((agent, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const agentState = latestTick?.agentStates.find((s) => s.identity.id === agent.id);
        const wealth = agentState?.resources.wealth ?? agent.wealth;

        return (
          <AgentNode
            key={agent.id}
            position={pos}
            name={agent.name}
            wealth={wealth}
            isSelected={selectedAgentId === agent.id}
            color={AGENT_COLORS[i % AGENT_COLORS.length] ?? '#ffffff'}
            onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
          />
        );
      })}

      <InteractionLines />

      {/* Ground grid */}
      <gridHelper args={[20, 20, '#1a1a2e', '#1a1a2e']} position={[0, -1.5, 0]} />

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
    <Canvas camera={{ position: [0, 5, 8], fov: 60 }} style={{ background: 'transparent' }}>
      <Scene />
    </Canvas>
  );
}
