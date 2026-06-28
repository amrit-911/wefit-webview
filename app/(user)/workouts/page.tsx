"use client";

import { Play, Dumbbell, X, Footprints, Check } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import {
  getClientWorkoutPlan,
  getNextWorkoutDay,
  type WorkoutDay,
} from "@/lib/services/client-workout.service";
import { saveWorkoutLog, getWorkoutLogs } from "@/lib/services/workout-log.service";
import { getMemberById, updateMember } from "@/lib/services/members.service";
import { getLocalDateString } from "@/lib/utils";

function dayHeader(day: WorkoutDay): string {
  if (day.isRestDay) return "DAY OFF";
  if (day.header?.trim()) return day.header.trim().toUpperCase();
  const l = day.label.toUpperCase();
  if (l.includes("PUSH")) return "PUSH";
  if (l.includes("PULL")) return "PULL";
  if (l.includes("LEG")) return "LEG";
  if (l.includes("UPPER")) return "UPPER";
  if (l.includes("LOWER")) return "LOWER";
  if (l.includes("CORE") || l.includes("ABS")) return "CORE";
  if (l.includes("BACK")) return "BACK";
  if (l.includes("CHEST")) return "CHEST";
  if (l.includes("SHOULDER")) return "SHOULDER";
  return `D${day.dayNumber}`;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  return url;
}

function isDirectVideo(url: string): boolean {
  return !url.includes("youtube") && !url.includes("youtu.be");
}

