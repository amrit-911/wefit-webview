"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CheckinSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center font-sans bg-[#121212] px-6 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center"
      >
        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 bg-[#a3e635] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
          <Check className="w-8 h-8 text-black" strokeWidth={3} />
        </div>

        <h1 className="text-[26px] font-extrabold text-white mb-3 text-center tracking-tight">
          Check-In Completed
        </h1>
        <p className="text-[14px] text-gray-500 font-medium tracking-wide">
          Great Consistency
        </p>

        {/* Buttons Row */}
        <div className="flex items-center gap-3 w-full max-w-sm mt-12">
          <button
            onClick={() => router.push('/main')}
            className="flex-1 border border-[#2a2a2c] bg-transparent text-gray-400 hover:text-white hover:border-gray-500 font-semibold text-[11px] rounded-[8px] py-[16px] transition-colors"
          >
            Back To Home
          </button>
          {/* <button
            onClick={() => router.push('/daily-checkin')}
            className="flex-1 bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[11px] rounded-[8px] py-[16px] transition-colors"
          >
            Back To Calendar
          </button> */}
        </div>
      </motion.div>
    </div>
  );
}
