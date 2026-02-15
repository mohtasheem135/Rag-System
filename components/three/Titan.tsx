import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

export function Titan() {
  const moonRef = useRef<THREE.Mesh>(null);

  const titanTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d4a574');
    gradient.addColorStop(0.3, '#c49464');
    gradient.addColorStop(0.5, '#e8c8a4');
    gradient.addColorStop(0.7, '#c49464');
    gradient.addColorStop(1, '#d4a574');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillStyle = `rgba(255, 220, 180, ${Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(state => {
    if (moonRef.current) {
      const time = state.clock.elapsedTime;
      moonRef.current.position.x = Math.cos(time * 0.15) * 8;
      moonRef.current.position.z = Math.sin(time * 0.15) * 8;
      moonRef.current.position.y = Math.sin(time * 0.1) * 0.3;
      moonRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Trail width={0.8} length={12} color="#d4a574" attenuation={t => t * t}>
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          map={titanTexture}
          roughness={0.9}
          metalness={0.1}
          emissive="#d4a574"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Trail>
  );
}
