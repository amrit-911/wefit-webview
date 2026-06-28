"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockMealPlans } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MealPlansPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = mockMealPlans.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.goal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Plans"
        description={`${mockMealPlans.length} meal plans configured`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Add Meal Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Meal Plan</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Plan Name</Label><Input placeholder="e.g. Weight Loss Plan" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Total Calories</Label><Input type="number" placeholder="1500" /></div>
                  <div className="space-y-1.5"><Label>Meals/Day</Label><Input type="number" placeholder="5" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Protein</Label><Input placeholder="120g" /></div>
                  <div className="space-y-1.5"><Label>Carbs</Label><Input placeholder="150g" /></div>
                  <div className="space-y-1.5"><Label>Fats</Label><Input placeholder="50g" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Save Plan</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search meal plans..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{plan.goal}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#7367f0]">{plan.calories}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {[
                    { label: "Protein", value: plan.protein, color: "bg-blue-500", max: 250 },
                    { label: "Carbs", value: plan.carbs, color: "bg-orange-500", max: 400 },
                    { label: "Fats", value: plan.fats, color: "bg-yellow-500", max: 200 },
                  ].map((macro) => (
                    <div key={macro.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{macro.label}</span>
                        <span className="font-medium">{macro.value}</span>
                      </div>
                      <Progress value={(parseInt(macro.value) / macro.max) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">{plan.meals} meals per day</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
