"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockCoupons } from "@/lib/mock-data";
import { PageHeader, StatusBadge } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Ticket, Copy } from "lucide-react";

export default function CouponsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = mockCoupons.filter((c) => c.code.includes(search.toUpperCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description={`${mockCoupons.length} discount coupons`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Create Coupon</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Coupon Code</Label><Input placeholder="e.g. SUMMER30" className="uppercase" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                        <SelectItem value="Fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Discount</Label><Input placeholder="e.g. 20 or 500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Min Order (₹)</Label><Input type="number" placeholder="999" /></div>
                  <div className="space-y-1.5"><Label>Expires</Label><Input type="date" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Create Coupon</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 uppercase" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((coupon, i) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -2 }}>
            <Card className="overflow-hidden border-dashed">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#ff9f43]" />
                    <code className="text-sm font-mono font-bold tracking-wider">{coupon.code}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="w-3 h-3" /></Button>
                  </div>
                  <StatusBadge status={coupon.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-[#ff9f43]">{coupon.discount}</span>
                  <Badge variant="outline">{coupon.type}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Min. Order</span><span className="text-foreground">₹{coupon.minOrder}</span></div>
                  <div className="flex justify-between"><span>Expires</span><span className="text-foreground">{coupon.expires}</span></div>
                  <div className="flex justify-between"><span>Used</span><span className="text-foreground">{coupon.used} times</span></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
