// @ts-nocheck — R3F v8 JSX intrinsic elements not typed
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
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

/** Animated beam between two interacting agents */
function InteractionBeam({
  start,
  end,
  color,
  intensity,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const midPoint = useMemo(
    () =>
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 0.5,
        (start[2] + end[2]) / 2,
      ),
    [start, end],
  );

  const distance = useMemo(() => {
    const dx = end[0] - start[0];
    const dz = end[2] - start[2];
    return Math.sqrt(dx * dx + dz * dz);
  }, [start, end]);

  const angle = useMemo(() => Math.atan2(end[2] - start[2], end[0] - start[0]), [start, end]);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.7;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = intensity * pulse;
    }
    if (pulseRef.current) {
      // Move pulse orb along the beam
      const t = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2;
      pulseRef.current.position.set(
        start[0] + (end[0] - start[0]) * t,
        0.3,
        start[2] + (end[2] - start[2]) * t,
      );
      const scale = 0.08 + Math.sin(state.clock.elapsedTime * 6) * 0.03;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Main beam line */}
      <mesh ref={meshRef} position={[midPoint.x, 0.15, midPoint.z]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[distance, 0.02, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={intensity * 0.6} />
      </mesh>

      {/* Traveling pulse orb */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function InteractionLines() {
  const { tickHistory, agents } = useSimulationStore();
  const latestTick = tickHistory[tickHistory.length - 1];

  const positions = useMemo(() => arrangeInCircle(agents.length), [agents.length]);

  if (!latestTick) return null;

  return (
    <>
      {latestTick.interactions.map((interaction, idx) => {
        const idxA = agents.findIndex((a) => a.id === interaction.participants[0]);
        const idxB = agents.findIndex((a) => a.id === interaction.participants[1]);
        if (idxA < 0 || idxB < 0) return null;
        const posA = positions[idxA];
        const posB = positions[idxB];
        if (!posA || !posB) return null;

        const beamColor = AGENT_COLORS[idxA % AGENT_COLORS.length] ?? '#00f0ff';

        return (
          <InteractionBeam
            key={interaction.id}
            start={posA}
            end={posB}
            color={beamColor}
            intensity={0.8}
          />
        );
      })}
    </>
  );
}

/** Animated ground ring to give scene spatial grounding */
function GroundEffects() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.05;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <group>
      {/* Glowing center ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <ringGeometry args={[2.5, 4.5, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer subtle ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[4.8, 5.0, 64]} />
        <meshBasicMaterial color="#7b2ff7" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene() {
  const { agents, selectedAgentId, selectAgent, tickHistory } = useSimulationStore();

  const positions = useMemo(() => arrangeInCircle(agents.length), [agents.length]);
  const latestTick = tickHistory[tickHistory.length - 1];

  // Build set of interacting agent IDs for animation
  const interactingAgents = useMemo(() => {
    if (!latestTick) return new Set<string>();
    const ids = new Set<string>();
    for (const interaction of latestTick.interactions) {
      for (const p of interaction.participants) {
        ids.add(p);
      }
    }
    return ids;
  }, [latestTick]);

  return (
    <>
      {/* Improved lighting — bright enough to see models clearly */}
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

      {/* Ground plane with grid */}
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

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, -0.49, 0]}
        scale={15}
        blur={2}
        far={4}
        opacity={0.4}
        color="#000020"
      />

      {/* Decorative ground effects */}
      <GroundEffects />

      {/* Agents */}
      {agents.map((agent, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const agentState = latestTick?.agentStates.find((s) => s.identity.id === agent.id);
        const wealth = agentState?.resources.wealth ?? agent.wealth;
        const isInteracting = interactingAgents.has(agent.id);

        return (
          <AgentNode
            key={agent.id}
            position={pos}
            name={agent.name}
            agentId={agent.id}
            wealth={wealth}
            isSelected={selectedAgentId === agent.id}
            isInteracting={isInteracting}
            color={AGENT_COLORS[i % AGENT_COLORS.length] ?? '#ffffff'}
            onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
          />
        );
      })}

      {/* Interaction beams */}
      <InteractionLines />

      {/* Camera controls */}
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
