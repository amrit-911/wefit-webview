"use client";

import { ArrowLeft, Play } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/auth-provider";
import { getClientWorkoutPlan, WorkoutExercise } from "@/lib/services/client-workout.service";

export default function ActiveExercisePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const dayId = parseInt((params?.id as string) || "1");

  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [dayLabel, setDayLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!user) return;
    getClientWorkoutPlan(user.uid).then((plan) => {
      if (plan) {
        const day = plan.days.find((d) => d.dayNumber === dayId);
        if (day && day.exercises && day.exercises.length > 0) {
          setExercises(day.exercises);
          setDayLabel(day.label || `Day ${dayId}`);
        }
      }
      setLoading(false);
    });
  }, [user, dayId]);

  const currentEx = exercises[currentIndex] ?? null;
  const isLast = currentIndex === exercises.length - 1;

  const handleNext = () => {
    if (isLast) {
      const durationSecs = Math.round((Date.now() - startTime) / 1000);
      const totalSets = exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);
      const totalReps = exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0) * (Number(ex.reps) || 0), 0);
      const params = new URLSearchParams({
        exercises: String(exercises.length),
        sets: String(totalSets),
        reps: String(totalReps),
        duration: String(durationSecs),
        label: dayLabel,
        day: String(dayId),
      });
      router.push(`/workouts/success?${params.toString()}`);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#121212] overflow-x-hidden relative">

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !currentEx ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-400 font-bold text-[13px] tracking-wide">NO EXERCISES FOUND</p>
          <button onClick={() => router.back()} className="mt-6 text-[#a3e635] text-[12px] font-bold">← Go back</button>
        </div>
      ) : (
        <>
          <div className="pt-10 px-5 pb-8 flex flex-col items-center relative">
            <button
              onClick={() => router.back()}
              className="absolute left-5 top-10 flex items-center text-gray-400 hover:text-white text-[12px] font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              back
            </button>

            <p className="text-[10px] text-[#a3e635] font-extrabold tracking-widest mt-12 mb-2 uppercase">
              EXERCISE {currentIndex + 1} OF {exercises.length}
            </p>
            <h1 className="text-[22px] font-extrabold text-white tracking-wide uppercase mb-1">
              {currentEx.name}
            </h1>
            <p className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase">
              {currentEx.restTime ? `REST ${currentEx.restTime}S` : "EXERCISE"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-5 flex flex-col gap-5 flex-1 pb-32"
            >
              {/* Reps/Sets Circles */}
              <div className="bg-[#1c1c1e] rounded-[16px] py-10 flex items-center justify-center gap-6 border border-[#2a2a2c] shadow-lg">
                <div className="w-[110px] h-[110px] rounded-full bg-[#a3e635] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.2)]">
                  <span className="text-[42px] font-extrabold text-black leading-none tracking-tighter mt-1">{currentEx.reps}</span>
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest mt-0.5">REPS</span>
                </div>
                <div className="w-[110px] h-[110px] rounded-full bg-[#a3e635] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.2)]">
                  <span className="text-[42px] font-extrabold text-black leading-none tracking-tighter mt-1">{currentEx.sets}</span>
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest mt-0.5">SETS</span>
                </div>
              </div>

              {/* Note / Instructions Box */}
              <div className="bg-[#1c1c1e] rounded-[16px] p-6 flex flex-col items-center justify-center border border-[#2a2a2c] min-h-[160px] text-center shadow-md">
                {currentEx.restTime && (
                  <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3 text-center">
                    REST {currentEx.restTime} SECONDS
                  </p>
                )}
                {currentEx.note ? (
                  <p className="text-[11px] font-bold text-white uppercase leading-relaxed max-w-[220px] mb-6">
                    {currentEx.note}
                  </p>
                ) : (
                  <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed max-w-[220px] mb-6">
                    PERFORM THE EXERCISE WITH PROPER FORM
                  </p>
                )}
                <button
                  onClick={() => {
                    if (currentEx.videoLink) window.open(currentEx.videoLink, "_blank");
                  }}
                  disabled={!currentEx.videoLink}
                  className={`bg-[#a3e635] text-black font-extrabold text-[10px] rounded-full px-5 py-2.5 flex items-center justify-center gap-1.5 transition-transform ${currentEx.videoLink ? "hover:bg-[#b5f745] hover:scale-105 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                >
                  <Play fill="black" className="w-3 h-3 relative top-[0.5px]" />
                  {currentEx.videoLink ? "PLAY VIDEO" : "NO VIDEO"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="fixed bottom-[95px] left-0 right-0 px-5 max-w-md mx-auto z-40 flex gap-4">
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-extrabold text-[13px] tracking-wider rounded-[10px] py-[18px] transition-colors"
              >
                BACK
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-[2] bg-[#a3e635] hover:bg-[#b5f745] text-black font-extrabold text-[14px] tracking-wider rounded-[10px] py-[18px] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#a3e635]/20"
            >
              {isLast ? "FINISH" : "NEXT"}
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
