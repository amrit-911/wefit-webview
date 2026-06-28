"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Pencil, Trash2, Plus, Loader2, ChevronLeft, ChevronRight,
  ChevronsUpDown, X, Clock, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getSupplements, addSupplement, updateSupplement, deleteSupplement,
  type SupplementItem,
} from "@/lib/services/supplements.service";
import {
  getPendingLibraryRequests, approveLibraryRequest, rejectLibraryRequest,
  type LibraryRequest,
} from "@/lib/services/library-requests.service";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIES = [
  "Pre-Workout","Post-Workout","Protein","Vitamins & Minerals",
  "Fat Burner","BCAA / EAA","Creatine","Recovery","Other",
];
const SUPP_TYPES = [
  "Creatine","Whey Protein","Casein Protein","Plant Protein","Pre-Workout",
  "BCAA","EAA","Omega-3","Multivitamin","Fat Burner","Collagen","Other",
];
const TIMING_OPTS = ["Morning","Pre-Workout","Post-Workout","Evening","Bedtime","With Meals","Any Time"];
const FREQ_OPTS   = ["Once daily","Twice daily","Three times daily","Every other day","As directed"];

const EMPTY_FORM = {
  brand: "", name: "", description: "", comment: "", imageUrl: "",
  category: "", usageTiming: "", usageTimingNote: "",
  supplementType: "", dosage: "", frequency: "", benefits: "", precautions: "",
};

