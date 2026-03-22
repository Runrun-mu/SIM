// @ts-nocheck — R3F JSX intrinsic elements
import { Billboard, Text, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

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

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('cooperate') || lower.includes('dove') || lower.includes('accept'))
    return '#39ff14';
  if (lower.includes('defect') || lower.includes('hawk') || lower.includes('reject'))
    return '#ff2d55';
  if (lower.includes('offer') || lower.includes('trade')) return '#00f0ff';
  return '#ffaa00';
}

/**
 * Map game actions to model animations.
 * Model has: Idle, Walk, Punch, Victory, Defeat, Death, Jump, PickUp, Roll, Run, SitDown, etc.
 */
function getAnimationForAction(action: string | null): string {
  if (!action) return 'Idle';
  const lower = action.toLowerCase();

  // Cooperative / positive actions
  if (lower.includes('cooperate') || lower.includes('dove') || lower.includes('accept'))
    return 'Victory';
  // Aggressive / negative actions
  if (lower.includes('defect') || lower.includes('hawk') || lower.includes('reject'))
    return 'Punch';
  // Trading / offering
  if (lower.includes('offer') || lower.includes('give') || lower.includes('contribute'))
    return 'PickUp';
  // Voting / choosing
  if (lower.includes('vote') || lower.includes('choose')) return 'Jump';
  // Social / talking
  if (lower.includes('socialize') || lower.includes('talk')) return 'Victory';
  // Isolate / stay
  if (lower.includes('isolate') || lower.includes('stay')) return 'SitDown';
  // Movement actions
  if (lower.includes('move') || lower.includes('extract')) return 'Walk';

  // Default: a friendly animation
  return 'Victory';
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

// ─── Animated glTF Character ───
function AnimatedCharacter({
  modelName,
  animationName,
  isMoving,
}: {
  modelName: string;
  animationName: string;
  isMoving: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const url = `/models/characters/${modelName}.gltf`;
  const { scene, animations } = useGLTF(url);

  // Clone with SkeletonUtils to preserve bones
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);

  // Setup animations on the cloned scene
  const { actions } = useAnimations(animations, groupRef);

  // Track current action for crossfade
  const currentAction = useRef<string>('Idle');

  useEffect(() => {
    // Decide which animation to play
    let targetAnim = animationName;
    if (isMoving) {
      targetAnim = 'Walk';
    }

    const next = actions[targetAnim] ?? actions.Idle;
    const prev = actions[currentAction.current];

    if (next && next !== prev) {
      next.reset().fadeIn(0.3).play();
      if (prev) prev.fadeOut(0.3);
      currentAction.current = targetAnim;
    } else if (next && !next.isRunning()) {
      next.reset().play();
    }
  }, [animationName, isMoving, actions]);

  // Start with Idle on mount
  useEffect(() => {
    const idle = actions.Idle;
    if (idle) {
      idle.reset().play();
      currentAction.current = 'Idle';
    }
  }, [actions]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── Floating action label ───
function ActionBubble({ action, visible }: { action: string; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current && visible) {
      ref.current.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      const scale = 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      ref.current.scale.setScalar(scale);
    }
  });

  if (!visible || !action) return null;

  const actionColor = getActionColor(action);
  const displayText = action.charAt(0).toUpperCase() + action.slice(1);

  return (
    <group ref={ref} position={[0, 1.8, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
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

// ─── Fallback ───
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

  const scale = 0.3 + (wealth / 200) * 0.7;
  const modelName = useMemo(() => getModelForAgent(agentId), [agentId]);
  const isInteracting = interactionTarget !== null;

  // Movement state
  const currentPos = useRef(new THREE.Vector3(...homePosition));
  const targetPos = useRef(new THREE.Vector3(...homePosition));
  const [movingState, setMovingState] = useState(false);

  // Update target when interaction changes
  useEffect(() => {
    if (interactionTarget) {
      targetPos.current.set(...interactionTarget);
    } else {
      targetPos.current.set(...homePosition);
    }
  }, [interactionTarget, homePosition]);

  // Movement + facing
  useFrame(() => {
    if (!rootRef.current) return;

    const dist = currentPos.current.distanceTo(targetPos.current);
    const nowMoving = dist > 0.05;

    // Only trigger state update when moving status changes
    if (nowMoving !== movingState) {
      setMovingState(nowMoving);
    }

    if (nowMoving) {
      currentPos.current.lerp(targetPos.current, 0.04);
      rootRef.current.position.copy(currentPos.current);

      // Face movement direction
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
    } else {
      rootRef.current.position.copy(currentPos.current);
    }
  });

  // Determine animation — action animation when at destination, otherwise idle
  const animationName = useMemo(() => {
    if (!isInteracting) return 'Idle';
    return getAnimationForAction(actionLabel);
  }, [isInteracting, actionLabel]);

  return (
    <group ref={rootRef} position={homePosition}>
      <group
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Suspense fallback={<FallbackShape color={color} />}>
          <AnimatedCharacter
            modelName={modelName}
            animationName={animationName}
            isMoving={movingState}
          />
        </Suspense>
      </group>

      {/* Action label floating above head */}
      <ActionBubble action={actionLabel ?? ''} visible={isInteracting} />

      {/* Name label */}
      <Billboard follow>
        <Text
          position={[0, -0.3, 0]}
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
