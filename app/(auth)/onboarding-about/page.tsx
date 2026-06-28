"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const todayStr = new Date().toISOString().split("T")[0];

export default function OnboardingAboutPage() {
  const router = useRouter();
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<string>("");
  const [height, setHeight] = useState<string>("175");
  const [weight, setWeight] = useState<string>("80");
  const [goalWeight, setGoalWeight] = useState<number>(75);
  const [injuryNote, setInjuryNote] = useState<string>("");

  const handleContinue = () => {
    if (!gender || !dob || !height || !weight) return;
    localStorage.setItem("onboarding_about", JSON.stringify({
      gender,
      dob,
      height: Number(height),
      weight: Number(weight),
      goalWeight,
      injuryNote: injuryNote.trim(),
    }));
    router.push("/onboarding-fitness");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#121212] relative px-6">
      {/* Header */}
      <div className="pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[28px] font-extrabold text-white tracking-wide mb-1">
          About You
        </h1>
        <p className="text-[12px] text-gray-400 font-medium">
          Help us personalize your experience
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full"
      >
        <div className="space-y-6 w-full mt-2">

          {/* Gender */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-white tracking-wider uppercase ml-1">GENDER</p>
            <div className="grid grid-cols-3 gap-3">
              {["Male", "Female", "Other"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-[10px] text-[12px] font-medium transition-colors ${
                    gender === g
                      ? "bg-[#a3e635] text-black font-bold"
                      : "bg-[#1c1c1e] text-gray-400 hover:bg-[#2a2a2c]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-white tracking-wider uppercase ml-1">DATE OF BIRTH</p>
            <input
              type="date"
              value={dob}
              max={todayStr}
              onChange={(e) => setDob(e.target.value)}
              className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
            />
          </div>

          {/* Height and Weight Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-white tracking-wider uppercase ml-1">HEIGHT ( CM )</p>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-white tracking-wider uppercase ml-1">WEIGHT ( KG )</p>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
              />
            </div>
          </div>

          {/* Goal Weight Slider */}
          <div className="bg-[#1c1c1e] rounded-[14px] p-5">
            <div className="flex justify-between items-end mb-4">
              <p className="text-[12px] font-bold text-white tracking-wide">Goal Weight</p>
              <p className="text-[14px] font-extrabold text-[#a3e635]">{goalWeight}KG</p>
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={goalWeight}
              onChange={(e) => setGoalWeight(Number(e.target.value))}
              className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer outline-none overflow-hidden"
              style={{
                background: `linear-gradient(to right, #a3e635 ${(goalWeight - 40) / (150 - 40) * 100}%, white ${(goalWeight - 40) / (150 - 40) * 100}%)`
              }}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-[10px] text-gray-500 font-medium">40kg</span>
              <span className="text-[10px] text-gray-500 font-medium">150kg</span>
            </div>
          </div>

          {/* Injury Note */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-white tracking-wider uppercase ml-1">INJURY NOTE <span className="text-gray-500 normal-case font-medium tracking-normal">(optional)</span></p>
            <textarea
              value={injuryNote}
              onChange={(e) => setInjuryNote(e.target.value)}
              placeholder="e.g., Previous knee injury, avoid deep squats"
              rows={3}
              className="w-full bg-[#1c1c1e] rounded-[10px] px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none resize-none"
            />
          </div>

        </div>

        <div className="flex-1" />

        <div className="pt-8 pb-10">
          <Button
            onClick={handleContinue}
            disabled={!gender || !dob || !height || !weight}
            className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[14px] rounded-[10px] py-[24px] tracking-wide transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
