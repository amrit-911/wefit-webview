"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function JoinPage() {
  const router = useRouter();

  
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans relative overflow-hidden bg-black">
      {/* Background image overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/bgimage.png" 
          alt="Join Background"
          className="w-full h-full object-cover object-center opacity-40"
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/60 to-black/30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col px-6 pt-5 pb-10 z-10 max-w-md mx-auto w-full relative"
      >
        <div className="flex-1" />

        <div className="text-center mb-10 flex flex-col items-center">
        <Image src="/images/ptrb_logo.jpeg" className="rounded-full" alt="PTRB Logo" width={100} height={100} />
          <h1 className="text-[32px] font-extrabold text-white mb-1 tracking-wide drop-shadow-md">
            Join Us
          </h1>
          {/* <p className="text-[14px] text-white font-medium tracking-wider">
            Choose how you want to use <span className="text-[#a3e635] font-bold">PTRB</span>
          </p> */}
        </div>

        <div className="space-y-4 w-full">
          {/* User Option */}
          {/* <button 
            onClick={() => router.push('/signup?role=user')}
            className="w-full bg-[#1c1c1e] border border-white hover:border-[#a3e635] hover:bg-[#2a2a2c] rounded-2xl p-[22px] flex items-center gap-5 transition-all text-left group"
          >
            <div className="w-[42px] h-[42px] rounded-full bg-[#a3e635] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-[20px] h-[20px] text-black" fill="currentColor" />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-[15px] font-extrabold text-white mb-1.5 tracking-wide">AS A USER</h2>
              <p className="text-[11px] text-gray-400 font-medium leading-[1.4]">
                Track my workouts, nutrition and reach my fitness goal
              </p>
            </div>
          </button> */}

          {/* Trainer Option */}
          <button 
            onClick={() => router.push('/trainer-registration')}
            className="w-full bg-[#1c1c1e] border border-white hover:border-gray-500 hover:bg-[#2a2a2c] rounded-2xl p-[22px] flex items-center gap-5 transition-all text-left group"
          >
            <div className="w-[42px] h-[42px] rounded-full bg-[#a3e635] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-[20px] h-[20px] text-black" fill="currentColor" />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-[15px] font-extrabold text-white mb-1.5 tracking-wide">AS A TRAINER</h2>
              <p className="text-[11px] text-gray-400 font-medium leading-[1.4]">
                Manage clients, create workout plans and track progress
              </p>
            </div>
          </button>
        </div>

        <div className="flex-1" />

        <div className="text-center text-[11px] font-medium text-gray-300 tracking-wide mt-8">
          <span>Already have an account ? <Link href="/login" className="text-[#a3e635] font-bold">Sign In</Link></span>
        </div>
      </motion.div>
    </div>
  );
}
