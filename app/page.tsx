'use client';

import { useRef } from 'react';
import {
  HeroSection,
  FeaturesSection,
  ProcessSection,
  CTASection,
} from '@/components/landing';
import { useMousePosition } from '@/hooks/useMousePosition';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition(containerRef);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <HeroSection containerRef={containerRef} mouse={mouse} />
      <FeaturesSection />
      <ProcessSection />
      <CTASection />
    </div>
  );
}
