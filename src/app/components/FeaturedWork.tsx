"use client";

import React, { useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useSpring } from "motion/react";
import { useNavigate } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";
import { MovableBlock } from "./LayoutEditor";
import {
  authEntryHref,
  LANDING_POST_AUTH_PATH,
  storeRedirectIntent,
} from "@/lib/client-auth-redirect";

const SEE_ALL_CLUBS_HREF = authEntryHref(LANDING_POST_AUTH_PATH, "/login");

const TILT_MAX_DEG = 11;
const PARALLAX_PX = 16;
const SPRING = { stiffness: 88, damping: 26, mass: 0.62 };

function ClubShowcase3D({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const imgX = useSpring(0, SPRING);
  const imgY = useSpring(0, SPRING);

  const reset = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    imgX.set(0);
    imgY.set(0);
  }, [rotateX, rotateY, imgX, imgY]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const el = frameRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const nx = px * 2;
      const ny = py * 2;
      rotateY.set(nx * TILT_MAX_DEG);
      rotateX.set(-ny * TILT_MAX_DEG);
      imgX.set(-nx * PARALLAX_PX);
      imgY.set(-ny * PARALLAX_PX);
    },
    [reduceMotion, rotateX, rotateY, imgX, imgY],
  );

  if (reduceMotion) {
    return (
      <div
        ref={frameRef}
        className="relative h-full w-full overflow-hidden rounded-[inherit] bg-slate-200"
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
        {children}
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className="relative h-full w-full overflow-hidden rounded-[inherit] bg-slate-200"
      style={{ perspective: 1040 }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      <motion.div
        className="relative h-full w-full origin-center [transform-style:preserve-3d] will-change-transform"
        style={{ rotateX, rotateY }}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <motion.img
            src={src}
            alt={alt}
            draggable={false}
            className="pointer-events-none min-h-[118%] min-w-[118%] max-w-none object-cover"
            style={{ x: imgX, y: imgY, scale: 1.05 }}
          />
        </div>
      </motion.div>
      {children}
    </div>
  );
}

/** Unsplash hotlink format (ixlib + auto=format) so images load in dev and production */
const u = (id: string) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`;

const clubs: {
  title: string;
  tags: string;
  image: string;
  comingSoon?: boolean;
}[] = [
  {
    title: "Football & Sports",
    tags: "TURF RENTALS • MATCH SETUPS • BALL-SCROLL MOMENTS",
    image: u("photo-1574629810360-7efbbe195018"),
  },
  {
    title: "Bikers",
    tags: "RIDES • CITY LOOPS • MOTION-FIRST SCROLL",
    image: u("photo-1558981806-ec527fa84c39"),
  },
  {
    title: "Music",
    tags: "OPEN MICS • GIGS • CONCERT VISUALS",
    image: u("photo-1470229722913-7c0e2dbbafd3"),
  },
  {
    title: "Photography",
    tags: "SHOOTS • VIRAL CARDS • CAMPUS DROP",
    image: u("photo-1516035069371-29a1b244cc32"),
  },
  {
    title: "Fitness",
    tags: "GYM ENERGY • GROUP SESSIONS • HEAVY HITS",
    image: u("photo-1534438327276-14e5300c3a48"),
  },
  {
    title: "Fashion",
    tags: "CREATIVE MEETS • OUTFIT BUILDS • AI SUGGESTS",
    image: u("photo-1469334031218-e382a71b716b"),
  },
];

export function FeaturedWork() {
  const navigate = useNavigate();

  return (
    <section
      id="occ-clubs"
      className="relative scroll-mt-24 w-full max-w-[100vw] overflow-x-hidden bg-[#F6F7FA] px-4 py-24 sm:px-6 md:px-12 md:py-32"
    >
      <div className="mx-auto mb-16 flex w-full max-w-[90rem] flex-col justify-between gap-10 md:mb-20 md:flex-row md:items-end">
        <div className="flex flex-col gap-4 md:gap-6">
          <MovableBlock id="featured-intro-brand">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-2xl font-medium tracking-widest text-slate-900">
                OCC
              </div>
            </motion.div>
          </MovableBlock>
          <MovableBlock id="featured-intro-heading">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.06 }}
            >
              <h2 className="text-[2.75rem] font-medium leading-[0.95] tracking-tighter text-slate-900 sm:text-[4rem] md:text-[5rem] lg:text-[6.5rem]">
                OCC-Clubs
              </h2>
            </motion.div>
          </MovableBlock>
        </div>

        <MovableBlock id="featured-intro-right" className="max-w-[28rem] pb-0 md:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-sm font-bold leading-[1.6] text-slate-800 md:text-base">
              ONE PLATFORM FOR OFF-CAMPUS CREWS ACROSS COLLEGES—SPORTS, BIKERS, MUSIC, PHOTO,
              FITNESS, FASHION—PLUS EVENTS YOU ACTUALLY WANT TO GO TO AND GIGS THAT PAY.
            </p>
          </motion.div>
        </MovableBlock>
      </div>

      <div className="mx-auto grid w-full max-w-[90rem] grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-20 lg:grid-cols-3">
        {clubs.map((club, index) => {
          const opensBikersRide = club.title === "Bikers";
          const opensFootball = club.title === "Football & Sports";
          const opensPhotography = club.title === "Photography";
          const opensFashion = club.title === "Fashion";
          const isClickable =
            opensBikersRide || opensFootball || opensPhotography || opensFashion;
          return (
          <motion.div
            key={club.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.06 }}
            className={`group ${isClickable ? "cursor-pointer" : "cursor-default"} ${club.comingSoon ? "opacity-95" : ""}`}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={
              opensBikersRide
                ? "Open Bikers scroll motion experience"
                : opensFootball
                ? "Open Football scroll motion experience"
                : opensPhotography
                ? "Open Photography scroll motion experience"
                : opensFashion
                ? "Open Fashion scroll motion experience"
                : undefined
            }
            onClick={() => {
              if (opensBikersRide) navigate("/bikers");
              else if (opensFootball) navigate("/football");
              else if (opensPhotography) navigate("/photography");
              else if (opensFashion) navigate("/fashion");
            }}
            onKeyDown={(e) => {
              if (!isClickable) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (opensBikersRide) navigate("/bikers");
                else if (opensFootball) navigate("/football");
                else if (opensPhotography) navigate("/photography");
                else if (opensFashion) navigate("/fashion");
              }
            }}
          >
            <MovableBlock
              id={`featured-club-${index}-media`}
              className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-xl shadow-slate-900/5 md:mb-8"
            >
              <ClubShowcase3D src={club.image} alt={club.title}>
              {club.comingSoon ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-slate-900/55 backdrop-blur-[2px]">
                  <MovableBlock id={`featured-club-${index}-badge`}>
                    <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-bold tracking-widest text-slate-900">
                      COMING SOON
                    </span>
                  </MovableBlock>
                </div>
              ) : null}
              </ClubShowcase3D>
            </MovableBlock>
            <MovableBlock id={`featured-club-${index}-copy`} className="px-1 md:px-2">
              <div className="flex flex-col gap-2 md:gap-3">
                <MovableBlock id={`featured-club-${index}-tags`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:text-sm">
                    {club.tags}
                  </p>
                </MovableBlock>
                <MovableBlock id={`featured-club-${index}-title`}>
                  <div className="flex items-center gap-3 text-xl font-medium tracking-tight text-slate-900 md:gap-4 md:text-3xl lg:text-4xl">
                    <span className="-ml-6 opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:opacity-100">
                      <ArrowRight size={28} className="md:h-8 md:w-8" />
                    </span>
                    <h3 className="transition-transform duration-300 ease-out">{club.title}</h3>
                  </div>
                </MovableBlock>
              </div>
            </MovableBlock>
          </motion.div>
          );
        })}
      </div>

      <MovableBlock id="featured-cta" className="relative z-10 mt-20 w-full md:mt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <Link
            href={SEE_ALL_CLUBS_HREF}
            prefetch
            onClick={() => storeRedirectIntent(LANDING_POST_AUTH_PATH)}
            className="flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold tracking-widest text-slate-900 shadow-xl shadow-slate-200 transition-all hover:scale-105 hover:bg-slate-50"
          >
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            SEE ALL CLUBS
          </Link>
        </motion.div>
      </MovableBlock>
    </section>
  );
}
