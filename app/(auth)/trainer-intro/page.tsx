"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainerIntroPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#121212] relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full text-center"
      >
        <div className="w-[50px] h-[50px] rounded-full bg-[#a3e635] flex items-center justify-center mb-6">
          <Clock className="w-6 h-6 text-black" strokeWidth={2.5} />
        </div>
        
        <h1 className="text-[22px] font-extrabold text-white mb-4 tracking-wide">
          Manage Your Clients Efficiently
        </h1>
        
        <p className="text-[13px] text-gray-400 font-medium leading-[1.6] px-2 mb-12">
          Track workouts, nutrition, and progress in one place
        </p>

        <Button
          onClick={() => router.push('/trainer-registration')}
          className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[13px] rounded-[10px] py-[22px] tracking-wide transition-colors mb-8"
        >
          Get Started
        </Button>
        
        <div className="text-center text-[11px] font-medium text-gray-400 tracking-wide">
          Already have an account ? <button type="button" onClick={() => router.push('/login')} className="text-[#a3e635] font-bold hover:underline">Sign in</button>
        </div>
      </motion.div>
    </div>
  );
}
