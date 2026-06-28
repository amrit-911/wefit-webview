"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { GoalCountdown } from "@/components/ui/goal-countdown";
import { Suspense } from "react";

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs)) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function WorkoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const exerciseCount = parseInt(searchParams.get("exercises") ?? "0") || 0;
  const totalSets = parseInt(searchParams.get("sets") ?? "0") || 0;
  const totalReps = parseInt(searchParams.get("reps") ?? "0") || 0;
  const durationSecs = parseInt(searchParams.get("duration") ?? "0") || 0;
  const dayLabel = searchParams.get("label") || "";
  const dayNum = searchParams.get("day") || "";

  const hasStats = exerciseCount > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center font-sans bg-[#121212] px-5 relative pb-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center w-full max-w-md mt-16"
      >
        {/* Animated Checkmark Circle */}
        <div className="w-[50px] h-[50px] bg-[#a3e635] rounded-full flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(163,230,53,0.3)] shrink-0 transition-transform hover:scale-110">
          <Check className="w-6 h-6 text-black" strokeWidth={4} />
        </div>

        <h1 className="text-[24px] font-extrabold text-white mb-1 text-center tracking-tight flex items-center gap-2">
          Workout Completed 💪
        </h1>

        {dayLabel || dayNum ? (
          <p className="text-[11px] text-[#a3e635] font-extrabold tracking-widest uppercase mb-1">
            {dayLabel ? dayLabel : `Day ${dayNum}`}
          </p>
        ) : null}

        <p className="text-[13px] text-gray-500 font-medium tracking-wide mb-8">
          Amazing effort! Keep pushing forward
        </p>

        {/* Stats Grid */}
        {hasStats && (
          <div className="w-full grid grid-cols-3 gap-3 mb-8">
            <div className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col items-center justify-center border border-[#2a2a2c]">
              <span className="text-[22px] font-extrabold text-[#a3e635] leading-none mb-1">{exerciseCount}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Exercises</span>
            </div>
            <div className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col items-center justify-center border border-[#2a2a2c]">
              <span className="text-[22px] font-extrabold text-[#a3e635] leading-none mb-1">{totalSets}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Sets</span>
            </div>
            <div className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col items-center justify-center border border-[#2a2a2c]">
              <span className="text-[22px] font-extrabold text-[#a3e635] leading-none mb-1">{totalReps}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Total Reps</span>
            </div>
            <div className="col-span-3 bg-[#1c1c1e] rounded-2xl p-4 flex items-center justify-center gap-2 border border-[#2a2a2c]">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duration</span>
              <span className="text-[10px] font-bold text-gray-600">•</span>
              <span className="text-[16px] font-extrabold text-white">{formatDuration(durationSecs)}</span>
            </div>
          </div>
        )}

        {/* Goal Countdown block */}
        <div className="w-full mb-8">
          <GoalCountdown />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => router.push('/main')}
            className="flex-1 border border-[#2a2a2c] bg-transparent text-gray-400 hover:text-white hover:border-gray-500 font-bold text-[12px] tracking-wide rounded-[8px] py-[18px] transition-colors"
          >
            Back To Home
          </button>
          <button
            onClick={() => router.push('/nutrition')}
            className="flex-1 bg-[#a3e635] hover:bg-[#b5f745] text-black font-bold text-[12px] tracking-wide rounded-[8px] py-[18px] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#a3e635]/20"
          >
            Log Nutrition
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WorkoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212]">
        <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkoutSuccessContent />
    </Suspense>
  );
}
