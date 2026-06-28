"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Pencil, Trash2, Plus, Loader2, ChevronLeft, ChevronRight,
  ChevronsUpDown, X, Play, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getExercises, addExercise, updateExercise, deleteExercise, type Exercise,
} from "@/lib/services/exercises.service";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const CATEGORIES = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Push", "Pull", "Leg", "Other"];

const EMPTY_FORM = {
  name: "", category: "", muscle: "", equipment: "",
  description: "", videoUrl: "", thumbnailUrl: "",
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getExercises()
      .then(setExercises)
      .catch(() => toast.error("Failed to load exercises"))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(exercises.length / pageSize));
  const paginated = exercises.slice((page - 1) * pageSize, page * pageSize);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function openAdd() {
    setForm(EMPTY_FORM);
    setVideoFile(null);
    setThumbFile(null);
    setUploadProgress(null);
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      category: ex.category,
      muscle: ex.muscle ?? "",
      equipment: ex.equipment ?? "",
      description: ex.description ?? "",
      videoUrl: ex.videoUrl ?? "",
      thumbnailUrl: ex.thumbnailUrl ?? "",
    });
    setVideoFile(null);
    setThumbFile(null);
    setUploadProgress(null);
    setEditingId(ex.id);
    setOpen(true);
  }

  // Upload a file to Firebase Storage with progress tracking
  async function uploadFile(file: File, path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!storage) return reject(new Error("Storage not initialized"));
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);
      task.on(
        "state_changed",
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Exercise name is required."); return; }
    if (!form.category) { toast.error("Category is required."); return; }
    
    // Validate video or link is provided 
    if (!videoFile && !form.videoUrl.trim()) {
      toast.error("Exercise video file or link is required.");
      return;
    }
    
    // Validate thumbnail is provided
    if (!thumbFile && !form.thumbnailUrl.trim()) {
      toast.error("Thumbnail image is required.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(null);
    try {
      let videoUrl = form.videoUrl;
      let thumbnailUrl = form.thumbnailUrl;

      if (videoFile) {
        toast.info("Uploading video…");
        videoUrl = await uploadFile(videoFile, `exercises/videos/${Date.now()}_${videoFile.name}`);
      }
      if (thumbFile) {
        thumbnailUrl = await uploadFile(thumbFile, `exercises/thumbnails/${Date.now()}_${thumbFile.name}`);
      }
      setUploadProgress(null);

      const payload: Omit<Exercise, "id" | "createdAt" | "updatedAt"> = {
        name: form.name.trim(),
        category: form.category,
        muscle: form.muscle.trim(),
        equipment: form.equipment.trim(),
        description: form.description.trim(),
        videoUrl,
        thumbnailUrl,
      };

      if (editingId) {
        await updateExercise(editingId, payload);
        setExercises((prev) => prev.map((e) => e.id === editingId ? { ...e, ...payload } : e));
        toast.success("Exercise updated!");
      } else {
        const id = await addExercise(payload);
        setExercises((prev) => [{ id, ...payload }, ...prev]);
        toast.success("Exercise added!");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save exercise.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteExercise(deleteId);
      setExercises((prev) => prev.filter((e) => e.id !== deleteId));
      toast.success("Exercise deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete exercise.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Workout Video Management</span>
      </div>

      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={openAdd} className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-5 shadow-[0_3px_10px_rgba(115,103,240,0.35)]">
            <Plus className="w-4 h-4 mr-1.5" /> Add Exercise
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                {["Exercise Name", "Category", "Video", "Action"].map((h) => (
                  <TableHead key={h} className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">
                    <span className="flex items-center gap-1">
                      {h}
                      {!["Video", "Action"].includes(h) && <ChevronsUpDown className="w-3 h-3 text-[#b9b9c3]" />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    No exercises yet. Click &quot;Add Exercise&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : paginated.map((ex, i) => (
                <motion.tr
                  key={ex.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell className="py-4">
                    <p className="text-sm font-medium text-[#5e5873]">{ex.name}</p>
                    {ex.muscle && <p className="text-xs text-gray-400 mt-0.5">{ex.muscle}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] py-4">{ex.category}</TableCell>
                  <TableCell className="py-4">
                    {ex.videoUrl ? (
                      <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#7367f0] text-xs hover:underline"
                        onClick={(e) => e.stopPropagation()}>
                        <Play className="w-3.5 h-3.5" /> Play
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">No video</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => openEdit(ex)} className="text-[#6e6b7b] hover:text-[#7367f0] transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(ex.id)} className="text-[#6e6b7b] hover:text-[#ea5455] transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-[#6e6b7b]">
              Showing {exercises.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, exercises.length)} of {exercises.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-[#6e6b7b] hover:border-[#7367f0] hover:text-[#7367f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors", n === page ? "bg-[#7367f0] text-white" : "border border-gray-200 text-[#6e6b7b] hover:border-[#7367f0] hover:text-[#7367f0]")}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-[#6e6b7b] hover:border-[#7367f0] hover:text-[#7367f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-[#5e5873] mb-6">
                {editingId ? "Edit Exercise" : "Add Exercise"}
              </h2>

              <div className="space-y-5">
                {/* Row 1: Name + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#5e5873]">Exercise Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g. Bench Press" value={form.name} onChange={(e) => set("name", e.target.value)} className="border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#5e5873]">Category <span className="text-red-500">*</span></Label>
                    <Select value={form.category || undefined} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger className="border-gray-200 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Muscle + Equipment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#5e5873]">Muscle Group</Label>
                    <Input placeholder="e.g. Chest, Triceps" value={form.muscle} onChange={(e) => set("muscle", e.target.value)} className="border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#5e5873]">Equipment</Label>
                    <Input placeholder="e.g. Barbell" value={form.equipment} onChange={(e) => set("equipment", e.target.value)} className="border-gray-200 text-sm" />
                  </div>
                </div>

                {/* Removed Difficulty, Sets, Reps row */}

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Description</Label>
                  <Textarea placeholder="Exercise instructions or notes…" value={form.description} onChange={(e) => set("description", e.target.value)} className="border-gray-200 text-sm min-h-20 resize-y" />
                </div>

                {/* Video Upload */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Exercise Video <span className="text-red-500">*</span></Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-[#7367f0]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#7367f0]/10 flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-[#7367f0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {videoFile ? (
                          <p className="text-sm font-medium text-[#5e5873] truncate">{videoFile.name}</p>
                        ) : form.videoUrl ? (
                          <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7367f0] hover:underline truncate block">
                            Current video ↗
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400">Upload MP4, MOV, AVI · max 500 MB</p>
                        )}
                        {uploadProgress !== null && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#7367f0] transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                      <label className="shrink-0 h-9 px-4 flex items-center justify-center bg-[#7367f0]/10 hover:bg-[#7367f0]/20 text-[#7367f0] text-sm font-medium rounded-lg cursor-pointer transition-colors">
                        Browse
                        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                  {/* Or paste a URL */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">or paste URL</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoFile ? "" : form.videoUrl}
                    onChange={(e) => { setVideoFile(null); set("videoUrl", e.target.value); }}
                    disabled={!!videoFile}
                    className="border-gray-200 text-sm"
                  />
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Thumbnail Image <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 h-10 border border-r-0 border-gray-200 rounded-l-md px-3 flex items-center text-sm text-gray-400 truncate">
                      {thumbFile ? thumbFile.name : form.thumbnailUrl ? "Thumbnail uploaded" : "No file chosen"}
                    </span>
                    <label className="h-10 px-4 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-r-md text-sm text-[#5e5873] cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Browse
                      <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  {(thumbFile || form.thumbnailUrl) && (
                    <img
                      src={thumbFile ? URL.createObjectURL(thumbFile) : form.thumbnailUrl}
                      alt="thumbnail"
                      className="mt-2 h-20 w-32 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#7367f0] hover:bg-[#6355e0] text-white px-6 shadow-[0_3px_10px_rgba(115,103,240,0.35)]">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? "Update" : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-200 text-[#6e6b7b]">Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
            >
              <h2 className="text-base font-bold text-[#5e5873] mb-2">Delete Exercise</h2>
              <p className="text-sm text-[#6e6b7b] mb-6">
                Are you sure you want to delete &quot;{exercises.find((e) => e.id === deleteId)?.name}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDelete} disabled={isDeleting} className="bg-[#ea5455] hover:bg-[#d94f50] text-white px-5">
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setDeleteId(null)} className="border-gray-200 text-[#6e6b7b]">Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
