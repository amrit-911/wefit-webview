"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, StatusBadge } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Tag, Loader2, Trash2 } from "lucide-react";
import {
  getCategories, addCategory, deleteCategory, updateCategory, type Category
} from "@/lib/services/categories.service";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Category modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!name.trim()) { toast.error("Category name is required."); return; }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<Category, "id" | "createdAt"> = {
        name: name.trim(),
        products: 0,
        status: "Active",
      };
      const id = await addCategory(payload);
      setCategories([{ id, ...payload }, ...categories]);
      toast.success("Category added successfully!");
      setOpen(false);
      setName("");
    } catch {
      toast.error("Failed to add category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Category deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description={`${categories.length} product categories`}
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setName(""); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Add Category</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Category Name</Label>
                  <Input 
                    placeholder="e.g. Equipment" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button disabled={isSubmitting} className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={handleAdd}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Category"}
                  </Button>
                  <Button disabled={isSubmitting} variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-[#7367f0]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-[#5e5873]">No categories found</h3>
          <p className="text-gray-400 mt-1 mb-4">Click "Add Category" to create your first category.</p>
          <Button onClick={() => setOpen(true)} className="bg-[#7367f0] hover:bg-[#6355e0] text-white">Add Category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -2 }}>
              <Card className="text-center hover:border-[#7367f0]/40 transition-colors relative group">
                <CardContent className="p-6">
                  <button 
                    onClick={() => setDeleteId(cat.id)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7367f0]/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <Tag className="w-6 h-6 text-[#7367f0]" />
                  </div>
                  <p className="font-semibold text-sm">{cat.name}</p>
                  <p className="text-2xl font-bold text-[#7367f0] mt-1">{cat.products}</p>
                  <p className="text-xs text-muted-foreground">products</p>
                  <div className="mt-2"><StatusBadge status={cat.status} /></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm text-center p-6">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-lg mb-2">Delete Category?</DialogTitle>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this category? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button disabled={isDeleting} onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
            <Button disabled={isDeleting} variant="outline" onClick={() => setDeleteId(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
