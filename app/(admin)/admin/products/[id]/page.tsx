"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { getCmsItems, type CmsItem } from "@/lib/services/cms.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ViewCmsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CmsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCmsItems().then((items) => {
      const found = items.find((c) => c.id === id);
      if (found) setItem(found);
      else { toast.error("CMS page not found."); router.push("/admin/products"); }
    }).catch(() => toast.error("Failed to load."))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <Link href="/admin/products" className="text-[#7367f0] hover:underline">CMS</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">{item.title}</span>
      </div>

      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6 space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#5e5873]">{item.title}</h1>
            <Badge className="mt-1 bg-[#7367f0]/10 text-[#7367f0] hover:bg-[#7367f0]/10 border-0 text-xs">
              {item.type}
            </Badge>
          </div>
          <Button
            onClick={() => router.push(`/admin/products/${id}/edit`)}
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-4 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
          >
            <Pencil className="w-4 h-4 mr-1.5" /> Edit
          </Button>
        </div>

        <hr className="border-gray-100" />

        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#b9b9c3] uppercase tracking-wider">Page Link</p>
          <p className="text-sm text-[#5e5873]">{item.pageLink || "NO-LINK"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#b9b9c3] uppercase tracking-wider">Content</p>
          <p className="text-sm text-[#6e6b7b] whitespace-pre-wrap leading-relaxed">{item.content}</p>
        </div>

        <hr className="border-gray-100" />

        <h2 className="text-base font-semibold text-[#5e5873]">SEO</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#b9b9c3] uppercase tracking-wider">SEO Title</p>
            <p className="text-sm text-[#5e5873]">{item.seoTitle || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#b9b9c3] uppercase tracking-wider">Meta Description</p>
            <p className="text-sm text-[#5e5873]">{item.metaDescription || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#b9b9c3] uppercase tracking-wider">Keywords</p>
            <p className="text-sm text-[#5e5873]">{item.keywords || "—"}</p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/products")}
            className="border-gray-200 text-[#6e6b7b]"
          >
            ← Back to CMS
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
