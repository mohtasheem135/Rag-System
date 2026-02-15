import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

export function Enceladus() {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (moonRef.current) {
      const time = state.clock.elapsedTime;
      moonRef.current.position.x = Math.cos(time * 0.4 + Math.PI) * 6;
      moonRef.current.position.z = Math.sin(time * 0.4 + Math.PI) * 6;
      moonRef.current.position.y = Math.cos(time * 0.3) * 0.5;
      moonRef.current.rotation.y += 0.02;
    }
  });

  return (
    <Trail width={0.4} length={8} color="#ffffff" attenuation={t => t * t}>
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.1}
          metalness={0.3}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>
    </Trail>
  );
}
