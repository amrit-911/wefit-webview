"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (!auth) throw new Error("Firebase Auth is not initialized. Check your credentials.");
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Check if user is inactive
      if (db) {
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "admin") {
            await signOut(auth);
            setAuthError("Only Users or Trainers can log in here");
            setLoading(false);
            return;
          }
          if (userData.status === "Inactive" || userData.status === "inactive") {
            await signOut(auth);
            setAuthError("Your account is inactive. Please contact support.");
            setLoading(false);
            return;
          }
        }
      }

      // AuthProvider will detect sign-in and redirect based on the user's role:
      // admin → /admin | trainer → /trainer | user → /main
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setAuthError("Invalid email or password");
      } else {
        setAuthError("Failed to sign in. Please try again.");
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
          alt="Login Background"
          className="w-full h-full object-cover object-center opacity-60"
        />
      </div>

      {/* Dark gradient to ensure text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/40 to-black/30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col px-6 pt-10 pb-10 z-10 max-w-md mx-auto w-full"
      >
        {/* Top Spacer */}
        <div className="flex-1" />

        {/* Welcome Text */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* crop logo to circle */}
          <Image src="/images/ptrb_logo.jpeg" className="rounded-full" alt="PTRB Logo" width={100} height={100} />
          <h1 className="text-[26px] font-extrabold text-white mb-0.5 tracking-wide drop-shadow-md">
            Welcome to <span className="text-[#a3e635]">PTRB</span>
          </h1>
          <p className="text-[13px] text-gray-300 font-medium tracking-wider">
            sign in to continue your journey
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-500 text-[13px] font-bold">{authError}</p>
            </div>
          )}

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

            <div className="flex justify-end mt-2 pt-0.5">
              <Link href="#" className="text-[#a3e635] text-[10px] font-bold tracking-wider mr-1 drop-shadow-sm">
                Forgot password ?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[13px] rounded-[10px] py-[22px] tracking-wide transition-colors mb-4 shadow-sm"
            disabled={loading}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </Button>

          <div className="text-center text-[11px] font-medium text-gray-300 tracking-wide pb-4 flex flex-col items-center gap-2">
            <span>Don't have a account ? <Link href="/join" className="text-[#a3e635] font-bold">Get Started</Link></span>
            <button 
              type="button" 
              onClick={() => {
                localStorage.removeItem('hasSeenIntro');
                 window.location.href = '/intro';
              }} 
              className="text-gray-500 hover:text-white underline text-[10px]"
            >
              Test Sliding Pages Again
            </button>
          </div>
        </form>

        {/* Bottom Spacer */}
        <div className="flex-1" />
      </motion.div>
    </div>
  );
}
