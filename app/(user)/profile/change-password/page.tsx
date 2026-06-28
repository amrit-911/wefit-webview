"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";

export default function UserChangePasswordPage() {
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpdate() {
    setError("");
    if (!currentPw) { setError("Please enter your current password."); return; }
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }

    const currentUser = auth?.currentUser;
    if (!currentUser?.email) { setError("Unable to verify user. Please log in again."); return; }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      setSuccess(true);
      setTimeout(() => router.back(), 900);
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Current password is incorrect.");
      } else {
        setError(e?.message ?? "Failed to update password.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 text-[12px] font-medium mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        back
      </button>

      <h1 className="text-[22px] font-extrabold text-white mb-8">Change Password</h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Current Password */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button onClick={() => setShowCurrent((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button onClick={() => setShowNew((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button onClick={() => setShowConfirm((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-[12px] font-medium">{error}</p>}

        <button
          onClick={handleUpdate}
          disabled={saving || success}
          className="w-full h-13 bg-[#a3e635] disabled:opacity-60 rounded-2xl text-[15px] font-extrabold text-black mt-2"
        >
          {success ? "Updated ✓" : saving ? "Updating…" : "Update Password"}
        </button>
      </motion.div>
    </div>
  );
}
