"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCmsItems, type CmsItem } from "@/lib/services/cms.service";

export default function TrainerCmsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<CmsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCmsItems()
      .then((items) => {
        const found = items.find((c) => c.id === id) ?? null;
        setItem(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 text-[12px] font-medium mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        back
      </button>

      {loading ? (
        <div className="space-y-3 mt-4">
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
        </div>
      ) : !item ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <p className="text-gray-400 text-[14px]">Content not found.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-[22px] font-extrabold text-white mb-5">{item.title}</h1>
          <div
            className="text-[13px] text-gray-300 leading-relaxed space-y-3 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </motion.div>
      )}
    </div>
  );
}
