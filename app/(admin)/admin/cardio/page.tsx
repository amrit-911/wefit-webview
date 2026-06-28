"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockCardio } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Flame, Clock, Dumbbell } from "lucide-react";

const intensityColors: Record<string, string> = {
  Moderate: "bg-blue-500/20 text-blue-400",
  High: "bg-orange-500/20 text-[#ff9f43]",
  "Very High": "bg-red-500/20 text-red-400",
  "Low-Impact": "bg-emerald-500/20 text-emerald-400",
};

export default function CardioPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = mockCardio.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cardio"
        description={`${mockCardio.length} cardio exercises available`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Add Cardio</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Cardio Exercise</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Name</Label><Input placeholder="e.g. Treadmill Run" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Type</Label><Input placeholder="e.g. Running" /></div>
                  <div className="space-y-1.5"><Label>Duration</Label><Input placeholder="e.g. 30 min" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Calories</Label><Input type="number" placeholder="280" /></div>
                  <div className="space-y-1.5"><Label>Equipment</Label><Input placeholder="e.g. Treadmill" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Add Cardio</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search cardio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -2 }}>
            <Card className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-400" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{c.type}</Badge>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${intensityColors[c.intensity]}`}>{c.intensity}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-3">
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-cyan-400" />{c.duration}</div>
                  <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-[#ff9f43]" />{c.calories} cal</div>
                  <div className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-[#7367f0]" style={{fontSize:12}}/></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{c.equipment}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
