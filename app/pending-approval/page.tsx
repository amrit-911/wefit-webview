"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function PendingApprovalPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f7fa] to-[#ede8ff] p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(115,103,240,0.15)] p-10 max-w-md w-full text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-[#7367f0]/10 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-[#7367f0]" />
        </div>

        <h1 className="text-2xl font-bold text-[#5e5873] mb-3">Awaiting Approval</h1>
        <p className="text-sm text-[#b9b9c3] leading-relaxed mb-6">
          Your trainer account has been submitted and is pending admin approval. You&apos;ll be
          able to access the trainer dashboard once the admin reviews and approves your account.
        </p>

        <div className="bg-[#f8f7fa] rounded-xl p-4 flex items-start gap-3 text-left mb-8">
          <Mail className="w-4 h-4 text-[#7367f0] mt-0.5 shrink-0" />
          <p className="text-xs text-[#6e6b7b]">
            You&apos;ll receive an email once your account is approved. If you haven&apos;t heard
            back within 24 hours, contact your admin directly.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full border-[#7367f0] text-[#7367f0] hover:bg-[#7367f0] hover:text-white transition-all"
          onClick={() => logout?.()}
        >
          Sign out
        </Button>
      </motion.div>
    </div>
  );
}
