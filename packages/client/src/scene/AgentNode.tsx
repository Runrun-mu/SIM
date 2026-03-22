// @ts-nocheck — R3F JSX intrinsic elements
import { Billboard, Text, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

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

// ─── Action label colors ───
function getActionColor(action: string): string {
  switch (action) {
    case 'cooperate':
      return '#39ff14';
    case 'defect':
      return '#ff2d55';
    case 'hawk':
      return '#ff2d55';
    case 'dove':
      return '#39ff14';
    default:
      return '#ffaa00';
  }
}

// ─── Props ───
interface AgentNodeProps {
  homePosition: [number, number, number];
  name: string;
  agentId: string;
  wealth: number;
  isSelected: boolean;
  color: string;
  onClick: () => void;
  interactionTarget: [number, number, number] | null;
  actionLabel: string | null;
}

// ─── glTF Character ───
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

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
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

// ─── Floating action label ───
function ActionBubble({
  action,
  visible,
}: {
  action: string;
  visible: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current && visible) {
      // Float upward gently
      ref.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      // Fade pulse
      const scale = 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      ref.current.scale.setScalar(scale);
    }
  });

  if (!visible || !action) return null;

  const actionColor = getActionColor(action);
  const displayText = action.charAt(0).toUpperCase() + action.slice(1);

  return (
    <group ref={ref} position={[0, 1.2, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Background pill */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[displayText.length * 0.12 + 0.3, 0.25]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
        <Text
          fontSize={0.13}
          color={actionColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {displayText}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Fallback shape ───
function FallbackShape({ color }: { color: string }) {
  return (
    <mesh>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// ─── Idle animations (multiple variations) ───
function useIdleAnimation(
  groupRef: React.RefObject<THREE.Group>,
  agentId: string,
  isInteracting: boolean,
) {
  // Pick an idle variant deterministically per agent
  const idleType = useMemo(() => hashString(agentId) % 4, [agentId]);

  useFrame((state) => {
    if (!groupRef.current || isInteracting) return;
    const t = state.clock.elapsedTime;
    const offset = hashString(agentId) * 0.01; // Phase offset per agent

    switch (idleType) {
      case 0: {
        // Gentle sway side to side
        groupRef.current.rotation.y = Math.sin(t * 0.8 + offset) * 0.15;
        groupRef.current.position.y = Math.sin(t * 1.5 + offset) * 0.03;
        break;
      }
      case 1: {
        // Breathing (scale pulse) + slow turn
        const breathe = 1 + Math.sin(t * 1.2 + offset) * 0.02;
        groupRef.current.scale.y = breathe;
        groupRef.current.rotation.y = Math.sin(t * 0.5 + offset) * 0.3;
        break;
      }
      case 2: {
        // Look left and right
        groupRef.current.rotation.y = Math.sin(t * 0.6 + offset) * 0.4;
        groupRef.current.position.y = Math.sin(t * 2.0 + offset) * 0.02;
        break;
      }
      case 3: {
        // Subtle bounce
        groupRef.current.position.y = Math.abs(Math.sin(t * 1.8 + offset)) * 0.06;
        groupRef.current.rotation.y += 0.002;
        break;
      }
    }
  });
}

// ─── Movement animation (lerp to target) ───
function useMovementAnimation(
  rootRef: React.RefObject<THREE.Group>,
  homePosition: [number, number, number],
  targetPosition: [number, number, number] | null,
) {
  const currentPos = useRef(new THREE.Vector3(...homePosition));
  const targetPos = useRef(new THREE.Vector3(...homePosition));

  // Update target when interaction changes
  useMemo(() => {
    if (targetPosition) {
      targetPos.current.set(...targetPosition);
    } else {
      targetPos.current.set(...homePosition);
    }
  }, [targetPosition, homePosition]);

  useFrame(() => {
    if (!rootRef.current) return;
    // Smooth lerp toward target
    currentPos.current.lerp(targetPos.current, 0.04);
    rootRef.current.position.copy(currentPos.current);

    // Face direction of movement
    if (targetPosition) {
      const dx = targetPos.current.x - currentPos.current.x;
      const dz = targetPos.current.z - currentPos.current.z;
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const targetAngle = Math.atan2(dx, dz);
        rootRef.current.rotation.y = THREE.MathUtils.lerp(
          rootRef.current.rotation.y,
          targetAngle,
          0.05,
        );
      }
    }
  });
}

// ─── Main AgentNode ───
export default function AgentNode({
  homePosition,
  name,
  agentId,
  wealth,
  isSelected,
  color,
  onClick,
  interactionTarget,
  actionLabel,
}: AgentNodeProps) {
  const rootRef = useRef<THREE.Group>(null);
  const modelGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const scale = 0.3 + (wealth / 200) * 0.7;
  const modelName = useMemo(() => getModelForAgent(agentId), [agentId]);
  const isInteracting = interactionTarget !== null;

  // Movement: walk to interaction target or stay home
  useMovementAnimation(rootRef, homePosition, interactionTarget);

  // Idle animation when not interacting
  useIdleAnimation(modelGroupRef, agentId, isInteracting);

  return (
    <group ref={rootRef}>
      <group
        ref={modelGroupRef}
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

      {/* Action label floating above head */}
      <ActionBubble action={actionLabel ?? ''} visible={isInteracting} />

      {/* Name label */}
      <Billboard follow>
        <Text
          position={[0, -0.6 * scale, 0]}
          fontSize={0.13}
          color={isSelected ? '#00f0ff' : isInteracting ? color : '#aaaaaa'}
          anchorX="center"
          anchorY="top"
        >
          {name}
        </Text>
      </Billboard>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={scale * 1.5}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
