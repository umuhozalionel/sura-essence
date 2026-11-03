"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAVONET_URL, getBrand } from "@/lib/brands";
import { HubMore } from "./hub-more";

// VIDEO: "Discover Rwanda", © Visit Rwanda. Credited on the page (Hub.hero.video.credit).
const VIDEO = "/videos/Discover%20Rwanda.mp4";
// PICTURE, for Lionel to place: shows until the video starts, and on phones until it's played.
const POSTER = "/backgrounds/nyungwe_sky.jpg";
const SKIP_SECONDS = 10;

// The two doors, equal in size. Each action paints with its own brand's tokens (data-brand).
const DOORS = [
  { id: "movana", href: "/movana", action: "bg-secondary text-secondary-foreground" },
  { id: "iwacu", href: "/iwacu", action: "bg-primary text-primary-foreground" },
] as const;
type DoorId = (typeof DOORS)[number]["id"];

// When each piece arrives (.hub-rise in app/globals.css). Done in CSS so the page
// is readable before the script loads.
const rise = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const CONTROL = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white/15";

/**
 * The chooser: one statement and a door into each brand over a full-screen video.
 *
 * From lg up the video plays on its own, muted. Phones wait for a tap, because the file
 * is large for mobile data, and so does reduced motion. It pauses while off screen.
 */
export function HomeView() {
  const t = useTranslations("Hub.hero");
  const tFooter = useTranslations("Footer");
  const tMore = useTranslations("MoreSections");
  const still = useReducedMotion();
  const [active, setActive] = useState<DoorId | null>(null);
  const [more, setMore] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const hero = useRef<HTMLElement>(null);
  const wantsPlay = useRef(false); // what the visitor wants, apart from pausing while off screen
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // The video can finish loading its details before this page wakes up and misses the event.
    const v = video.current;
    if (v && v.readyState > 0) setDuration(v.duration);
  }, []);

  useEffect(() => {
    if (still || !window.matchMedia("(min-width: 64rem)").matches) return;
    wantsPlay.current = true;
    void video.current?.play().catch(() => undefined);
  }, [still]);

  useEffect(() => {
    if (!hero.current) return;
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.current?.pause();
      else if (wantsPlay.current) void video.current?.play().catch(() => undefined);
    });
    watch.observe(hero.current);
    return () => watch.disconnect();
  }, []);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    wantsPlay.current = v.paused;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  };

  const seek = (to: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(to, 0), duration || to);
    setTime(v.currentTime);
  };

  return (
    <>
      <section ref={hero} className="relative isolate flex min-h-svh flex-col overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src={POSTER} alt={t("imageAlt")} fill preload sizes="100vw" className="object-cover" />
          <video
            ref={video}
            src={VIDEO}
            aria-label={t("video.label")}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing || time > 0 ? "opacity-100" : "opacity-0"}`}
          />
          {/* Even shade, deepest in the middle behind the words, so the edges of the picture stay clear. */}
          <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45),transparent_70%)]" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center gap-8 [@media(max-height:640px)]:gap-4 px-6 md:px-10 pt-[calc(var(--header-h)+1.5rem)] [@media(max-height:640px)]:pt-[calc(var(--header-h)+0.25rem)] pb-6 [@media(max-height:640px)]:pb-2 text-center">
          <div className="flex max-w-3xl flex-col items-center gap-4">
            <h1 style={rise(0)} className="hub-rise text-4xl md:text-6xl [@media(max-height:760px)]:text-5xl font-medium tracking-[-0.01em] leading-[1.05]">
              {t("title")}
            </h1>
            <p style={rise(120)} className="hub-rise max-w-xl text-base md:text-lg text-white/85">{t("text")}</p>
          </div>
          <ul className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            {DOORS.map((door, i) => (
              <li key={door.id} data-brand={door.id} style={rise(240 + i * 120)} className="hub-rise">
                <motion.div
                  animate={{ y: active === door.id && !still ? -6 : 0 }}
                  transition={{ duration: still ? 0 : 0.25 }}
                  className="h-full"
                >
                  <Link
                    href={door.href}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setActive(door.id)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(door.id)}
                    onBlur={() => setActive(null)}
                    className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-white/20 bg-black/50 p-5 [@media(max-height:640px)]:p-4 backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="text-base font-semibold">{getBrand(door.id).name}</span>
                    <span className="mb-3 [@media(max-height:640px)]:mb-1 text-sm leading-snug text-white/80">{t(`doors.${door.id}.line`)}</span>
                    <span className={`mt-auto inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${door.action}`}>
                      {t(`doors.${door.id}.action`)}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom row: rights and credit, More, video controls and the video's credit. */}
        <div className="mx-auto grid w-full max-w-[1400px] items-end gap-3 px-6 md:px-10 pb-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="order-3 text-center text-xs text-white/75 lg:order-1 lg:text-left">
            <p>{tFooter("copyright", { year: new Date().getFullYear() })}</p>
            <p>
              {tFooter("poweredBy")}{" "}
              <a href={BRAVONET_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline-offset-2 hover:underline">
                Bravonet Technologies
              </a>
            </p>
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <button
              type="button"
              aria-expanded={more}
              aria-controls="hub-more"
              onClick={() => setMore(!more)}
              className="min-h-11 rounded-full bg-white px-7 text-sm font-semibold text-foreground transition-colors hover:bg-white/85"
            >
              {more ? tMore("less") : tMore("more")}
            </button>
          </div>
          <div className="order-2 flex flex-col items-center gap-1 lg:order-3 lg:items-end">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => seek(time - SKIP_SECONDS)} aria-label={t("video.back")} className={CONTROL}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={togglePlay} aria-label={playing ? t("video.pause") : t("video.play")} className={CONTROL}>
                {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => seek(time + SKIP_SECONDS)} aria-label={t("video.forward")} className={CONTROL}>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label={t("video.seek")}
                aria-valuetext={clock(time)}
                style={{ "--seek": `${duration ? (time / duration) * 100 : 0}%` } as CSSProperties}
                className="hub-seek w-16 min-w-0 sm:w-28 xl:w-36"
              />
              <span className="text-xs tabular-nums">{clock(time)} / {clock(duration)}</span>
              <button type="button" onClick={() => setMuted(!muted)} aria-label={muted ? t("video.unmute") : t("video.mute")} className={CONTROL}>
                {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <p className="text-xs text-white/75">{t("video.credit")}</p>
          </div>
        </div>
      </section>
      <HubMore open={more} onClose={() => setMore(false)} />
    </>
  );
}
