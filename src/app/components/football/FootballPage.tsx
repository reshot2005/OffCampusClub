"use client";

import React, { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { motion, AnimatePresence } from "motion/react";
import { useFootballFrames } from "../../../hooks/useFootballFrames";
import { FOOTBALL_TOTAL_FRAMES, FOOTBALL_FRAMES_PATH, FC } from "./footballConstants";
import { FootballScrollSection } from "./FootballScrollSection";

/* â”€â”€ Loading Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FootballLoadingScreen({ progress, loaded }: { progress: number; loaded: boolean }) {
  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: FC.bg }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="mb-6 text-5xl"
          >

          </motion.div>
          <h1 className="font-headline mb-8 text-4xl tracking-[0.3em] md:text-5xl" style={{ color: FC.text }}>
            LOADING SPORTS & FOOTBALL
          </h1>
          <div className="w-72">
            <div className="h-px w-full" style={{ background: "#1a1a1a" }}>
              <div
                className="h-full transition-all duration-75"
                style={{ width: `${progress * 100}%`, background: FC.accent }}
              />
            </div>
            <p className="mt-3 text-center text-xs tracking-[0.3em]" style={{ color: FC.muted }}>
              {Math.round(progress * 100)}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* â”€â”€ Custom Cursor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FootballCursor() {
  const dotRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);
  const mouse = React.useRef({ x: 0, y: 0 });
  const ring = React.useRef({ x: 0, y: 0 });
  const hover = React.useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hover.current = !!(t.closest("a") || t.closest("button") || t.closest("[role=button]"));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    let raf = 0;
    const loop = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${mouse.current.x - 6}px, ${mouse.current.y - 6}px)`;
      const rs = hover.current ? 60 : 40;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - rs / 2}px, ${ring.current.y - rs / 2}px)`;
        ringRef.current.style.width = `${rs}px`;
        ringRef.current.style.height = `${rs}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseover", onOver); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="pointer-events-none fixed top-0 left-0 z-[9999] hidden h-3 w-3 rounded-full mix-blend-difference md:block" style={{ background: "#FFFFFF" }} />
      <div ref={ringRef} className="pointer-events-none fixed top-0 left-0 z-[9998] hidden rounded-full border mix-blend-difference transition-[width,height] duration-200 md:block" style={{ borderColor: "#FFFFFF" }} />
    </>
  );
}

/* â”€â”€ Grain Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function GrainOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9997] opacity-[0.022]">
      <svg className="h-[200%] w-[200%] animate-grain">
        <filter id="fg"><feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#fg)" />
      </svg>
    </div>
  );
}

/* â”€â”€ Post-scroll Sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const P = {
  bg: "#0C0C0A", card: "#141410", elevated: "#1C1C18",
  border: "rgba(255,248,235,0.08)", borderHover: "rgba(0,232,122,0.35)",
  text: "#F5F0E8", muted: "#8A8478", dim: "#4A4840",
  gold: "#C9A96E", green: "#00E87A",
} as const;

function StadiumSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#0B1224" }}>
      <div className="mx-auto max-w-[76rem] px-6 py-16 md:px-12 md:py-20">
        {/* Football icon top-left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-xl">FB</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12 lg:gap-16">
          {/* Left â€” Player image with orange bg */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg" style={{ background: "#FF6B2B" }}>
              <img
                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Football player in action"
                className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity"
                style={{ opacity: 0.85 }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(11,18,36,0.6) 100%)" }} />
            </div>
          </motion.div>

          {/* Right â€” Headline + secondary card */}
          <div className="flex flex-col justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <h2
                className="text-[clamp(1.8rem,5vw,3.2rem)] font-black leading-[1.08] tracking-tight"
                style={{ color: "#FFFFFF", fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
              >
                TODAY I WILL DO WHAT OTHERS WON'T, SO{" "}
                <span className="inline-flex translate-y-1 items-center">
                  <span className="mx-2 inline-flex h-10 w-14 items-center justify-center rounded bg-white/10">
                    <span className="text-lg">FB</span>
                  </span>
                </span>{" "}
                TOMORROW
              </h2>
              <p className="mt-5 max-w-[400px] text-sm leading-[1.8]" style={{ color: "#8A8E9B" }}>
                The sports most frequently referred to as simply football are Association Football, known in some countries as soccer.
              </p>
              <Link to="/football/info">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 rounded-sm px-8 py-3 text-[11px] font-bold tracking-[0.25em] uppercase transition-colors"
                  style={{ background: P.green, color: "#0B1224" }}
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-end gap-5"
            >
              <div className="relative aspect-[4/3] w-[55%] overflow-hidden rounded-lg" style={{ background: "#E8C840" }}>
                <img
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Football star in action"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 0.9 }}
                />
              </div>
              <p className="max-w-[180px] text-xs leading-[1.7]" style={{ color: "#8A8E9B" }}>
                Contrary to popular belief, Lorem Ipsum is not simply random text.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LatestNewsSection() {
  const news = [
    {
      image: "/football/news1.png",
      title: "AMERICAN FOOTBALL CLUB TEAM",
      desc: "Experience the intensity of the gridiron with OCC's elite squad. Training sessions starting this spring.",
      link: "LEARN MORE",
    },
    {
      image: "/football/news2.png",
      title: "STADIUM SESSIONS REVEALED",
      desc: "Our new night practice schedule at the central turf is now live. Join the lights under the Bangalore sky.",
      link: "JOIN TRAINING",
    },
    {
      image: "/football/news1.png",
      title: "TACTICAL BRIEFING: SEASON 5",
      desc: "Master the playbook with coached sessions every weekend. From beginner to pro athletes.",
      link: "READ MORE",
    },
    {
      image: "/football/news2.png",
      title: "EQUIPMENT DROP: FALL '26",
      desc: "The new OCC Football kits are here. Pre-order your custom jersey today through the dashboard.",
      link: "VIEW GEAR",
    },
  ];

  return (
    <section className="w-full px-6 py-24 md:px-12 md:py-32" style={{ background: "#0B1224" }}>
      <div className="mx-auto max-w-[76rem]">
        {/* Divider line */}
        <div className="mb-16 h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-[0.15em]"
          style={{ color: "#FFFFFF", fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
        >
          THE LATEST NEWS
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {news.map((item, i) => (
            <motion.div
              key={`news-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex gap-4 overflow-hidden rounded-sm p-3 transition-all duration-300"
              style={{ background: "#111828", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <div className="relative h-[110px] w-[140px] shrink-0 overflow-hidden rounded-sm md:h-[130px] md:w-[170px]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center gap-2 py-1">
                <h3
                  className="text-[13px] font-bold tracking-[0.06em]"
                  style={{ color: "#FFFFFF", fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-[12px] leading-[1.6]" style={{ color: "#8A8E9B" }}>
                  {item.desc}
                </p>
                <Link 
                  to="/football/info"
                  className="mt-1 block text-[11px] font-bold tracking-[0.12em] transition-colors hover:opacity-80 w-fit"
                  style={{ color: "#E5453C" }}
                >
                  {item.link}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OurTeamSection() {
  const players = [
    {
      image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      name: "Player One",
      position: "Forward",
    },
    {
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      name: "Player Two",
      position: "Midfielder",
    },
    {
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      name: "Player Three",
      position: "Defender",
    },
    {
      image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      name: "Player Four",
      position: "Goalkeeper",
    },
  ];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Orange gradient divider at top */}
      <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #FF6B2B 0%, #E5453C 50%, #FF6B2B 100%)" }} />

      <div className="px-6 py-20 md:px-12 md:py-28" style={{ background: "#0B1224" }}>
        <div className="mx-auto max-w-[76rem]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-[0.15em]"
            style={{ color: "#FFFFFF", fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
          >
            OUR TEAM
          </motion.h2>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
            {players.map((player, i) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(11,18,36,0.85) 100%)" }} />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3
                      className="text-[15px] font-bold tracking-[0.08em]"
                      style={{ color: "#FFFFFF", fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
                    >
                      {player.name}
                    </h3>
                    <p className="text-[11px] tracking-[0.15em] uppercase" style={{ color: "#FF6B2B" }}>
                      {player.position}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JoinFootballSection({ userId }: { userId?: string | null }) {
  return (
    <section
      className="relative overflow-hidden px-6 py-32 md:px-12 md:py-44"
      style={{ background: `radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,232,122,0.06) 0%, transparent 70%), ${P.card}` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${P.border}, transparent)` }} />
      <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-headline text-[30vw] font-black leading-none tracking-[0.05em] opacity-[0.03]" style={{ color: P.text }} aria-hidden>
        OCC
      </div>
      <motion.div
        initial={{ opacity: 0, y: 44 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-2xl text-center"
      >
        <p className="font-mono-label mb-6 text-[11px] tracking-[0.5em] uppercase" style={{ color: P.muted }}>Sports & Football</p>
        <h2 className="font-headline text-[clamp(3rem,10vw,6rem)] leading-[0.92] tracking-[0.04em]" style={{ color: P.text }}>YOUR TEAM</h2>
        <h2 className="font-editorial text-[clamp(2.5rem,9vw,5.5rem)] leading-[0.92]" style={{ color: P.green }}>Starts Here.</h2>
        <p className="mx-auto mt-8 max-w-[520px] text-[16px] leading-[1.8]" style={{ color: P.muted, fontFamily: "'DM Sans', sans-serif" }}>
          Join OCC Sports & Football - where college players find their squad, play real matches, and build a name on the pitch.
        </p>
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to={userId ? "/clubs/sports?welcome=true" : "/login"}
            className="font-mono-label px-10 py-[18px] text-[11px] tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02]"
            style={{ background: P.green, color: P.bg, borderRadius: "2px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = P.green; e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${P.green}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = P.green; e.currentTarget.style.color = P.bg; e.currentTarget.style.boxShadow = "none"; }}
          >
            Join Now
          </Link>
          <Link
            to={userId ? "/clubs" : "/login"}
            className="font-mono-label px-10 py-[18px] text-[11px] tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02]"
            style={{ color: P.green, boxShadow: `inset 0 0 0 1px ${P.green}`, borderRadius: "2px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = P.green; e.currentTarget.style.color = P.bg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = P.green; }}
          >
            Explore Clubs
          </Link>
        </div>
        <div className="mt-14 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-7 rounded-full" style={{ background: `hsl(${140 + i * 15}, ${45 + i * 4}%, ${24 + i * 6}%)`, border: `2px solid ${P.card}` }} />
            ))}
          </div>
          <span className="text-sm" style={{ color: P.muted, fontFamily: "'DM Sans', sans-serif" }}>2,400+ students across Bangalore</span>
        </div>
      </motion.div>
    </section>
  );
}

/* â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function FootballPage({
  hideLoader = false,
  userId
}: {
  hideLoader?: boolean;
  userId?: string | null;
} = {}) {
  const { frames, loaded, progress } = useFootballFrames(FOOTBALL_FRAMES_PATH, FOOTBALL_TOTAL_FRAMES);

  return (
    <div className="cursor-none" style={{ background: FC.bg, color: FC.text }}>
      {!hideLoader && <FootballLoadingScreen progress={progress} loaded={loaded} />}
      <FootballCursor />
      <GrainOverlay />

      <header className="pointer-events-none fixed top-0 right-0 left-0 z-[100] flex items-center justify-between px-6 py-6 mix-blend-difference md:px-12">
        <Link to="/" className="pointer-events-auto text-[10px] tracking-[0.4em] uppercase transition-colors" style={{ color: FC.text }}>
          {"<- OCC"}
        </Link>
        <span className="font-headline text-lg tracking-[0.15em] md:text-xl" style={{ color: FC.text }}>OCC</span>
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: FC.muted }}>Football</span>
      </header>

      <FootballScrollSection frames={frames} loaded={loaded} />

      <StadiumSection />
      <LatestNewsSection />
      <OurTeamSection />
      <JoinFootballSection userId={userId} />

      <footer className="border-t px-6 py-12 text-center" style={{ borderColor: P.border, background: P.bg }}>
        <p className="font-mono-label text-xs tracking-[0.2em]" style={{ color: P.muted }}>
          OCC Football |{" "}
          <Link to="/" className="transition-colors hover:underline" style={{ color: P.green }}>Return home</Link>
        </p>
      </footer>
    </div>
  );
}
