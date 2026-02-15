import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SaturnProps {
  mouse: { x: number; y: number };
}

export function Saturn({ mouse }: SaturnProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const saturnTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c9b896');
    gradient.addColorStop(0.1, '#d4c4a8');
    gradient.addColorStop(0.15, '#e8d5b0');
    gradient.addColorStop(0.2, '#c4a574');
    gradient.addColorStop(0.25, '#d9c9a0');
    gradient.addColorStop(0.3, '#b8956b');
    gradient.addColorStop(0.35, '#c9b896');
    gradient.addColorStop(0.4, '#e0d0a8');
    gradient.addColorStop(0.45, '#c4a574');
    gradient.addColorStop(0.5, '#d4c4a8');
    gradient.addColorStop(0.55, '#b8956b');
    gradient.addColorStop(0.6, '#c9b896');
    gradient.addColorStop(0.65, '#e8d5b0');
    gradient.addColorStop(0.7, '#c4a574');
    gradient.addColorStop(0.75, '#d9c9a0');
    gradient.addColorStop(0.8, '#b8956b');
    gradient.addColorStop(0.85, '#c9b896');
    gradient.addColorStop(0.9, '#e0d0a8');
    gradient.addColorStop(1, '#c4a574');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 100; i++) {
      const y = Math.random() * canvas.height;
      const height = 2 + Math.random() * 15;
      const alpha = 0.1 + Math.random() * 0.2;
      ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${150 + Math.random() * 40}, ${100 + Math.random() * 40}, ${alpha})`;
      ctx.fillRect(0, y, canvas.width, height);
    }

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 10 + Math.random() * 30;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0, `rgba(255, 240, 200, ${0.1 + Math.random() * 0.1})`);
      grd.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        mouse.x * 0.5,
        0.02
      );
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        mouse.y * 0.5,
        0.02
      );
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= 0.001;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={saturnTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={1.03}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#f4e4c1"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={1.08}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#d4c4a8"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
