"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useSpring } from "motion/react";

const IMAGES = [
  "/1775026121637.jpg",
  "/file_00000000c25c720ba27a68ebfd16e397.png",
];

export function FloatingConnectorsCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const rotateX = useSpring(0, { stiffness: 120, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
    rotateY.set(x * 8);
    rotateX.set(-y * 8);
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className="flex items-center justify-center p-3 sm:p-5 md:p-6 bg-gradient-to-br from-slate-900 to-slate-950">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setCurrent((prev) => (prev + 1) % IMAGES.length)}
        className="relative w-full max-w-[min(100%,28rem)] sm:max-w-[32rem] overflow-hidden rounded-[20px] border border-white/8 cursor-pointer"
        style={{
          perspective: "1200px",
          rotateX,
          rotateY,
        }}
      >
        {/* Fixed aspect + crop so both carousel images share the same medium frame */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={IMAGES[current]}
              alt="OCC showcase"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
          animate={{
            backgroundPosition: `${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%`,
          }}
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
