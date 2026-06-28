"use client";

import { Play, Footprints, Plus, X, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getClientWorkoutPlan,
  getNextWorkoutDay,
  type WorkoutDay,
  type WorkoutExercise,
} from "@/lib/services/client-workout.service";
import { saveWorkoutLog, getWorkoutLogs, type WorkoutLog } from "@/lib/services/workout-log.service";
import { getMemberById, updateMember } from "@/lib/services/members.service";
import { notifyTrainerWorkoutDone } from "@/lib/services/notifications.service";
import { getLocalDateString } from "@/lib/utils";

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  return url;
}

function isDirectVideo(url: string): boolean {
  return !url.includes("youtube") && !url.includes("youtu.be");
}

type SetLog = { kg: string; reps: string };
type ExLogs = Record<number, SetLog[]>;

function initLogs(exercises: WorkoutExercise[]): ExLogs {
  const logs: ExLogs = {};
  exercises.forEach((ex, i) => {
    if (ex.repsPerSet?.length) {
      logs[i] = ex.repsPerSet.map((r) => ({ kg: "", reps: r }));
    } else {
      const numSets = parseInt(String(ex.sets), 10);
      logs[i] = Array.from({ length: isNaN(numSets) ? 3 : numSets }, () => ({
        kg: "",
        reps: String(ex.reps),
      }));
    }
  });
  return logs;
}

