"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { markReturnFromOrbit } from "@/lib/landingNav";
import {
  orbitProjects as staticProjects,
  orbitCategories as staticCategories,
  type OrbitProject,
} from "./orbitData";

/* ════════════════════════════════════════
   ORBIT CAROUSEL — CLOU Library-Book Style
   Fixed ring shape, hover-to-preview
   SaaS: Fetches from API, falls back to static data
   ════════════════════════════════════════ */
export function OrbitCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const autoRotateRef = useRef(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const sizeRef = useRef({ rx: 440, ry: 280, cx: 600, cy: 380, isMobile: false });

  const [rotation, setRotation] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isGrid, setIsGrid] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  /* ── Fetch projects from API, fallback to static ── */
  const [projects, setProjects] = useState<OrbitProject[]>(staticProjects);
  const [categories, setCategories] = useState<readonly string[]>(staticCategories);

  useEffect(() => {
    fetch("/api/orbit")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          const mapped: OrbitProject[] = data.projects.map((p: any, i: number) => ({
            id: i + 1,
            title: p.title,
            category: p.category,
            description: p.description || "",
            image: p.imageUrl,
          }));
          setProjects(mapped);
          setCategories(Array.from(new Set(mapped.map((p) => p.category))));
        }
      })
      .catch(() => {});
  }, []);

  const [selectedProject, setSelectedProject] = useState<OrbitProject>(projects[0]);

  useEffect(() => {
    if (projects.length > 0) setSelectedProject(projects[0]);
  }, [projects]);

  const baseProjects = useMemo(() => {
    if (activeFilters.length === 0) return projects;
    return projects.filter((p) => activeFilters.includes(p.category));
  }, [activeFilters, projects]);

  const ringProjects = useMemo(() => {
    const tripled = [...baseProjects, ...baseProjects, ...baseProjects];
    return tripled.map((p, i) => ({ ...p, ringId: i }));
  }, [baseProjects]);

  const count = ringProjects.length;
  const angleStep = count > 0 ? 360 / count : 360;

  /* ── measure container once + on resize ── */
  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    
    sizeRef.current = {
      rx: isMobile ? w * 0.40 : isTablet ? w * 0.35 : Math.min(w * 0.36, 460),
      ry: isMobile ? h * 0.18 : isTablet ? h * 0.25 : Math.min(h * 0.28, 240),
      cx: w / 2,
      cy: isMobile ? h * 0.46 : isTablet ? h * 0.48 : h * 0.48,
      isMobile
    };
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* ── snap to nearest card ── */
  const snapToNearest = useCallback(() => {
    const norm = ((rotationRef.current % 360) + 360) % 360;
    const idx = Math.round(norm / angleStep) % count;
    const target = idx * angleStep;
    let diff = target - (rotationRef.current % 360);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const goal = rotationRef.current + diff;
    const step = () => {
      const d = (goal - rotationRef.current) * 0.15;
      if (Math.abs(d) < 0.01) {
        rotationRef.current = goal;
        setRotation(goal);
        return;
      }
      rotationRef.current += d;
      setRotation(rotationRef.current);
      animFrameRef.current = requestAnimationFrame(step);
    };
    step();
  }, [angleStep, count]);

  const scheduleAutoResume = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => { autoRotateRef.current = true; }, 5000);
  }, []);

  const rotateBy = (deg: number) => {
    autoRotateRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    rotationRef.current += deg;
    setRotation(rotationRef.current);
    snapToNearest();
    scheduleAutoResume();
  };

  /* ── auto-rotate ── */
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current += sizeRef.current.isMobile ? 0.04 : 0.025;
        setRotation(rotationRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── pointer / wheel listeners ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      autoRotateRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      rotationRef.current += e.deltaY * 0.05;
      setRotation(rotationRef.current);
      clearTimeout((window as any).__orbitSnap);
      (window as any).__orbitSnap = setTimeout(() => { snapToNearest(); scheduleAutoResume(); }, 400);
    };

    const onDown = (x: number) => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
      lastXRef.current = x;
      cancelAnimationFrame(animFrameRef.current);
    };
    const onMove = (x: number) => {
      if (!isDraggingRef.current) return;
      const dx = x - lastXRef.current;
      const sensitivity = sizeRef.current.isMobile ? 0.4 : 0.22;
      velocityRef.current = dx * sensitivity;
      rotationRef.current += dx * sensitivity;
      setRotation(rotationRef.current);
      lastXRef.current = x;
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const decel = () => {
        velocityRef.current *= 0.94;
        if (Math.abs(velocityRef.current) < 0.08) {
          snapToNearest();
          scheduleAutoResume();
          return;
        }
        rotationRef.current += velocityRef.current;
        setRotation(rotationRef.current);
        animFrameRef.current = requestAnimationFrame(decel);
      };
      decel();
    };

    const md = (e: MouseEvent) => onDown(e.clientX);
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const mu = () => onUp();
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX);
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const te = () => onUp();

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
    };
  }, [snapToNearest, scheduleAutoResume]);

  /* ── compute card positions ── */
  const { rx, ry, cx, cy, isMobile } = sizeRef.current;

  const cards = useMemo(
    () =>
      ringProjects.map((project, i) => {
        const angleDeg = i * angleStep + rotation;
        const angle = (angleDeg * Math.PI) / 180;
        const x = cx + rx * Math.sin(angle);
        const y = cy + ry * Math.cos(angle);
        const depth = Math.cos(angle);
        const depthNorm = (depth + 1) / 2;
        const scale = isMobile ? 0.35 + 0.65 * depthNorm : 0.2 + 0.55 * depthNorm;
        const opacity = 0.35 + 0.65 * depthNorm;
        const zIndex = Math.round(depthNorm * 100);
        const bookTilt = isMobile ? Math.sin(angle) * 32 : Math.sin(angle) * 72;

        return { project, index: i, x, y, scale, opacity, zIndex, bookTilt, depthNorm };
      }),
    [ringProjects, angleStep, rotation, cx, cy, rx, ry, isMobile]
  );

  const sorted = useMemo(() => [...cards].sort((a, b) => a.zIndex - b.zIndex), [cards]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    categories.forEach((c) => { m[c] = projects.filter((p) => p.category === c).length; });
    return m;
  }, [categories, projects]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-black font-sans">
      {/* ── top bar ── */}
      <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between gap-2 pointer-events-none sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto sm:gap-3">
          <button
            type="button"
            onClick={() => {
              markReturnFromOrbit();
              router.push("/");
            }}
            className="px-4 py-2 rounded-full border border-black/5 bg-white/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-black/50 shadow-sm transition-all hover:text-black"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            className={`px-4 py-2 rounded-full border border-black/5 bg-white/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${showFilter ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
          >
            Categories
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsGrid((v) => !v)}
          className="pointer-events-auto shrink-0 px-4 py-2 rounded-full border border-black/5 bg-white/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-black/50 shadow-sm transition-all hover:text-black"
        >
          {isGrid ? "Ring View" : "Grid View"}
        </button>
      </div>

      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[70px] left-4 right-4 z-[99] max-h-[50vh] overflow-y-auto rounded-2xl border border-black/5 bg-white/95 p-4 backdrop-blur-lg shadow-xl"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeFilters.includes(cat) ? "bg-black text-white" : "bg-black/5 text-black/40"}`}
                >
                  {cat} ({catCounts[cat] || 0})
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isGrid ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24 px-4 pb-20 h-screen overflow-y-auto bg-gray-50/30">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {baseProjects.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group relative cursor-pointer" onClick={() => { setSelectedProject(p); setIsGrid(false); }}>
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-black/70 truncate">{p.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full relative">
            <div ref={containerRef} className="relative h-full w-full select-none cursor-grab active:cursor-grabbing overflow-hidden bg-white">
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-[min(14vh,6.5rem)] sm:pb-[min(16vh,7.5rem)] md:pb-[min(18vh,8.5rem)] pointer-events-none z-[60]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedProject.id + selectedProject.title}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="flex flex-col items-center max-w-[min(92vw,52rem)]"
                  >
                    <div className="w-[180px] sm:w-[260px] md:w-[380px] lg:w-[440px] aspect-[16/11] rounded-2xl overflow-hidden shadow-xl mb-4 sm:mb-5 border border-black/5 bg-gray-50">
                      <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-4xl font-black tracking-tight text-center leading-[1.1] text-slate-900 px-4">
                      {selectedProject.title}
                    </h2>
                    <span className="mt-2 text-[8px] font-black uppercase tracking-[0.3em] text-indigo-500">
                      {selectedProject.category}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── manual navigation chevrons ── */}
              {!isGrid && (
                <>
                  <button onClick={() => rotateBy(angleStep)} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[70] p-4 rounded-full bg-white/40 backdrop-blur-md border border-black/5 shadow-sm active:scale-95 transition-all text-black/30 hover:text-black">
                    <span className="sr-only">Previous</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => rotateBy(-angleStep)} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[70] p-4 rounded-full bg-white/40 backdrop-blur-md border border-black/5 shadow-sm active:scale-95 transition-all text-black/30 hover:text-black">
                    <span className="sr-only">Next</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {sorted.map(({ project, x, y, scale, opacity, zIndex, bookTilt, depthNorm }) => {
                const isHovered = hoveredId === project.ringId;
                const cardW = isMobile ? 36 + depthNorm * 52 : 28 + depthNorm * 64;
                return (
                  <motion.div
                    key={project.ringId}
                    className="absolute will-change-transform pointer-events-auto"
                    style={{
                      left: x,
                      top: y - (isHovered ? 15 : 0),
                      width: cardW,
                      transform: `translate(-50%,-50%) scale(${isHovered ? scale * 1.3 : scale}) perspective(1000px) rotateY(${bookTilt}deg)`,
                      zIndex: isHovered ? 200 : zIndex,
                      opacity: isHovered ? 1 : opacity,
                    }}
                    onMouseEnter={() => { if(!isMobile) { setHoveredId(project.ringId); setSelectedProject(project); } }}
                    onMouseLeave={() => { if(!isMobile) setHoveredId(null); }}
                    onClick={() => { setSelectedProject(project); setHoveredId(project.ringId); }}
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-sm bg-white border border-black/5" style={{ transition: "box-shadow 0.3s ease" }}>
                      <img src={project.image} alt={project.title} className="h-full w-full object-cover" draggable={false} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