export default function SupplementsPage() {
  const [items, setItems]         = useState<SupplementItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);

  // Main CRUD modal
  const [open, setOpen]           = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Approvals panel
  const [pendingRequests, setPendingRequests] = useState<LibraryRequest[]>([]);
  const [loadingPending, setLoadingPending]   = useState(false);
  const [approvalsOpen, setApprovalsOpen]     = useState(false);
  const [approving, setApproving]             = useState<string | null>(null);
  const [rejecting, setRejecting]             = useState<string | null>(null);

  useEffect(() => {
    getSupplements()
      .then(setItems)
      .catch(() => toast.error("Failed to load supplements"))
      .finally(() => setLoading(false));
    // Load pending count
    setLoadingPending(true);
    getPendingLibraryRequests("supplement")
      .then(setPendingRequests)
      .catch(console.error)
      .finally(() => setLoadingPending(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated  = items.slice((page - 1) * pageSize, page * pageSize);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function openAdd() {
    setForm(EMPTY_FORM); setImageFile(null); setEditingId(null); setOpen(true);
  }

  function openEdit(item: SupplementItem) {
    setForm({
      brand: item.brand, name: item.name, description: item.description,
      comment: item.comment, imageUrl: item.imageUrl ?? "",
      category: item.category ?? "", usageTiming: item.usageTiming ?? "",
      usageTimingNote: item.usageTimingNote ?? "",
      supplementType: item.supplementType ?? "", dosage: item.dosage ?? "",
      frequency: item.frequency ?? "", benefits: item.benefits ?? "",
      precautions: item.precautions ?? "",
    });
    setImageFile(null); setEditingId(item.id); setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Supplement Name is required."); return; }
    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile && storage) {
        const path = `supplements/${Date.now()}_${imageFile.name}`;
        const snap = await uploadBytes(storageRef(storage, path), imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }
      const payload: Omit<SupplementItem, "id" | "createdAt" | "updatedAt"> = {
        brand: form.brand.trim(), name: form.name.trim(),
        description: form.description.trim(), comment: form.comment.trim(),
        imageUrl, category: form.category, usageTiming: form.usageTiming,
        usageTimingNote: form.usageTimingNote.trim(),
        supplementType: form.supplementType, dosage: form.dosage.trim(),
        frequency: form.frequency, benefits: form.benefits.trim(),
        precautions: form.precautions.trim(),
      };
      if (editingId) {
        await updateSupplement(editingId, payload);
        setItems((prev) => prev.map((s) => s.id === editingId ? { ...s, ...payload } : s));
        toast.success("Supplement updated!");
      } else {
        const newId = await addSupplement(payload);
        setItems((prev) => [{ id: newId, ...payload }, ...prev]);
        toast.success("Supplement added!");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save supplement.");
    } finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteSupplement(deleteId);
      setItems((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Supplement deleted."); setDeleteId(null);
    } catch { toast.error("Failed to delete supplement."); }
    finally { setIsDeleting(false); }
  }

  // ── Approval handlers ──────────────────────────────────────────────────────
  async function handleApprove(req: LibraryRequest) {
    if (!req.id) return;
    setApproving(req.id);
    try {
      await approveLibraryRequest(req);
      const newItem = await getSupplements();
      setItems(newItem);
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`"${req.name}" approved and added to supplements!`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve.");
    } finally { setApproving(null); }
  }

  async function handleReject(req: LibraryRequest) {
    if (!req.id) return;
    setRejecting(req.id);
    try {
      await rejectLibraryRequest(req.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`"${req.name}" rejected.`);
    } catch { toast.error("Failed to reject."); }
    finally { setRejecting(null); }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Supplement List</span>
      </div>

      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5 pb-8"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      >
        {/* Controls */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-20 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Pending approvals badge */}
            <Button
              onClick={() => setApprovalsOpen(true)}
              variant="outline"
              className="h-9 px-4 text-sm border-[#ff9f43] text-[#ff9f43] hover:bg-[#ff9f43]/10 gap-2 relative"
            >
              <Clock className="w-4 h-4" />
              Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="ml-1 bg-[#ff9f43] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
            <Button
              onClick={openAdd}
              className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-5 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Supplement
            </Button>
          </div>
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
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">
                  <span className="flex items-center gap-1">SUPPLEMENT NAME <ChevronsUpDown className="w-3 h-3 text-[#b9b9c3]" /></span>
                </TableHead>
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">BRAND</TableHead>
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">CATEGORY</TableHead>
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-sm text-gray-400">
                    No supplements yet. Click &quot;Add Supplement&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : paginated.map((item, i) => (
                <motion.tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                >
                  <TableCell className="text-sm text-[#5e5873] py-4">{item.name}</TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] py-4">{item.brand || "—"}</TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] py-4">
                    {item.category ? (
                      <span className="bg-[#7367f0]/10 text-[#7367f0] text-xs font-semibold px-2 py-0.5 rounded">{item.category}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => openEdit(item)} className="text-[#6e6b7b] hover:text-[#7367f0] transition-colors" title="Edit">
                        <Pencil className="w-[17px] h-[17px]" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="text-[#6e6b7b] hover:text-[#ea5455] transition-colors" title="Delete">
                        <Trash2 className="w-[17px] h-[17px]" />
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
              Showing {items.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, items.length)} of {items.length}
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

      {/* ── Pending Approvals Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {approvalsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[80vh] flex flex-col"
            >
              <button onClick={() => setApprovalsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-[#5e5873] mb-1">Pending Supplement Approvals</h2>
              <p className="text-sm text-[#b9b9c3] mb-5">Review submissions from trainers. Approve to add to the live library.</p>

              <div className="overflow-y-auto flex-1 space-y-4">
                {loadingPending && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
                  </div>
                )}
                {!loadingPending && pendingRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#b9b9c3]">
                    <Clock className="w-10 h-10" />
                    <p className="text-sm font-medium">No pending supplement approvals</p>
                  </div>
                )}
                {!loadingPending && pendingRequests.map((req) => (
                  <div key={req.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-[#5e5873]">{req.name}</p>
                          {req.category && (
                            <span className="text-[10px] bg-[#7367f0]/10 text-[#7367f0] font-semibold px-2 py-0.5 rounded">{req.category}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#b9b9c3] mb-2">By <span className="font-semibold text-[#6e6b7b]">{req.trainerName}</span></p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#6e6b7b]">
                          {req.description && <p><span className="font-semibold">Description:</span> {req.description}</p>}
                          {req.supplementType && <p><span className="font-semibold">Type:</span> {req.supplementType}</p>}
                          {req.dosage && <p><span className="font-semibold">Dosage:</span> {req.dosage}</p>}
                          {req.frequency && <p><span className="font-semibold">Frequency:</span> {req.frequency}</p>}
                          {req.usageTiming && <p><span className="font-semibold">Timing:</span> {req.usageTiming}</p>}
                          {req.brand && <p><span className="font-semibold">Brand:</span> {req.brand}</p>}
                          {req.benefits && <p className="col-span-2"><span className="font-semibold">Benefits:</span> {req.benefits}</p>}
                          {req.precautions && <p className="col-span-2"><span className="font-semibold">Precautions:</span> {req.precautions}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-[#28c76f] hover:bg-[#24b263] text-white gap-1.5 h-8 px-3 text-xs"
                          onClick={() => handleApprove(req)}
                          disabled={approving === req.id}
                        >
                          {approving === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#ea5455] text-[#ea5455] hover:bg-[#ea5455] hover:text-white gap-1.5 h-8 px-3 text-xs"
                          onClick={() => handleReject(req)}
                          disabled={rejecting === req.id}
                        >
                          {rejecting === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-[#5e5873] mb-6">
                {editingId ? "Edit Supplement" : "Add Supplement"}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Supplement Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Whey Protein Isolate" value={form.name} onChange={(e) => set("name", e.target.value)} className="border-gray-200 text-sm" />
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Brand</Label>
                  <Input placeholder="e.g. Optimum Nutrition" value={form.brand} onChange={(e) => set("brand", e.target.value)} className="border-gray-200 text-sm" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Description</Label>
                  <Textarea placeholder="Brief description..." value={form.description} onChange={(e) => set("description", e.target.value)} className="border-gray-200 text-sm min-h-[80px] resize-y" />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Category</Label>
                  <Select value={form.category || undefined} onValueChange={(val) => set("category", val)}>
                    <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Usage Timing */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Usage Timing</Label>
                  <Select value={form.usageTiming || undefined} onValueChange={(val) => set("usageTiming", val)}>
                    <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select timing" /></SelectTrigger>
                    <SelectContent>
                      {TIMING_OPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Note for usage timing (optional)" value={form.usageTimingNote} onChange={(e) => set("usageTimingNote", e.target.value)} className="border-gray-200 text-sm min-h-[60px] resize-y mt-2" />
                </div>

                {/* Image */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#5e5873]">Supplement Image</Label>
                  <div className="flex">
                    <span className="flex-1 h-10 border border-r-0 border-gray-200 rounded-l-md px-3 flex items-center text-sm text-gray-400 truncate">
                      {imageFile ? imageFile.name : form.imageUrl ? "Image already uploaded" : "Image Drop here"}
                    </span>
                    <label className="h-10 px-4 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-r-md text-sm text-[#5e5873] cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Browse
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  {(imageFile || form.imageUrl) && (
                    <img src={imageFile ? URL.createObjectURL(imageFile) : form.imageUrl} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-200" />
                  )}
                </div>
              </div>

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

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
            >
              <h2 className="text-base font-bold text-[#5e5873] mb-2">Delete Supplement</h2>
              <p className="text-sm text-[#6e6b7b] mb-6">
                Are you sure you want to delete &quot;{items.find((s) => s.id === deleteId)?.name}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDelete} disabled={isDeleting} className="bg-[#ea5455] hover:bg-[#d94f50] text-white px-5">
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete
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
