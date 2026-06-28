"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEffect } from "react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, role, loading: authLoading, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (role === "admin") {
        router.replace("/admin");
      } else {
        logout();
      }
    }
  }, [user, role, authLoading, logout, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!auth || !db) throw new Error("Firebase is not initialized.");

      // 1. Sign in with Firebase Auth
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);

      // 2. Verify role in Firestore
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : null;

      if (role !== "admin") {
        // Not an admin — sign them back out immediately
        await signOut(auth);
        setError("Access denied. This portal is for administrators only.");
        setLoading(false);
        return;
      }

      // 3. Admin confirmed → redirect
      router.replace("/admin");
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message ?? "Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(115,103,240,0.12)] overflow-hidden">
          {/* Purple header strip */}
          <div className="bg-[#7367f0] px-8 pt-8 pb-10 text-center relative">
            {/* decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

              <div className="w-14 h-14 mx-auto text-black bg-white font-bold rounded-full flex items-center justify-center">PTRB</div>
            <h1 className="text-xl font-bold text-white tracking-wide">Admin Portal</h1>
            <p className="text-white/70 text-[13px] mt-1">Welcome to PTRB Fitness!</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  <ShieldCheck className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-red-600 font-medium leading-snug">{error}</p>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#5e5873] tracking-wide uppercase">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@ptrb.com"
                  {...register("email")}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#5e5873] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7367f0]/30 focus:border-[#7367f0] transition-all"
                />
                {errors.email && (
                  <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#5e5873] tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 pr-11 text-[14px] text-[#5e5873] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7367f0]/30 focus:border-[#7367f0] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7367f0] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[17px] h-[17px]" />
                    ) : (
                      <Eye className="w-[17px] h-[17px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-lg bg-[#7367f0] hover:bg-[#6254e8] text-white font-semibold text-[14px] tracking-wide transition-colors shadow-[0_4px_16px_rgba(115,103,240,0.4)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="text-center text-[12px] text-gray-400 mt-6">
              Not an admin?{" "}
              <a href="/login" className="text-[#7367f0] font-semibold hover:underline">
                Go to user login
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-5">
          PTRB FITNESS · Admin Panel · All rights reserved
        </p>
      </motion.div>
    </div>
  );
}
