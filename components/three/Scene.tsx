import { Suspense } from 'react';
import { OrbitControls, Float } from '@react-three/drei';
import { Saturn } from './Saturn';
import { SaturnRings } from './SaturnRings';
import { Titan } from './Titan';
import { Enceladus } from './Enceladus';
import { StarField } from './StarField';
import { DistantNebula } from './DistantNebula';

interface SceneProps {
  mouse: { x: number; y: number };
}

export function Scene({ mouse }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[20, 10, 10]}
        intensity={2}
        color="#fff5e6"
        castShadow
      />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#4a6080" />

      <StarField />
      <DistantNebula />

      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <Saturn mouse={mouse} />
      </Float>

      <SaturnRings />
      <Titan />
      <Enceladus />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        enableRotate={false}
      />
    </>
  );
}
