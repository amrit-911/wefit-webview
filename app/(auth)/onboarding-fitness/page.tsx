"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/providers/auth-provider";
import { notifyAdminNewRegistration } from "@/lib/services/notifications.service";

const fitnessLevels = [
  {
    id: 'beginner',
    title: 'BEGINNER',
    desc: 'New to fitness or returning after a break',
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
    id: 'intermediate',
    title: 'INTERMEDIATE',
    desc: 'Work out regularly , 2/4 times per week',
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
    id: 'advanced',
    title: 'ADVANCED',
    desc: 'Consistent training , 5+ times per week',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <path d="M24 8 C18 8 12 13 12 20 C12 30 24 40 24 40 C24 40 36 30 36 20 C36 13 30 8 24 8Z" fill="#ef4444"/>
        <path d="M14 22 L19 26 L23 20 L27 28 L31 22 L34 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
];

export default function OnboardingFitnessPage() {
  const router = useRouter();
  const { refreshUserData } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLetsGo = async () => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser || !db) throw new Error("Not authenticated");

      // Retrieve previously stored onboarding data
      const goal = localStorage.getItem('onboarding_goal') ?? '';
      const aboutRaw = localStorage.getItem('onboarding_about');
      const about = aboutRaw ? JSON.parse(aboutRaw) : {};

      // Merge all onboarding data into the user document
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          onboarding: {
            goal,
            gender: about.gender ?? null,
            dob: about.dob ?? null,
            height: about.height ?? null,
            weight: about.weight ?? null,
            goalWeight: about.goalWeight ?? null,
            injuryNote: about.injuryNote ?? null,
            fitnessLevel: selectedLevel,
            completedAt: serverTimestamp(),
          },
          // Also save top-level fields so services can read them directly
          goal: goal ?? null,
          gender: about.gender ?? null,
          dob: about.dob ?? null,
          height: about.height ?? null,
          currentWeight: about.weight ?? null,
          goalWeight: about.goalWeight ?? null,
          injuries: about.injuryNote ?? null,
          joinDate: new Date().toISOString().split("T")[0],
          onboardingComplete: true,
        },
        { merge: true }
      );

      // Clean up localStorage
      localStorage.removeItem('onboarding_goal');
      localStorage.removeItem('onboarding_about');

      // Notify admin of new registration (fire-and-forget)
      notifyAdminNewRegistration(
        currentUser.displayName || "New Member",
        currentUser.uid,
        goal || "Not set"
      ).catch(console.error);

      // Refresh auth context so onboardingComplete becomes true before navigating
      await refreshUserData();

      router.push('/main');
    } catch (err) {
      console.error("Failed to save onboarding data:", err);
      router.push('/main');
    } finally {
      setLoading(false);
    }
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
          Fitness Level
        </h1>
        <p className="text-[12px] text-gray-400 font-medium">
          Where are you in your fitness journey ?
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full"
      >
        <div className="space-y-4 w-full mt-2">
          {fitnessLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`w-full bg-[#1c1c1e] border rounded-2xl p-[22px] flex items-center justify-between transition-all text-left group ${
                selectedLevel === level.id
                  ? 'border-[#a3e635] bg-[#22251a]'
                  : 'border-transparent hover:border-gray-600'
              }`}
            >
              <div>
                <h2 className="text-[15px] font-extrabold text-white mb-1.5 tracking-wide">{level.title}</h2>
                <p className="text-[11px] text-gray-400 font-medium leading-[1.4]">{level.desc}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10">
                {level.icon}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="pt-8 pb-10">
          <Button
            onClick={handleLetsGo}
            disabled={!selectedLevel || loading}
            className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[14px] rounded-[10px] py-[24px] tracking-wide transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Let's Go"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
