// @ts-nocheck — R3F v8 JSX intrinsic elements not typed
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type * as THREE from 'three';

interface AgentNodeProps {
  position: [number, number, number];
  name: string;
  wealth: number;
  isSelected: boolean;
  color: string;
  onClick: () => void;
}

export default function AgentNode({
  position,
  name,
  wealth,
  isSelected,
  color,
  onClick,
}: AgentNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Scale based on wealth (normalized)
  const scale = 0.3 + (wealth / 200) * 0.7;

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={scale}
      >
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || hovered ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.4 : 0}
          wireframe={!isSelected}
          transparent
          opacity={isSelected ? 1 : 0.8}
        />
      </mesh>

      {/* Name label */}
      <Text
        position={[0, -0.8 * scale, 0]}
        fontSize={0.15}
        color={isSelected ? '#00f0ff' : '#888888'}
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
