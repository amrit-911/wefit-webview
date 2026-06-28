"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  getCmsItems,
  updateCmsItem,
  CMS_TYPES,
  type CmsItem,
  type CmsType,
} from "@/lib/services/cms.service";
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

export default function EditCmsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<Omit<CmsItem, "id" | "createdAt" | "updatedAt">>({
    title: "",
    type: "Other",
    pageLink: "NO-LINK",
    content: "",
    seoTitle: "",
    metaDescription: "",
    keywords: "",
    metaImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    getCmsItems().then((items) => {
      const found = items.find((c) => c.id === id);
      if (found) {
        setForm({
          title: found.title,
          type: found.type,
          pageLink: found.pageLink || "NO-LINK",
          content: found.content,
          seoTitle: found.seoTitle || found.title,
          metaDescription: found.metaDescription || found.title,
          keywords: found.keywords || found.title,
          metaImageUrl: found.metaImageUrl || "",
        });
      } else {
        toast.error("CMS page not found.");
        router.push("/admin/products");
      }
    }).catch(() => {
      toast.error("Failed to load CMS page.");
    }).finally(() => setLoading(false));
  }, [id, router]);

  const handleUpdate = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.content.trim()) { toast.error("Content is required."); return; }
    setSaving(true);
    try {
      await updateCmsItem(id, {
        title: form.title,
        type: form.type,
        pageLink: form.pageLink || "NO-LINK",
        content: form.content,
        seoTitle: form.seoTitle || form.title,
        metaDescription: form.metaDescription || form.title,
        keywords: form.keywords || form.title,
      });
      toast.success("CMS page updated!");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to update CMS page.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <Link href="/admin/products" className="text-[#7367f0] hover:underline">CMS</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Edit CMS</span>
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
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
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
                {form.metaImageUrl ? form.metaImageUrl : "No file chosen"}
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
            onClick={handleUpdate}
            disabled={saving}
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white px-6 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Updating…" : "Update"}
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
