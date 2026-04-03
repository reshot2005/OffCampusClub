"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useSpring } from 'motion/react';
import { MovableBlock } from './LayoutEditor';
import {
  authEntryHref,
  LANDING_POST_AUTH_PATH,
  storeRedirectIntent,
} from '@/lib/client-auth-redirect';
import { scrollToOccClubsSection } from '@/lib/landingNav';

const JOIN_HREF = authEntryHref(LANDING_POST_AUTH_PATH, '/login');

const CARD_W = 560;
const CARD_H = 380;

export function ChromeKnotCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Spring physics for smooth cursor tracking
  const mouseX = useSpring(0, { stiffness: 80, damping: 75 });
  const mouseY = useSpring(0, { stiffness: 80, damping: 75 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    mouseX.set(x);
    mouseY.set(y);
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-950">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[560/380] w-full max-w-[560px] overflow-hidden rounded-[20px] border border-white/8"
        style={{
          background: '#0A0A0F',
          perspective: '1200px',
        }}
      >
        {/* Top Navigation Bar */}
        <div className="relative z-20 flex items-center justify-between px-8 py-6">
          <MovableBlock id="chrome-card-nav-logo">
            <div
              className="text-lg font-black tracking-wider text-white"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              OCC
            </div>
          </MovableBlock>

          <div className="flex items-center gap-3">
            <MovableBlock id="chrome-card-nav-join">
              <Link
                href={JOIN_HREF}
                prefetch
                onClick={() => storeRedirectIntent(LANDING_POST_AUTH_PATH)}
                className="inline-flex h-9 items-center rounded-lg bg-[#0D1B2A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#162838]"
              >
                JOIN •
              </Link>
            </MovableBlock>
            <MovableBlock id="chrome-card-nav-clubs">
              <button
                type="button"
                onClick={() => scrollToOccClubsSection()}
                className="h-9 rounded-lg bg-[#E8E8E8] px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-white"
              >
                CLUBS ···
              </button>
            </MovableBlock>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {/* 3D Video Background */}
          <motion.div
            className="absolute z-10 w-full h-full pointer-events-none scale-[1.1]"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{
              rotateY: mousePosition.x * 8, // Parallax: -8deg to +8deg
              rotateX: -mousePosition.y * 4, // Tilt: -4deg to +4deg
              x: -mousePosition.x * 12, // Shifting slightly in opposite direction
            }}
            transition={{ type: 'spring', stiffness: 80, damping: 75 }}
          >
            <video 
              src="/Night_Event_Crowd_Video_Generation.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-[20px]"
            />
          </motion.div>
        </div>

        {/* Bottom Text Overlay */}
        <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2">
          <MovableBlock id="chrome-card-footer-brand">
            <div
              className="text-[11px] font-semibold tracking-[0.15em] text-white/45"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              OCC
            </div>
          </MovableBlock>
          <MovableBlock id="chrome-card-footer-tagline">
            <div className="text-[13px] text-white">Off-campus clubs • Events • Gigs</div>
          </MovableBlock>
        </div>

        {/* Cursor follower */}
        {mousePosition.x !== 0 && (
          <motion.div
            className="absolute w-8 h-8 rounded-full border-2 border-white/60 pointer-events-none"
            style={{
              left: 0,
              top: 0,
            }}
            animate={{
              x: (mousePosition.x * 0.5 + 0.5) * CARD_W - 16,
              y: (mousePosition.y * 0.5 + 0.5) * CARD_H - 16,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

// Chrome Torus Knot Sculpture Component
function ChromeKnotSculpture() {
  return (
    <div 
      className="relative"
      style={{ 
        width: '280px', 
        height: '280px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Main interlocked rings forming torus knot */}
      {/* Ring 1 */}
      <div
        className="absolute inset-0"
        style={{
          border: '32px solid transparent',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #E8E8E8 0%, #505050 25%, #FFFFFF 40%, #808080 60%, #2A2A2A 80%, #C0C0C0 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          transform: 'rotateX(60deg) rotateY(-30deg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 -10px 30px rgba(0,0,0,0.3), inset 0 10px 30px rgba(255,255,255,0.3)',
        }}
      />

      {/* Ring 2 - interlocked */}
      <div
        className="absolute"
        style={{
          width: '240px',
          height: '240px',
          top: '20px',
          left: '20px',
          border: '28px solid transparent',
          borderRadius: '50%',
          background: 'linear-gradient(-45deg, #D4AF37 0%, #666666 20%, #FFD700 35%, #4A4A4A 55%, #C0C0C0 70%, #8B7355 85%, #E8E8E8 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          transform: 'rotateX(-40deg) rotateZ(60deg) translateZ(30px)',
          boxShadow: '0 15px 45px rgba(0,0,0,0.4), inset 0 -8px 20px rgba(139, 115, 85, 0.3), inset 0 8px 20px rgba(255, 255, 255, 0.4)',
        }}
      />

      {/* Ring 3 - creates the knot complexity */}
      <div
        className="absolute"
        style={{
          width: '200px',
          height: '200px',
          top: '40px',
          left: '40px',
          border: '24px solid transparent',
          borderRadius: '50%',
          background: 'linear-gradient(225deg, #505050 0%, #FFFFFF 20%, #808080 40%, #2A2A2A 60%, #E8E8E8 80%, #666666 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          transform: 'rotateY(90deg) rotateX(15deg) translateZ(-20px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 -6px 15px rgba(0,0,0,0.4), inset 0 6px 15px rgba(255,255,255,0.5)',
        }}
      />

      {/* Highlight reflections simulating canyon walls */}
      <div
        className="absolute"
        style={{
          width: '80px',
          height: '120px',
          top: '60px',
          left: '100px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(139, 0, 0, 0.3) 30%, rgba(255, 69, 0, 0.4) 50%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
          transform: 'rotateZ(-20deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Additional chrome highlight */}
      <div
        className="absolute"
        style={{
          width: '60px',
          height: '60px',
          top: '40px',
          left: '160px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
