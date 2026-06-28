"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainerSuccessPage() {
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
        
        <h1 className="text-[24px] font-extrabold text-white mb-4 tracking-wide">
          Application Submitted !
        </h1>
        
        <p className="text-[13px] text-gray-400 font-medium leading-[1.6] px-2 mb-12">
          Your application is under review. The admin will verify your credentials and send you login details once approved
        </p>

        <Button
          onClick={() => router.push('/login')}
          className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[13px] rounded-[10px] py-[22px] tracking-wide transition-colors"
        >
          GO TO LOGIN
        </Button>
      </motion.div>
    </div>
  );
}