export default function WorkoutsHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePill, setActivePill] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [stepsInput, setStepsInput] = useState("");
  const [targetSteps, setTargetSteps] = useState<string>("");
  const [yesterdaySteps, setYesterdaySteps] = useState<number | null>(null);
  const [savingSteps, setSavingSteps] = useState(false);
  const [stepsSaved, setStepsSaved] = useState(false);
  const [movingToNext, setMovingToNext] = useState(false);

  useEffect(() => {
    if (!user) return;

    getClientWorkoutPlan(user.uid)
      .then((plan) => {
        if (plan?.days) setDays(plan.days);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getWorkoutLogs(user.uid).then((logs) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = getLocalDateString(yesterday);
      const yLog = logs.find((l) => l.date === yStr && l.steps != null);
      if (yLog?.steps) setYesterdaySteps(yLog.steps);
    }).catch(() => {});

    getMemberById(user.uid).then((m) => {
      if (m?.targetSteps != null) setTargetSteps(String(m.targetSteps));
      if (m?.currentWorkoutDay != null) setActivePill(m.currentWorkoutDay);
    }).catch(() => {});
  }, [user]);

  async function handleSubmitSteps() {
    if (!user || savingSteps || !currentDay || !stepsInput) return;
    setSavingSteps(true);
    try {
      const today = getLocalDateString();
      await saveWorkoutLog({
        userId: user.uid,
        dayNumber: currentDay.dayNumber,
        dayLabel: currentDay.label,
        dayHeader: currentDay.header,
        date: today,
        exercises: [],
        steps: Number(stepsInput),
        stepsDone: true,
      });
      const nextDay = getNextWorkoutDay(days, currentDay.dayNumber);
      await updateMember(user.uid, { currentWorkoutDay: nextDay });
      setActivePill(nextDay);
      setStepsSaved(true);
      setStepsInput("");
      setTimeout(() => setStepsSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSteps(false);
    }
  }

  async function handleMoveToNext() {
    if (!user || movingToNext || !currentDay) return;
    setMovingToNext(true);
    try {
      const nextDay = getNextWorkoutDay(days, currentDay.dayNumber);
      await updateMember(user.uid, { currentWorkoutDay: nextDay });
      setActivePill(nextDay);
    } catch (e) {
      console.error(e);
    } finally {
      setMovingToNext(false);
    }
  }

  const visibleDays = (() => {
    const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
    const repeatIdx = sorted.findIndex((d) => d.isRepeat);
    return repeatIdx === -1 ? sorted : sorted.slice(0, repeatIdx);
  })();

  const currentDay = visibleDays.find((d) => d.dayNumber === activePill) ?? visibleDays[0] ?? null;

  return (
    <div className="min-h-dvh flex flex-col font-sans bg-[#121212] overflow-x-hidden relative pb-32">

      {/* Header */}
      <div className="pt-10 px-5 pb-4">
        <h1 className="text-[20px] font-extrabold text-white tracking-widest uppercase mb-0.5">WORKOUTS</h1>
        <p className="text-[11px] text-gray-400 font-medium">Your training schedule</p>
      </div>

      {/* Day pills */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar pb-1">
        {loading
          ? [1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[58px] h-8 bg-[#1c1c1e] rounded-full animate-pulse shrink-0" />
          ))
          : visibleDays.map((day) => {
            const label = dayHeader(day);
            const isActive = day.dayNumber === activePill;
            return (
              <button
                key={day.dayNumber}
                onClick={() => setActivePill(day.dayNumber)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide shrink-0 transition-all ${
                  isActive
                    ? day.isRestDay ? "bg-gray-500 text-white" : "bg-[#a3e635] text-black"
                    : day.isRestDay
                      ? "bg-[#1c1c1e] text-gray-600 border border-white/5"
                      : "bg-[#1c1c1e] text-gray-400 border border-white/5 hover:border-[#a3e635]/30"
                }`}
              >
                {label}
              </button>
            );
          })}
      </div>

      <div className="px-5 flex flex-col flex-1">

        {/* Day title */}
        {!loading && currentDay && (
          <motion.div
            key={activePill}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mb-4"
          >
            <h2 className="text-[15px] font-extrabold text-white uppercase tracking-wide">
              {currentDay.header?.trim()
                ? `${currentDay.header.toUpperCase()} - ${currentDay.label.toUpperCase()}`
                : currentDay.label.toUpperCase()}
            </h2>
            {!currentDay.isRestDay && (
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {currentDay.exercises.length} exercises
              </p>
            )}
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && [1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1c1c1e] rounded-[16px] h-[76px] animate-pulse mb-3 border border-white/5" />
        ))}

        {/* Rest day + steps */}
        {!loading && currentDay?.isRestDay && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">🛌</div>
              <p className="text-gray-400 font-bold text-[14px] tracking-wide">REST DAY</p>
              <p className="text-gray-600 text-[11px] mt-1">Take it easy and recover well.</p>
            </div>

            {targetSteps != null && targetSteps !== "" && Number(targetSteps) > 0 && (
            <div className="bg-[#1c1c1e] rounded-[16px] border border-white/5 p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
                  <Footprints className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-extrabold text-white">DAILY STEPS</span>
                  <div className="flex items-center gap-3 mt-1 mb-2">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Target:{" "}
                      <span className="text-[#a3e635] font-bold">
                        {targetSteps ? `${Number(targetSteps).toLocaleString()} steps` : "--"}
                      </span>
                    </span>
                    <span className="text-gray-700 text-[10px]">·</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Yesterday:{" "}
                      <span className="text-white font-bold">
                        {yesterdaySteps != null ? yesterdaySteps.toLocaleString() : "--"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Enter today's steps"
                      value={stepsInput}
                      onChange={(e) => { setStepsInput(e.target.value); setStepsSaved(false); }}
                      className="flex-1 min-w-0 h-8 bg-[#2a2a2c] border border-white/10 rounded-full px-3 text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/30"
                    />
                    <button
                      onClick={handleSubmitSteps}
                      disabled={savingSteps || !stepsInput}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 ${
                        stepsSaved
                          ? "bg-[#a3e635]/20 border border-[#a3e635]/40"
                          : "bg-[#a3e635] hover:bg-[#b5f745]"
                      }`}
                    >
                      {savingSteps ? (
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className={`w-3.5 h-3.5 ${stepsSaved ? "text-[#a3e635]" : "text-black"}`} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            <button
              onClick={handleMoveToNext}
              disabled={movingToNext}
              className="w-full h-12 bg-[#1c1c1e] border border-white/10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:bg-[#222] active:scale-[0.98] disabled:opacity-50"
            >
              {movingToNext ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Move to Next Day →"
              )}
            </button>
          </div>
        )}

        {/* Empty plan */}
        {!loading && visibleDays.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Dumbbell className="w-10 h-10 text-gray-600 mb-4" />
            <p className="text-[14px] font-bold text-white mb-1">No workout plan yet</p>
            <p className="text-[11px] text-gray-500">Your trainer hasn&apos;t assigned a workout plan yet</p>
          </div>
        )}

        {/* Exercise cards — collapsed only, no expand */}
        {!loading && currentDay && !currentDay.isRestDay && (
          <div className="flex flex-col gap-3 mb-4">
            {currentDay.exercises.map((ex, idx) => (
              <div
                key={idx}
                className="bg-[#1c1c1e] rounded-[16px] border border-white/5 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => { if (ex.videoLink) setVideoUrl(ex.videoLink); }}
                    disabled={!ex.videoLink}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      ex.videoLink
                        ? "bg-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.2)] hover:scale-105"
                        : "bg-[#2a2a2c] opacity-40 cursor-default"
                    }`}
                  >
                    <Play fill={ex.videoLink ? "black" : "#666"} className="w-4 h-4 pl-0.5" />
                  </button>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-extrabold text-white uppercase tracking-wide truncate">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      <span>Sets: {ex.repsPerSet?.length ?? ex.sets}</span>
                      <span className="mx-1.5">·</span>
                      <span>
                        Reps:{" "}
                        {ex.repsPerSet?.length
                          ? ex.repsPerSet.join(", ")
                          : ex.reps}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Overlay */}
      <AnimatePresence>
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          >
            <button
              onClick={() => setVideoUrl(null)}
              className="absolute top-10 right-4 w-10 h-10 rounded-full bg-[#2a2a2c] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {isDirectVideo(videoUrl) ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full max-w-md rounded-2xl bg-black"
                style={{ maxHeight: "70vh" }}
              />
            ) : (
              <iframe
                src={getEmbedUrl(videoUrl) ?? ""}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full max-w-md rounded-2xl"
                style={{ height: "56vw", maxHeight: "360px" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log This Workout CTA */}
      {!loading && currentDay && !currentDay.isRestDay && currentDay.exercises.length > 0 && (
        <div className="w-full px-5 z-40 max-w-md mx-auto">
          <button
            onClick={() => router.push(`/workouts/log?day=${activePill}`)}
            className="w-full h-14 font-extrabold text-[15px] rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center bg-[#a3e635] hover:bg-[#b5f745] text-black shadow-[#a3e635]/20"
          >
            Log This Workout
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
