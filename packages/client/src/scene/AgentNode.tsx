// @ts-nocheck — R3F JSX intrinsic elements
import { Text, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * All available human character model file names from the Quaternius pack.
 * Mapped to a flat array for deterministic selection by agent ID hash.
 */
const CHARACTER_MODELS = [
  'Casual_Male',
  'Casual_Female',
  'Casual_Bald',
  'Casual2_Male',
  'Casual2_Female',
  'Casual3_Male',
  'Casual3_Female',
  'Suit_Male',
  'Suit_Female',
  'Chef_Male',
  'Chef_Female',
  'Doctor_Male_Young',
  'Doctor_Female_Young',
  'Doctor_Male_Old',
  'Doctor_Female_Old',
  'Worker_Male',
  'Worker_Female',
  'OldClassy_Male',
  'OldClassy_Female',
  'Cowboy_Male',
  'Cowboy_Female',
  'Knight_Male',
  'Knight_Golden_Male',
  'Knight_Golden_Female',
  'Wizard',
  'Witch',
  'Elf',
  'Viking_Male',
  'Viking_Female',
  'Ninja_Male',
  'Ninja_Female',
  'Ninja_Sand',
  'Ninja_Sand_Female',
  'Goblin_Male',
  'Goblin_Female',
  'Pirate_Male',
  'Pirate_Female',
  'Soldier_Male',
  'Soldier_Female',
  'BlueSoldier_Male',
  'BlueSoldier_Female',
  'Kimono_Male',
  'Kimono_Female',
  'Zombie_Male',
  'Zombie_Female',
];

/** djb2 string hash → deterministic model index */
function hashString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getModelForAgent(agentId: string): string {
  const idx = hashString(agentId) % CHARACTER_MODELS.length;
  return CHARACTER_MODELS[idx];
}

// ─── Props ───

interface AgentNodeProps {
  position: [number, number, number];
  name: string;
  agentId: string;
  wealth: number;
  isSelected: boolean;
  isInteracting?: boolean;
  color: string;
  onClick: () => void;
}

// ─── glTF Character Sub-component ───

function CharacterModel({
  modelName,
  color,
  isSelected,
  hovered,
  isInteracting,
}: {
  modelName: string;
  color: string;
  isSelected: boolean;
  hovered: boolean;
  isInteracting: boolean;
}) {
  const url = `/models/characters/${modelName}.gltf`;
  const { scene } = useGLTF(url);

  // Clone the scene so each agent gets its own instance
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Apply toon material to all meshes for consistent low-poly look
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const oldMat = child.material as THREE.MeshStandardMaterial;
        child.material = new THREE.MeshToonMaterial({
          color: oldMat.color?.clone() ?? new THREE.Color(color),
          emissive: new THREE.Color(
            isSelected || isInteracting ? color : hovered ? color : '#222222',
          ),
          emissiveIntensity: isSelected ? 0.6 : isInteracting ? 0.4 : hovered ? 0.3 : 0.05,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, color, isSelected, hovered, isInteracting]);

  return <primitive object={clonedScene} />;
}

// ─── Interaction glow ring ───

function InteractionGlow({ color, active }: { color: string; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current && active) {
      const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.15 + 0.35;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  if (!active) return null;

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[0.35, 0.55, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Fallback octahedron (shown while loading) ───

function FallbackShape({ color }: { color: string }) {
  return (
    <mesh>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// ─── Main AgentNode ───

export default function AgentNode({
  position,
  name,
  agentId,
  wealth,
  isSelected,
  isInteracting = false,
  color,
  onClick,
}: AgentNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Scale based on wealth
  const scale = 0.3 + (wealth / 200) * 0.7;

  // Deterministic model for this agent
  const modelName = useMemo(() => getModelForAgent(agentId), [agentId]);

  // Gentle floating + slow rotation + interaction bounce
  useFrame((state) => {
    if (groupRef.current) {
      const baseY = position[1];
      const float = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;

      // Bounce effect when interacting
      const bounce = isInteracting ? Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.15 : 0;

      groupRef.current.position.y = baseY + float + bounce;
      groupRef.current.rotation.y += isInteracting ? 0.01 : 0.003;
    }
  });

  return (
    <group position={position}>
      <group
        ref={groupRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Suspense fallback={<FallbackShape color={color} />}>
          <CharacterModel
            modelName={modelName}
            color={color}
            isSelected={isSelected}
            hovered={hovered}
            isInteracting={isInteracting}
          />
        </Suspense>
      </group>

      {/* Interaction glow ring */}
      <InteractionGlow color={color} active={isInteracting} />

      {/* Name label */}
      <Text
        position={[0, -0.8 * scale, 0]}
        fontSize={0.15}
        color={isSelected ? '#00f0ff' : isInteracting ? color : '#aaaaaa'}
        anchorX="center"
        anchorY="top"
      >
        {name}
      </Text>

      {/* Glow ring for selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={scale * 1.5}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
