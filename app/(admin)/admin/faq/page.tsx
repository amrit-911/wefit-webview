"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { FAQ, getFAQs, addFAQ, updateFAQ, deleteFAQ } from "@/lib/services/faqs.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"; // Assuming you have a switch component, if not I'll add one

const EMPTY_FORM: Omit<FAQ, "id" | "createdAt" | "updatedAt"> = {
  question: "",
  answer: "",
  sequence: 1,
  status: true,
};

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState("10");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFAQs();
      setFaqs(data);
    } catch (err) {
      toast.error("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateFAQ(editingId, formData);
        setFaqs((prev) =>
          prev.map((f) => (f.id === editingId ? { ...f, ...formData } : f)).sort((a,b) => a.sequence - b.sequence)
        );
        toast.success("FAQ updated successfully.");
      } else {
        const newId = await addFAQ(formData);
        setFaqs((prev) => [...prev, { id: newId, ...formData } as FAQ].sort((a,b) => a.sequence - b.sequence));
        toast.success("FAQ added successfully.");
      }
      handleClose();
    } catch (err) {
      toast.error(editingId ? "Failed to update FAQ." : "Failed to add FAQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, status: !currentStatus } : f)));
    try {
      await updateFAQ(id, { status: !currentStatus });
      toast.success(currentStatus ? "FAQ Disabled" : "FAQ Enabled");
    } catch (error) {
       // Revert on failure
       setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, status: currentStatus } : f)));
       toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await deleteFAQ(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("FAQ deleted.");
    } catch (err) {
      toast.error("Failed to delete FAQ.");
    }
  };
  
  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      sequence: faq.sequence,
      status: faq.status,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Section */}
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3] mb-2 px-1">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#7367f0] hover:underline font-medium cursor-pointer">Profile</span>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">FAQS</span>
      </div>

      <motion.div 
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
              <SelectTrigger className="w-[80px] h-10 border-gray-200 text-[#6e6b7b]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={(isOpen) => {
              if (!isOpen) handleClose();
              else setOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.35)] px-4">
                  Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden [&>button]:hidden">
                <DialogTitle className="sr-only">Add or Edit FAQ</DialogTitle>
                <div className="flex items-center justify-between px-6 py-5 bg-gray-50/50 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-[#5e5873]">
                    {editingId ? "Edit FAQ" : "Add FAQ"}
                  </h2>
                  <button onClick={handleClose} className="text-[#b9b9c3] hover:text-[#5e5873] transition-colors p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#5e5873]">Question</Label>
                    <Input 
                      placeholder="Enter question" 
                      value={formData.question} 
                      onChange={(e) => setFormData({...formData, question: e.target.value})}
                      className="h-10 border-gray-200"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#5e5873]">Answer</Label>
                    <Textarea 
                      placeholder="Enter answer" 
                      value={formData.answer} 
                      onChange={(e) => setFormData({...formData, answer: e.target.value})}
                      className="min-h-[120px] border-gray-200 resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#5e5873]">Sequence No.</Label>
                      <Input 
                        type="number"
                        placeholder="1" 
                        value={formData.sequence} 
                        onChange={(e) => setFormData({...formData, sequence: parseInt(e.target.value) || 0})}
                        className="h-10 border-gray-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="text-sm font-semibold text-[#5e5873]">Status</Label>
                       <div className="h-10 flex items-center">
                          <Switch 
                            checked={formData.status} 
                            onCheckedChange={(c) => setFormData({...formData, status: c})}
                          />
                          <span className="ml-3 text-sm text-[#6e6b7b]">
                            {formData.status ? "Active" : "Inactive"}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-0 flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="border-gray-200 text-[#6e6b7b] hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-md min-w-[100px]"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingId ? "Update" : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative w-full sm:w-[250px]">
            <Input 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-10 border-gray-200 text-sm w-full pl-3 pr-10" 
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-md">
          {loading ? (
             <div className="flex items-center justify-center h-64">
               <Loader2 className="w-8 h-8 animate-spin text-[#7367f0]" />
             </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow className="bg-[#f3f2f7] hover:bg-[#f3f2f7] border-b-0">
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12 w-16">NO</TableHead>
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12">QUESTION</TableHead>
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12">ANSWER</TableHead>
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12 w-28">STATUS</TableHead>
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12 w-32">SEQUENCE</TableHead>
                    <TableHead className="text-[12px] font-bold tracking-wider text-[#6e6b7b] uppercase h-12 w-28 text-right pr-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-[#b9b9c3]">
                        No FAQs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((faq, index) => (
                      <TableRow key={faq.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <TableCell className="py-4 text-[#7367f0] font-semibold text-[15px]">{index + 1}</TableCell>
                        <TableCell className="py-4 text-[#6e6b7b] text-sm max-w-[250px] truncate pr-4">
                          {faq.question}
                        </TableCell>
                        <TableCell className="py-4 text-[#6e6b7b] text-sm max-w-[300px] truncate pr-4">
                          {faq.answer}
                        </TableCell>
                        <TableCell className="py-4">
                           <Switch 
                             checked={faq.status} 
                             onCheckedChange={(c: boolean) => handleToggleStatus(faq.id, faq.status)} 
                             className="data-[state=checked]:bg-[#7367f0]"
                           />
                        </TableCell>
                        <TableCell className="py-4 text-[#6e6b7b] text-sm">{faq.sequence}</TableCell>
                        <TableCell className="py-4">
                           <div className="flex items-center justify-end gap-2 pr-2">
                             <button 
                               onClick={() => handleEdit(faq)}
                               className="p-1.5 text-[#6e6b7b] hover:text-[#7367f0] transition-colors"
                             >
                                <Edit className="w-[18px] h-[18px]" />
                             </button>
                             <button 
                               onClick={() => handleDelete(faq.id)}
                               className="p-1.5 text-[#6e6b7b] hover:text-[#ea5455] transition-colors"
                             >
                                <Trash2 className="w-[18px] h-[18px]" />
                             </button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
             </Table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-[#6e6b7b] text-sm">
              Showing 1 to {Math.min(filtered.length, parseInt(entriesPerPage))} of {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
               <button className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 cursor-not-allowed">
                 &lt;
               </button>
               <button className="w-8 h-8 rounded bg-[#7367f0] flex items-center justify-center text-white font-medium shadow-sm">
                 1
               </button>
               <button className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 cursor-not-allowed">
                 &gt;
               </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
