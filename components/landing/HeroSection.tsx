import { RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MessageCircle, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { Scene } from '../three';
import Link from 'next/link'; // ADD THIS IMPORT

interface HeroSectionProps {
  containerRef: RefObject<HTMLDivElement | null>;
  mouse: { x: number; y: number };
}

export function HeroSection({ containerRef, mouse }: HeroSectionProps) {
  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center bg-black"
    >
      {/* 3D Canvas - Right side */}
      <div className="absolute inset-0 z-0 translate-x-[300px] bg-black transition-opacity duration-300">
        <Canvas
          camera={{ position: [0, 3, 12], fov: 60 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          }}
          style={{ background: '#000000' }} // ADD THIS
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            gl.setClearColor('#000000', 0);
            scene.background = null;
          }}
        >
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#000000" transparent opacity={0} />
              </mesh>
            }
          >
            <Scene mouse={mouse} />
          </Suspense>
        </Canvas>
      </div>

      {/* Hero Content - Left side */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-gray-300 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered Document Intelligence</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Chat with your</span>
            <br />
            <span className="gradient-indigo-purple-fuchsia bg-clip-text text-transparent">
              Documents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-xl">
            Upload your PDFs, DOCX, and text files. Our RAG system powered by
            Google Gemini will help you extract insights, answer questions, and
            discover knowledge from your documents.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/chat-test"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 gradient-indigo-purple-fuchsia rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <MessageCircle className="w-5 h-5" />
              Start Chatting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/upload"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300"
            >
              <Upload className="w-5 h-5" />
              Upload Documents
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-bold text-white">RAG</div>
              <div className="text-sm text-gray-500">Architecture</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">Gemini</div>
              <div className="text-sm text-gray-500">Powered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">ChromaDB</div>
              <div className="text-sm text-gray-500">Vector Store</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
