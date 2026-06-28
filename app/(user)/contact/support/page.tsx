"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { submitContactRequest } from "@/lib/services/contact-requests.service";
import { toast } from "sonner";

export default function UserSupportPage() {
  const router = useRouter();
  const { user, displayName } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error("Please enter a message."); return; }
    if (!user) return;

    setSubmitting(true);
    try {
      await submitContactRequest({
        type: "support",
        fromId: user.uid,
        fromName: displayName || user.email || "User",
        fromRole: "user",
        toRole: "admin",
        message: message.trim(),
      });
      toast.success("Message sent to admin!");
      router.back();
    } catch {
      toast.error("Failed to send message. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-10 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        back
      </button>

      <h1 className="text-[24px] font-extrabold text-white mb-1">Contact Admin</h1>
      <p className="text-[13px] text-gray-500 mb-8">Send a message to the admin team.</p>

      <div className="mb-8">
        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question..."
          rows={6}
          className="w-full bg-[#1c1c1e] border border-white/10 text-white text-[14px] rounded-2xl px-4 py-3.5 resize-none focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-[#a3e635] text-black text-[14px] font-extrabold py-4 rounded-2xl disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}
