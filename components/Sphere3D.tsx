'use client';

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import {
  Sphere,
  OrbitControls,
  Stars,
  Ring,
  Float,
  Trail,
} from '@react-three/drei';
import * as THREE from 'three';

// Saturn planet with realistic bands
function Saturn({ mouse }: { mouse: { x: number; y: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Create Saturn's characteristic banded texture
  const saturnTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base color - golden tan
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    // Saturn's characteristic bands
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

    // Add horizontal band variations
    for (let i = 0; i < 100; i++) {
      const y = Math.random() * canvas.height;
      const height = 2 + Math.random() * 15;
      const alpha = 0.1 + Math.random() * 0.2;

      ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${150 + Math.random() * 40}, ${100 + Math.random() * 40}, ${alpha})`;
      ctx.fillRect(0, y, canvas.width, height);
    }

    // Add subtle storm-like features
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

  useFrame(state => {
    if (meshRef.current) {
      // Saturn's rotation (it rotates fast)
      meshRef.current.rotation.y += 0.003;

      // Mouse influence - subtle movement
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        mouse.x * 0.8,
        0.02
      );
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        mouse.y * 0.8,
        0.02
      );
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= 0.001;
    }
  });

  return (
    <group>
      {/* Main Saturn body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={saturnTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Outer atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.03}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#f4e4c1"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmospheric haze */}
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

// Saturn's particle ring system
function SaturnRings() {
  const ringGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create ring particles with proper ring structure
  const ringData = useMemo(() => {
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Ring structure with different bands
    const ringBands = [
      { inner: 2.3, outer: 2.5, density: 0.3, brightness: 0.6 }, // D Ring
      { inner: 2.5, outer: 3.0, density: 0.5, brightness: 0.7 }, // C Ring
      { inner: 3.0, outer: 3.8, density: 1.0, brightness: 1.0 }, // B Ring (brightest)
      { inner: 3.8, outer: 4.0, density: 0.1, brightness: 0.3 }, // Cassini Division
      { inner: 4.0, outer: 4.8, density: 0.8, brightness: 0.9 }, // A Ring
      { inner: 4.8, outer: 4.85, density: 0.05, brightness: 0.2 }, // Encke Gap
      { inner: 4.85, outer: 5.2, density: 0.6, brightness: 0.7 }, // Outer A Ring
      { inner: 5.5, outer: 5.7, density: 0.2, brightness: 0.4 }, // F Ring
    ];

    let particleIndex = 0;

    ringBands.forEach(band => {
      const bandParticleCount = Math.floor(
        (count * band.density * (band.outer - band.inner)) / 3
      );

      for (let i = 0; i < bandParticleCount && particleIndex < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = band.inner + Math.random() * (band.outer - band.inner);
        const height = (Math.random() - 0.5) * 0.08; // Very thin ring

        positions[particleIndex * 3] = Math.cos(angle) * radius;
        positions[particleIndex * 3 + 1] = height;
        positions[particleIndex * 3 + 2] = Math.sin(angle) * radius;

        // Color based on ring band with slight variation
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

  useFrame(state => {
    if (ringGroupRef.current) {
      // Saturn's axial tilt
      ringGroupRef.current.rotation.x = Math.PI / 2.2;
    }

    // Slow rotation of ring particles
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

// Titan - Saturn's largest moon
function Titan() {
  const moonRef = useRef<THREE.Mesh>(null);

  // Titan's orange atmosphere
  const titanTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Titan's characteristic orange haze
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d4a574');
    gradient.addColorStop(0.3, '#c49464');
    gradient.addColorStop(0.5, '#e8c8a4');
    gradient.addColorStop(0.7, '#c49464');
    gradient.addColorStop(1, '#d4a574');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add haze variations
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
      // Titan orbits at about 20 Saturn radii
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

// Enceladus - bright icy moon
function Enceladus() {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (moonRef.current) {
      const time = state.clock.elapsedTime;
      // Enceladus orbits closer
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

// Background stars
function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  const stars = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    const colors = new Float32Array(3000 * 3);
    const sizes = new Float32Array(3000);

    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 30 + Math.random() * 50;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Star colors - mostly white with some blue and yellow
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.8;
      }

      sizes[i] = Math.random() * 2;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame(state => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[stars.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[stars.sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// Distant nebula
function DistantNebula() {
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

      // Subtle nebula colors
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

  useFrame(state => {
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

// Main scene
function Scene({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <>
      {/* Lighting - simulating distant sun */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[20, 10, 10]}
        intensity={2}
        color="#fff5e6"
        castShadow
      />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#4a6080" />

      {/* Star field */}
      <StarField />

      {/* Distant nebula */}
      <DistantNebula />

      {/* Saturn */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <Saturn mouse={mouse} />
      </Float>

      {/* Saturn's particle rings */}
      <SaturnRings />

      {/* Moons */}
      <Titan />
      <Enceladus />

      {/* Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={6}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export default function Sphere3D() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        setMouse({ x, y });
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (containerRef.current && event.touches.length > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const touch = event.touches[0];
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        setMouse({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-black relative overflow-hidden"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none z-10" />

      <Canvas
        camera={{ position: [0, 3, 12], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene mouse={mouse} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-20">
        <p className="text-white/30 text-xs tracking-[0.2em] uppercase">
          Move mouse to interact · Scroll to zoom
        </p>
      </div>

      {/* Title */}
      <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-20">
        <h1 className="text-white/60 text-xl font-light tracking-[0.4em] uppercase">
          Saturn
        </h1>
        <p className="text-white/30 text-xs tracking-[0.15em] mt-2">
          The Ringed Planet
        </p>
      </div>
    </div>
  );
}
