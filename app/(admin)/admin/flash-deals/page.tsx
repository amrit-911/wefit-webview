"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { mockFlashDeals } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Zap, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span className="font-mono text-sm text-[#ff9f43]">{timeLeft}</span>;
}

export default function FlashDealsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flash Deals"
        description={`${mockFlashDeals.length} active flash deals`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ff9f43] hover:bg-[#e08c3a] text-white shadow-[0_0_10px_rgba(255,159,67,0.35)] gap-2"><Plus className="w-4 h-4" />Create Deal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Flash Deal</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Deal Name</Label><Input placeholder="e.g. Protein Combo Deal" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Original Price (₹)</Label><Input type="number" placeholder="3499" /></div>
                  <div className="space-y-1.5"><Label>Sale Price (₹)</Label><Input type="number" placeholder="2499" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Stock</Label><Input type="number" placeholder="20" /></div>
                  <div className="space-y-1.5"><Label>Ends At</Label><Input type="datetime-local" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#ff9f43] hover:bg-[#e08c3a] text-white shadow-[0_0_10px_rgba(255,159,67,0.35)]" onClick={() => setOpen(false)}>Create Deal</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockFlashDeals.map((deal, i) => (
          <motion.div key={deal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -2 }}>
            <Card className="overflow-hidden border-[#ff9f43]/20">
              <div className="h-1.5 bg-[#ff9f43] hover:bg-[#e08c3a] text-white shadow-[0_0_10px_rgba(255,159,67,0.35)]" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ff9f43]" />
                    <p className="font-semibold text-sm">{deal.name}</p>
                  </div>
                  <Badge className="bg-orange-500/20 text-[#ff9f43] border-[#ff9f43]/30 text-xs">{deal.discount} OFF</Badge>
                </div>
                <div className="flex gap-3 items-baseline mb-3">
                  <span className="text-2xl font-bold text-[#ff9f43]">₹{deal.salePrice.toLocaleString()}</span>
                  <span className="text-sm line-through text-muted-foreground">₹{deal.originalPrice.toLocaleString()}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{deal.sold} sold</span>
                    <span className="text-muted-foreground">{deal.stock - deal.sold} left</span>
                  </div>
                  <Progress value={(deal.sold / deal.stock) * 100} className="h-2" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                  <Timer className="w-3.5 h-3.5" />
                  Ends in: <Countdown endsAt={deal.endsAt} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
