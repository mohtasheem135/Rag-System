import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SaturnRings() {
  const ringGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const ringData = useMemo(() => {
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const ringBands = [
      { inner: 2.3, outer: 2.5, density: 0.3, brightness: 0.6 },
      { inner: 2.5, outer: 3.0, density: 0.5, brightness: 0.7 },
      { inner: 3.0, outer: 3.8, density: 1.0, brightness: 1.0 },
      { inner: 3.8, outer: 4.0, density: 0.1, brightness: 0.3 },
      { inner: 4.0, outer: 4.8, density: 0.8, brightness: 0.9 },
      { inner: 4.8, outer: 4.85, density: 0.05, brightness: 0.2 },
      { inner: 4.85, outer: 5.2, density: 0.6, brightness: 0.7 },
      { inner: 5.5, outer: 5.7, density: 0.2, brightness: 0.4 },
    ];

    let particleIndex = 0;

    ringBands.forEach(band => {
      const bandParticleCount = Math.floor(
        (count * band.density * (band.outer - band.inner)) / 3
      );

      for (let i = 0; i < bandParticleCount && particleIndex < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = band.inner + Math.random() * (band.outer - band.inner);
        const height = (Math.random() - 0.5) * 0.08;

        positions[particleIndex * 3] = Math.cos(angle) * radius;
        positions[particleIndex * 3 + 1] = height;
        positions[particleIndex * 3 + 2] = Math.sin(angle) * radius;

        const baseColor = 200 + Math.random() * 55;
        const brightness = band.brightness * (0.8 + Math.random() * 0.4);

        colors[particleIndex * 3] = (baseColor / 255) * brightness;
        colors[particleIndex * 3 + 1] = ((baseColor - 20) / 255) * brightness;
        colors[particleIndex * 3 + 2] = ((baseColor - 40) / 255) * brightness;

        sizes[particleIndex] = 0.015 + Math.random() * 0.025;

        particleIndex++;
      }
    });

    return { positions, colors, sizes, count: particleIndex };
  }, []);

  useFrame(() => {
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.x = Math.PI / 2.2;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={ringGroupRef}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ringData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[ringData.colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[ringData.sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
