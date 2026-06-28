"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pencil, Trash2, Eye, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getCmsItems, deleteCmsItem, type CmsItem } from "@/lib/services/cms.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function CmsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCmsItems()
      .then(setItems)
      .catch(() => toast.error("Failed to load CMS pages"))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteCmsItem(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
      toast.success("CMS page deleted.");
    } catch {
      toast.error("Failed to delete CMS page.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">CMS</span>
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
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-5 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
            onClick={() => router.push("/admin/products/new")}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add CMS
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
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">
                  <span className="flex items-center gap-1">TITLE <span className="opacity-40 flex flex-col leading-none"><ChevronLeft className="w-2.5 h-2.5 rotate-90 -mb-0.5" /><ChevronLeft className="w-2.5 h-2.5 -rotate-90" /></span></span>
                </TableHead>
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">
                  <span className="flex items-center gap-1">PAGE LINK <span className="opacity-40 flex flex-col leading-none"><ChevronLeft className="w-2.5 h-2.5 rotate-90 -mb-0.5" /><ChevronLeft className="w-2.5 h-2.5 -rotate-90" /></span></span>
                </TableHead>
                <TableHead className="text-[11px] font-bold tracking-wider text-[#6e6b7b] uppercase py-3">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-sm text-gray-400">
                    No CMS pages yet. Click &quot;Add CMS&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <TableCell className="text-sm text-[#5e5873] py-4">{item.title}</TableCell>
                    <TableCell className="text-sm text-[#6e6b7b] py-4">{item.pageLink || "NO-LINK"}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => router.push(`/admin/products/${item.id}/edit`)} className="text-[#6e6b7b] hover:text-[#7367f0] transition-colors" title="Edit">
                          <Pencil className="w-[17px] h-[17px]" />
                        </button>
                        <button onClick={(e) => handleDelete(item.id, item.title, e)} className="text-[#6e6b7b] hover:text-[#ea5455] transition-colors" title="Delete">
                          <Trash2 className="w-[17px] h-[17px]" />
                        </button>
                        <button onClick={() => router.push(`/admin/products/${item.id}`)} className="text-[#6e6b7b] hover:text-[#7367f0] transition-colors" title="View">
                          <Eye className="w-[17px] h-[17px]" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Footer */}
        {!loading && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-[#6e6b7b]">
              Showing {items.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, items.length)} of {items.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-[#6e6b7b] hover:border-[#7367f0] hover:text-[#7367f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${n === page ? "bg-[#7367f0] text-white" : "border border-gray-200 text-[#6e6b7b] hover:border-[#7367f0] hover:text-[#7367f0]"}`}>
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
    </div>
  );
}
