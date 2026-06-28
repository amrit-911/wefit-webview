"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFAQs, type FAQ } from "@/lib/services/faqs.service";

export default function UserFaqPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getFAQs()
      .then((data) => setFaqs(data.filter((f) => f.status)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 text-[12px] font-medium mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        back
      </button>

      <h1 className="text-[22px] font-extrabold text-white mb-7">FAQs</h1>

      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c1e] rounded-2xl overflow-hidden"
        >
          {[1, 2, 3].map((i) => (
            <div key={i}>
              {i > 1 && <div className="h-px bg-white/5 mx-4" />}
              <div className="w-full flex items-center justify-between px-5 py-4">
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </motion.div>
      ) : faqs.length === 0 ? (
        <p className="text-gray-500 text-[13px] text-center pt-10">No FAQs available</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c1e] rounded-2xl overflow-hidden"
        >
          {faqs.map((faq, i) => (
            <div key={faq.id}>
              {i > 0 && <div className="h-px bg-white/5 mx-4" />}
              <button
                onClick={() => setOpenId((id) => (id === faq.id ? null : faq.id))}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-[13px] font-semibold text-white pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openId === faq.id ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openId === faq.id && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-[12px] text-gray-400 leading-relaxed px-5 pb-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
