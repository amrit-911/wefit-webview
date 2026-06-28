"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "the client";
  const name = searchParams.get("name") ?? "";

  return (
    <div className="min-h-[100dvh] bg-[#121212] font-sans flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col items-center text-center w-full max-w-sm"
      >
        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          className="w-20 h-20 rounded-full bg-[#a3e635] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(163,230,53,0.35)]"
        >
          <Check className="w-10 h-10 text-black" strokeWidth={3} />
        </motion.div>

        {/* Title */}
        <h1 className="text-[28px] font-extrabold text-white mb-1">Client Added!</h1>
        {name && (
          <p className="text-[15px] font-bold text-[#a3e635] mb-2">{name}</p>
        )}

        {/* Subtitle */}
        <p className="text-[13px] text-gray-400 leading-relaxed mb-8">
          Login credentials have been sent to{" "}
          <span className="text-white font-semibold">{email}</span>
        </p>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full space-y-3 mb-12"
        >
          {[
            "Profile Created",
            "Credentials Emailed",
            "Ready For Plan Assignment",
          ].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <Check className="w-4 h-4 text-[#a3e635] shrink-0" strokeWidth={3} />
              <span className="text-[13px] text-gray-300">{item}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 w-full"
        >
          <button
            onClick={() => router.push("/trainer/clients/add")}
            className="flex-1 h-13 bg-[#a3e635] hover:bg-[#b5f745] text-black font-bold text-[13px] rounded-xl transition-colors flex items-center justify-center gap-1.5 py-4"
          >
            <span className="text-[16px] font-light">+</span>
            Add Another
          </button>
          <button
            onClick={() => router.push("/trainer/clients")}
            className="flex-1 h-13 bg-[#1c1c1e] hover:bg-[#2a2a2c] text-white font-bold text-[13px] rounded-xl border border-[#2a2a2c] transition-colors py-4"
          >
            View Clients
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function AddClientSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
