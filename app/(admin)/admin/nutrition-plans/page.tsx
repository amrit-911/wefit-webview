"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getNutritionItems, addNutritionItem, updateNutritionItem, deleteNutritionItem,
  type NutritionItem,
} from "@/lib/services/nutrition.service";
import {
  getPendingLibraryRequests, approveLibraryRequest, rejectLibraryRequest,
  type LibraryRequest,
} from "@/lib/services/library-requests.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsUpDown,
  X, Loader2, Clock, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MEASUREMENTS = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece", "serving"];

const EMPTY_FORM = {
  name: "", description: "", quantity: "", measurement: "g",
  calories: "", carbs: "", protein: "", fats: "",
  ingredients: "", preparationInstructions: "",
};

export default function NutritionPlansPage() {
  const [allItems, setAllItems]           = useState<NutritionItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(10);

  const [open, setOpen]                   = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  // Approvals
  const [pendingRequests, setPendingRequests] = useState<LibraryRequest[]>([]);
  const [loadingPending, setLoadingPending]   = useState(false);
  const [approvalsOpen, setApprovalsOpen]     = useState(false);
  const [approving, setApproving]             = useState<string | null>(null);
  const [rejecting, setRejecting]             = useState<string | null>(null);

  useEffect(() => {
    getNutritionItems()
      .then(setAllItems)
      .catch(() => toast.error("Failed to load nutrition items"))
      .finally(() => setLoading(false));
    setLoadingPending(true);
    getPendingLibraryRequests("nutrition")
      .then(setPendingRequests)
      .catch(console.error)
      .finally(() => setLoadingPending(false));
  }, []);

  const filtered     = allItems.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalItems   = filtered.length;
  const totalPages   = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex   = (currentPage - 1) * itemsPerPage;
  const endIndex     = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filtered.slice(startIndex, endIndex);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (item: NutritionItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name, description: item.description ?? "",
      quantity: String(item.quantity), measurement: item.measurement || "g",
      calories: item.calories, carbs: item.carbs, protein: item.protein, fats: item.fats,
      ingredients: item.ingredients ?? "", preparationInstructions: item.preparationInstructions ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.calories.trim()) { toast.error("Calories is required."); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(), description: form.description.trim(),
        quantity: Number(form.quantity) || 0, measurement: form.measurement,
        calories: form.calories, carbs: form.carbs, protein: form.protein, fats: form.fats,
        ingredients: form.ingredients.trim(),
        preparationInstructions: form.preparationInstructions.trim(),
      };
      if (editingId) {
        await updateNutritionItem(editingId, payload);
        setAllItems((prev) => prev.map((item) => item.id === editingId ? { ...item, ...payload } : item));
        toast.success("Nutrition item updated!");
      } else {
        const newId = await addNutritionItem(payload);
        setAllItems((prev) => [{ id: newId, ...payload }, ...prev]);
        toast.success("Nutrition item added!");
      }
      setOpen(false);
    } catch { toast.error("Failed to save nutrition item."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteNutritionItem(deleteId);
      setAllItems((prev) => prev.filter((item) => item.id !== deleteId));
      toast.success("Nutrition item deleted."); setDeleteId(null);
    } catch { toast.error("Failed to delete item."); }
    finally { setIsDeleting(false); }
  };

  // Approval handlers
  async function handleApprove(req: LibraryRequest) {
    if (!req.id) return;
    setApproving(req.id);
    try {
      await approveLibraryRequest(req);
      const fresh = await getNutritionItems();
      setAllItems(fresh);
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`"${req.name}" approved and added to nutrition items!`);
    } catch (e: any) { toast.error(e?.message ?? "Failed to approve."); }
    finally { setApproving(null); }
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
              <h2 className="text-lg font-bold text-[#5e5873] mb-1">Pending Nutrition Approvals</h2>
              <p className="text-sm text-[#b9b9c3] mb-5">Review trainer-submitted nutrition items. Approve to publish.</p>

              <div className="overflow-y-auto flex-1 space-y-4">
                {loadingPending && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
                  </div>
                )}
                {!loadingPending && pendingRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#b9b9c3]">
                    <Clock className="w-10 h-10" />
                    <p className="text-sm font-medium">No pending nutrition approvals</p>
                  </div>
                )}
                {!loadingPending && pendingRequests.map((req) => (
                  <div key={req.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#5e5873] mb-1">{req.name}</p>
                        <p className="text-xs text-[#b9b9c3] mb-2">By <span className="font-semibold text-[#6e6b7b]">{req.trainerName}</span></p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#6e6b7b]">
                          {req.description && <p className="col-span-2"><span className="font-semibold">Description:</span> {req.description}</p>}
                          {req.calories && <p><span className="font-semibold">Calories:</span> {req.calories} kcal</p>}
                          {req.protein && <p><span className="font-semibold">Protein:</span> {req.protein}g</p>}
                          {req.carbs && <p><span className="font-semibold">Carbs:</span> {req.carbs}g</p>}
                          {req.fats && <p><span className="font-semibold">Fats:</span> {req.fats}g</p>}
                          {req.ingredients && <p className="col-span-2"><span className="font-semibold">Ingredients:</span> {req.ingredients}</p>}
                          {req.preparationInstructions && <p className="col-span-2"><span className="font-semibold">Preparation:</span> {req.preparationInstructions}</p>}
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

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); }}>
        <DialogContent className="max-w-lg p-0 gap-0 [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{editingId ? "Edit" : "Add"} Nutrition Item</DialogTitle>
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#b9b9c3] hover:text-[#5e5873] z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="p-8">
            <h2 className="text-xl font-bold text-[#5e5873] text-center mb-1">
              {editingId ? "Edit Nutrition Item" : "Add Nutrition Item"}
            </h2>
            <p className="text-sm text-[#b9b9c3] text-center mb-6">
              {editingId ? "Update the nutrition details below." : "Fill in the nutrition details to add a new item."}
            </p>
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#5e5873]">Food Name *</Label>
                <Input placeholder="e.g. Chicken Breast" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 border-gray-200 text-sm" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#5e5873]">Description</Label>
                <Textarea placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-gray-200 text-sm min-h-[70px] resize-y" />
              </div>

              {/* Quantity + Measurement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Quantity</Label>
                  <Input type="number" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="h-10 border-gray-200 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Measurement</Label>
                  <Select value={form.measurement} onValueChange={(v) => setForm({ ...form, measurement: v })}>
                    <SelectTrigger className="h-10 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{MEASUREMENTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Calories *</Label>
                  <Input placeholder="165" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="h-10 border-gray-200 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Carbs (g)</Label>
                  <Input placeholder="0" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="h-10 border-gray-200 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Protein (g)</Label>
                  <Input placeholder="31" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="h-10 border-gray-200 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Fats (g)</Label>
                  <Input placeholder="3.6" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value })} className="h-10 border-gray-200 text-sm" />
                </div>
              </div>


              {/* Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-10 px-8 shadow-[0_3px_10px_rgba(115,103,240,0.35)]" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
                </Button>
                <Button className="bg-[#82868b] hover:bg-[#6e6b7b] text-white text-sm h-10 px-8" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm p-0 gap-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Confirm Delete</DialogTitle>
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#ea5455]/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#ea5455]" />
            </div>
            <h2 className="text-lg font-bold text-[#5e5873] mb-2">Delete Item?</h2>
            <p className="text-sm text-[#b9b9c3] mb-6">This will permanently delete this nutrition item. This action cannot be undone.</p>
            <div className="flex items-center justify-center gap-3">
              <Button className="bg-[#ea5455] hover:bg-[#d03f40] text-white h-9 px-6" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
              <Button variant="outline" className="h-9 px-6 border-gray-200 text-[#6e6b7b]" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Table card ───────────────────────────────────────────────────────── */}
      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      >
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[80px] h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-[#6e6b7b]">entries</span>
            <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-4 shadow-[0_3px_10px_rgba(115,103,240,0.35)] ml-2" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Item
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Pending approvals badge */}
            <Button
              onClick={() => setApprovalsOpen(true)}
              variant="outline"
              className="h-9 px-4 text-sm border-[#ff9f43] text-[#ff9f43] hover:bg-[#ff9f43]/10 gap-2"
            >
              <Clock className="w-4 h-4" />
              Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="ml-1 bg-[#ff9f43] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
            <input
              type="text" placeholder="Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] transition-shadow placeholder:text-[#b9b9c3]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-t-md">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-100 uppercase">
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] py-4 pl-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">NUTRITION NAME <ChevronsUpDown className="w-3 h-3 text-[#b9b9c3]" /></div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">QUANTITY</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">MEASUREMENT</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">CALORIES</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">CARBS</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">PROTEIN</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] whitespace-nowrap">FATS</TableHead>
                  <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] text-right pr-4 whitespace-nowrap">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, i) => (
                    <motion.tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    >
                      <TableCell className="text-sm font-medium text-[#5e5873] py-4 pl-4">{item.name}</TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">
                        <span className="bg-[#7367f0]/10 text-[#7367f0] text-xs font-semibold px-2 py-0.5 rounded">{item.measurement || "g"}</span>
                      </TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">{item.calories} kcal</TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">{item.carbs}g</TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">{item.protein}g</TableCell>
                      <TableCell className="text-sm text-[#6e6b7b] py-4">{item.fats}g</TableCell>
                      <TableCell className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded text-[#6e6b7b] hover:text-[#7367f0] hover:bg-[#7367f0]/5 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded text-[#6e6b7b] hover:text-[#ea5455] hover:bg-[#ea5455]/5 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-[#6e6b7b]">
                      {search ? "No matching records found." : "No nutrition items yet. Click \"Add Item\" to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm text-[#b9b9c3]">
          <span>Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-[#b9b9c3] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setCurrentPage(n)} className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                  currentPage === n ? "bg-[#7367f0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.35)]" : "bg-gray-50 text-[#6e6b7b] hover:bg-gray-100"
                )}>{n}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-[#b9b9c3] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
