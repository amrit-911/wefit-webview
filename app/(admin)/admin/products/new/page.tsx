"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { addCmsItem, CMS_TYPES, type CmsType } from "@/lib/services/cms.service";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY = {
  title: "",
  type: "" as CmsType,
  pageLink: "NO-LINK",
  content: "",
  seoTitle: "",
  metaDescription: "",
  keywords: "",
};

export default function AddCmsPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.type) { toast.error("Type is required."); return; }
    if (!form.content.trim()) { toast.error("Content is required."); return; }
    setSaving(true);
    try {
      await addCmsItem({
        title: form.title,
        type: form.type,
        pageLink: form.pageLink || "NO-LINK",
        content: form.content,
        seoTitle: form.seoTitle || form.title,
        metaDescription: form.metaDescription || form.title,
        keywords: form.keywords || form.title,
      });
      toast.success("CMS page created!");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to save CMS page.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <Link href="/admin/products" className="text-[#7367f0] hover:underline">CMS</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Add CMS</span>
      </div>

      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6 space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Page Content */}
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-[#5e5873]">Page Content</h2>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">Type</Label>
            <Select value={form.type || undefined} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="border-gray-200 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CMS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">
              Page Link <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="NO-LINK"
              value={form.pageLink}
              onChange={(e) => set("pageLink", e.target.value)}
              className="border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">
              Add Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter page content…"
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="border-gray-200 text-sm min-h-[120px] resize-y"
            />
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* SEO Field */}
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-[#5e5873]">SEO Field</h2>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">Title</Label>
            <Input
              placeholder="SEO title"
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              className="border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">Meta Description</Label>
            <Input
              placeholder="Meta description"
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              className="border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">Keywords</Label>
            <Input
              placeholder="Keywords"
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              className="border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#5e5873]">Meta Image</Label>
            <div className="flex">
              <span className="flex-1 h-10 border border-r-0 border-gray-200 rounded-l-md px-3 flex items-center text-sm text-gray-400">
                No file chosen
              </span>
              <label className="h-10 px-4 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-r-md text-sm text-[#5e5873] cursor-pointer hover:bg-gray-200 transition-colors">
                Browse
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white px-6 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/products")}
            className="border-gray-200 text-[#6e6b7b]"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
