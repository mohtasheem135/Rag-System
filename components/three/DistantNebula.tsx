import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function DistantNebula() {
  const nebulaRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(500 * 3);
    const colors = new Float32Array(500 * 3);

    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 30;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 0.5;
      } else {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 0.2;
      }
    }

    return { positions, colors };
  }, []);

  useFrame(() => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <points ref={nebulaRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}
