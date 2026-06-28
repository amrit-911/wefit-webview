"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const goals = [
  {
    id: 'lose_weight',
    title: 'LOSE WEIGHT',
    desc: 'Burn fat and get lean',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <circle cx="24" cy="20" r="14" stroke="#60a5fa" strokeWidth="3" fill="#1e3a5f"/>
        <path d="M14 36 L24 28 L34 36" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="24" y1="8" x2="24" y2="16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="24" y1="24" x2="24" y2="28" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="16" x2="20" y2="20" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
        <line x1="32" y1="16" x2="28" y2="20" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'build_muscle',
    title: 'BUILD MUSCLE',
    desc: 'Gain strength and mass',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <circle cx="24" cy="24" r="16" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
        <path d="M14 20 Q14 16 18 16 L30 16 Q34 16 34 20 L34 28 Q34 32 30 32 L18 32 Q14 32 14 28 Z" fill="#4b5563"/>
        <circle cx="20" cy="24" r="3" fill="#9ca3af"/>
        <circle cx="28" cy="24" r="3" fill="#9ca3af"/>
        <line x1="23" y1="24" x2="25" y2="24" stroke="#9ca3af" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'stay_active',
    title: 'STAY ACTIVE',
    desc: 'Maintain an active lifestyle',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <path d="M24 8 C18 8 12 13 12 20 C12 30 24 40 24 40 C24 40 36 30 36 20 C36 13 30 8 24 8Z" fill="#ef4444"/>
        <path d="M14 22 L19 26 L23 20 L27 28 L31 22 L34 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'improve_health',
    title: 'IMPROVE HEALTH',
    desc: 'Better overall wellness',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <circle cx="24" cy="22" r="13" fill="#16a34a"/>
        <circle cx="24" cy="22" r="13" fill="url(#appleGreen)"/>
        <ellipse cx="24" cy="22" rx="10" ry="11" fill="#22c55e"/>
        <ellipse cx="20" cy="18" rx="4" ry="5" fill="#4ade80" opacity="0.5"/>
        <path d="M24 10 Q26 6 30 7" stroke="#15803d" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <defs>
          <radialGradient id="appleGreen" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#86efac"/>
            <stop offset="100%" stopColor="#16a34a"/>
          </radialGradient>
        </defs>
      </svg>
    ),
  },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedGoal) return;
    localStorage.setItem('onboarding_goal', selectedGoal);
    router.push('/onboarding-about');
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
          What&apos;s your goal ?
        </h1>
        <p className="text-[12px] text-gray-400 font-medium">
          Choose what matters most to you right now.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full"
      >
        <div className="space-y-4 w-full mt-2">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`w-full bg-[#1c1c1e] border rounded-2xl p-[22px] flex items-center justify-between transition-all text-left group ${
                selectedGoal === goal.id
                  ? 'border-[#a3e635] bg-[#22251a]'
                  : 'border-transparent hover:border-gray-600'
              }`}
            >
              <div>
                <h2 className="text-[15px] font-extrabold text-white mb-1.5 tracking-wide">{goal.title}</h2>
                <p className="text-[11px] text-gray-400 font-medium leading-[1.4]">{goal.desc}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10">
                {goal.icon}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="pt-8 pb-10">
          <Button
            onClick={handleContinue}
            disabled={!selectedGoal}
            className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[14px] rounded-[10px] py-[24px] tracking-wide transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
