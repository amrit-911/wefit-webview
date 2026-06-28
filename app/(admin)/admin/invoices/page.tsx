"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockInvoices } from "@/lib/mock-data";
import { PageHeader, StatusBadge } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Download } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = mockInvoices.filter((inv) => inv.member.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${mockInvoices.length} invoices generated`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Member</Label><Input placeholder="Member name or ID" /></div>
                <div className="space-y-1.5"><Label>Items</Label><Input placeholder="e.g. Premium Subscription, Whey Protein" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" placeholder="2999" /></div>
                  <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Create Invoice</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv, i) => (
              <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border">
                <TableCell className="font-mono text-xs text-muted-foreground">{inv.id}</TableCell>
                <TableCell className="font-medium">{inv.member}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{inv.items.join(", ")}</TableCell>
                <TableCell className="text-[#7367f0] font-semibold">₹{inv.amount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{inv.date}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{inv.dueDate}</TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-3.5 h-3.5" /></Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
