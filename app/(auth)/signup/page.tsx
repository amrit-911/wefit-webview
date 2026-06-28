"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (!auth || !db) throw new Error("Firebase is not initialized.");

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: data.fullName });

      // If trainer toggle is on → pending approval, else regular user
      const role = isTrainer ? "pending_trainer" : "user";

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        name: data.fullName,
        email: data.email,
        role,
        createdAt: serverTimestamp(),
      });

      if (isTrainer) {
        router.push("/pending-approval");
      } else {
        router.push("/onboarding-goal");
      }
    } catch (error: any) {
      console.error("Firebase Signup Error:", error);
      if (error.code === "auth/email-already-in-use") {
        setAuthError("This email already has an account. Please sign in instead.");
      } else {
        setAuthError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans relative overflow-hidden bg-black">
      {/* Background image overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/bgimage.png" 
          alt="Signup Background"
          className="w-full h-full object-cover object-center opacity-40"
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/40 to-black/30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col px-6 pt-24 pb-10 z-10 max-w-md mx-auto w-full"
      >
        <div className="flex-1" />

        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-[45px] h-[45px] rounded-full bg-[#a3e635] mb-3 shadow-[0_0_15px_rgba(163,230,53,0.5)]"></div>
          <p className="text-[13px] text-gray-300 font-medium tracking-wider mb-1">
            Welcome to <span className="text-[#a3e635]">PTRB</span>
          </p>
          <h1 className="text-[26px] font-extrabold text-white mb-0.5 tracking-wide drop-shadow-md">
            Create Account
          </h1>
          <p className="text-[11px] text-gray-400 font-medium tracking-wider mt-1">
            Start your fitness journey today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-500 text-[13px] font-bold">{authError}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white tracking-wider uppercase ml-1 drop-shadow-sm">Full name</p>
            <input
              type="text"
              placeholder="Full Name"
              {...register("fullName")}
              className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
            />
            {errors.fullName && <p className="text-red-500 text-[11px] font-bold mt-1 px-2">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white tracking-wider uppercase ml-1 drop-shadow-sm">Email</p>
            <input
              type="email"
              placeholder="your@gmail.com"
              {...register("email")}
              className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
            />
            {errors.email && <p className="text-red-500 text-[11px] font-bold mt-1 px-2">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 relative">
            <p className="text-[10px] font-bold text-white tracking-wider uppercase ml-1 drop-shadow-sm">Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                {...register("password")}
                className="w-full h-[48px] bg-[#1c1c1e] rounded-[10px] px-4 pr-12 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all border-none"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-[16px] h-[16px]" strokeWidth={2.5} /> : <Eye className="w-[16px] h-[16px]" strokeWidth={2.5} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-[11px] font-bold mt-1 px-2">{errors.password.message}</p>}
          </div>


          <Button
            type="submit"
            className="w-full mt-2 bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[13px] rounded-[10px] py-[22px] tracking-wide transition-colors mb-4 shadow-sm"
            disabled={loading}
          >
            {loading ? "CREATING..." : isTrainer ? "APPLY AS TRAINER" : "CREATE ACCOUNT"}
          </Button>

          <div className="text-center text-[11px] font-medium text-gray-300 tracking-wide pb-4 flex flex-col items-center gap-2">
            <span>Already have an account? <Link href="/login" className="text-[#a3e635] font-bold">Sign In</Link></span>
          </div>
        </form>

        <div className="flex-1" />
      </motion.div>
    </div>
  );
}