function WorkoutLogContent() {
  const { user, displayName, trainerId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = parseInt(searchParams.get("day") ?? "1") || 1;

  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [exLogs, setExLogs] = useState<ExLogs>({});
  const [stepsInput, setStepsInput] = useState("");
  const [targetSteps, setTargetSteps] = useState<string>("");
  const [lastWorkoutSteps, setLastWorkoutSteps] = useState<number | null>(null);
  const [prevDayLog, setPrevDayLog] = useState<WorkoutLog | null>(null);
  const [stepsInputVisible, setStepsInputVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    getClientWorkoutPlan(user.uid)
      .then((plan) => {
        if (plan?.days) {
          setDays(plan.days);
          const today = plan.days.find((d) => d.dayNumber === dayParam) ?? plan.days[0];
          if (today) setExLogs(initLogs(today.exercises));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getWorkoutLogs(user.uid).then((logs) => {
      const lastWithSteps = logs.find((l) => l.steps != null && l.steps > 0);
      if (lastWithSteps?.steps) setLastWorkoutSteps(lastWithSteps.steps);
      const prevForDay = logs.find((l) => l.dayNumber === dayParam);
      if (prevForDay) setPrevDayLog(prevForDay);
    }).catch(() => {});

    getMemberById(user.uid).then((m) => {
      if (m?.targetSteps != null) setTargetSteps(String(m.targetSteps));
      setStepsInputVisible(m?.stepsVisible === true);
    }).catch(() => {});
  }, [user, dayParam]);

  function updateSet(exIdx: number, setIdx: number, field: "kg" | "reps", val: string) {
    setExLogs((prev) => {
      const sets = [...(prev[exIdx] ?? [])];
      sets[setIdx] = { ...sets[setIdx], [field]: val };
      return { ...prev, [exIdx]: sets };
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExLogs((prev) => {
      const sets = [...(prev[exIdx] ?? [])];
      sets.splice(setIdx, 1);
      return { ...prev, [exIdx]: sets };
    });
  }

  function addSet(exIdx: number, ex: WorkoutExercise) {
    const lastTargetReps = ex.repsPerSet?.slice(-1)[0] ?? String(ex.reps);
    setExLogs((prev) => ({
      ...prev,
      [exIdx]: [...(prev[exIdx] ?? []), { kg: "", reps: lastTargetReps }],
    }));
  }

  const currentDay = days.find((d) => d.dayNumber === dayParam) ?? days[0] ?? null;

  async function handleSubmit() {
    if (!user || saving || !currentDay) return;
    setSaving(true);
    try {
      const today = getLocalDateString();
      await saveWorkoutLog({
        userId: user.uid,
        dayNumber: currentDay.dayNumber,
        dayLabel: currentDay.label,
        dayHeader: currentDay.header,
        date: today,
        exercises: currentDay.exercises.map((ex, idx) => ({
          name: ex.name,
          setLogs: exLogs[idx] ?? [],
        })),
        steps: stepsInput ? Number(stepsInput) : undefined,
        stepsDone: !!stepsInput,
      });
      const nextDay = getNextWorkoutDay(days, currentDay.dayNumber);
      await updateMember(user.uid, { currentWorkoutDay: nextDay });
      if (trainerId) {
        notifyTrainerWorkoutDone(
          trainerId,
          user.uid,
          displayName || "Client",
          currentDay.header || currentDay.label,
        ).catch(() => {});
      }
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col font-sans bg-[#121212] overflow-x-hidden relative pb-36">

      {/* Header */}
      <div className="pt-10 px-5 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold text-white tracking-widest uppercase mb-0.5">LOG WORKOUT</h1>
          <p className="text-[11px] text-gray-400 font-medium">Track your sets, reps &amp; steps</p>
        </div>
      </div>

      <div className="px-5 flex flex-col flex-1">

        {/* Day title */}
        {!loading && currentDay && (
          <motion.div
            key={dayParam}
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
          <div key={i} className="bg-[#1c1c1e] rounded-[16px] h-[140px] animate-pulse mb-3 border border-white/5" />
        ))}

        {/* Exercise cards — all expanded, no collapse */}
        {!loading && currentDay && !currentDay.isRestDay && (
          <div className="flex flex-col gap-3 mb-4">
            {currentDay.exercises.map((ex, idx) => {
              const sets = exLogs[idx] ?? [];
              return (
                <div
                  key={idx}
                  className="bg-[#1c1c1e] rounded-[16px] border border-white/5 overflow-hidden"
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4 pb-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-white uppercase tracking-wide truncate">
                        {ex.name}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        {ex.repsPerSet
                          ? `${ex.repsPerSet.length} sets${ex.restTime ? ` · Rest ${ex.restTime}` : ""}`
                          : `${ex.sets} sets · ${ex.reps} reps${ex.restTime ? ` · Rest ${ex.restTime}` : ""}`}
                      </p>
                    </div>
                  </div>

                  {/* Log inputs — always visible */}
                  <div className="px-4 pb-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-2 mt-3 px-0.5">
                      <span className="text-[9px] text-gray-600 font-bold uppercase w-14 shrink-0" />
                      <span className="text-[9px] text-gray-600 font-bold uppercase w-8 shrink-0 text-center">TGT</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase w-16 text-center">KG</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase w-16 text-center">REPS</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase w-14 shrink-0 text-right">PREV</span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {sets.map((s, si) => {
                        const targetReps = ex.repsPerSet?.[si] ?? String(ex.reps);
                        const prevExLog = prevDayLog?.exercises.find((e) => e.name === ex.name);
                        const prevSet = prevExLog?.setLogs[si];
                        return (
                          <div key={si} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 w-14 shrink-0">
                              {sets.length > 1 && (
                                <button
                                  onClick={() => removeSet(idx, si)}
                                  className="w-4 h-4 rounded-full bg-[#2a2a2c] flex items-center justify-center shrink-0 hover:bg-red-900/40 transition-colors"
                                >
                                  <X className="w-3 h-3 text-red-600" />
                                </button>
                              )}
                              <span className="text-[10px] text-gray-500 font-medium">
                                Set {si + 1}
                              </span>
                            </div>
                            <span className="w-8 shrink-0 text-center text-[11px] font-bold text-[#a3e635]/70">
                              ×{targetReps}
                            </span>
                            <input
                              type="number"
                              placeholder="—"
                              value={s.kg}
                              onChange={(e) => updateSet(idx, si, "kg", e.target.value)}
                              className="w-16 h-9 bg-[#2a2a2c] rounded-lg text-center text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40"
                            />
                            <input
                              type="number"
                              placeholder={targetReps}
                              value={s.reps}
                              onChange={(e) => updateSet(idx, si, "reps", e.target.value)}
                              className="w-16 h-9 bg-[#2a2a2c] rounded-lg text-center text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40"
                            />
                            <div className="flex text-right w-14 justify-end">
                              {prevSet ? (
                                <div className="text-[8px]  text-gray-500 font-medium">
                                  {prevSet.kg || "—"}kg×{prevSet.reps || "—"}
                                </div>
                              ) : (
                                <span className="text-[9px] text-gray-700">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => addSet(idx, ex)}
                      className="w-full h-9 border border-dashed border-[#a3e635]/30 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#a3e635] hover:bg-[#a3e635]/5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Set
                    </button>

                    {ex.note && (
                      <p className="text-[10px] text-gray-500 italic mt-3 pt-2 border-t border-white/5">
                        {ex.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Steps section */}
        {!loading && currentDay && !currentDay.isRestDay && stepsInputVisible && (
          <div className="bg-[#1c1c1e] rounded-[16px] border border-white/5 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
                <Footprints className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-extrabold text-white">DAILY STEPS</span>
                <div className="flex flex-col gap-1 mt-1 mb-2">
                  <span className="text-[10px] text-gray-500 font-medium">
                    Target:{" "}
                    <span className="text-[#a3e635] font-bold">
                      {targetSteps ? `${Number(targetSteps).toLocaleString()} steps` : "--"}
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Last logged steps:{" "}
                    <span className={lastWorkoutSteps != null ? "text-white font-bold" : "text-gray-600 italic"}>
                      {lastWorkoutSteps != null
                        ? `${lastWorkoutSteps.toLocaleString()} steps`
                        : "didn't add steps"}
                    </span>
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="Enter today's steps"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="w-full h-8 bg-[#2a2a2c] border border-white/10 rounded-full px-3 text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/30"
                />
              </div>
            </div>
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

      {/* Submit CTA */}
      {!loading && currentDay && !currentDay.isRestDay && currentDay.exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 z-40 max-w-md mx-auto bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent">
          <div className="flex items-center gap-3">
            <button
              disabled={saving}
              onClick={() => router.back()}
              className="h-14 px-6 font-extrabold text-[15px] rounded-xl transition-all active:scale-[0.98] bg-[#1c1c1e] border border-white/10 text-white disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 h-14 font-extrabold text-[15px] rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 bg-[#a3e635] hover:bg-[#b5f745] text-black shadow-[#a3e635]/20 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit Workout"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-6 pb-10"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", duration: 0.45 }}
              className="bg-[#1c1c1e] rounded-3xl p-8 w-full max-w-sm flex flex-col items-center border border-white/5"
            >
              <div className="w-16 h-16 bg-[#a3e635] rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(163,230,53,0.25)]">
                <Check className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
              <h2 className="text-[22px] font-extrabold text-white mb-2 text-center">
                Workout Logged!
              </h2>
              <p className="text-[13px] text-gray-500 font-medium text-center mb-8">
                Amazing effort. Keep pushing forward 💪
              </p>
              <button
                onClick={() => router.push("/main")}
                className="w-full h-12 bg-[#a3e635] hover:bg-[#b5f745] text-black font-extrabold text-[14px] rounded-xl transition-all active:scale-[0.98]"
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkoutLogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#121212]">
          <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WorkoutLogContent />
    </Suspense>
  );
}
