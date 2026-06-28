"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getWorkoutPlans, addWorkoutPlan, type WorkoutPlan } from "@/lib/services/workout-plans.service";
import { PageHeader, StatusBadge } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Calendar, UserCheck } from "lucide-react";

export default function WorkoutPlansPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", duration: "", days: "", level: "", goal: "", trainer: "" });

  useEffect(() => {
    getWorkoutPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newPlan.name) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: newPlan.name,
        duration: newPlan.duration || "4 weeks",
        days: Number(newPlan.days) || 3,
        level: (newPlan.level as WorkoutPlan["level"]) || "Beginner",
        goal: newPlan.goal || "",
        members: 0,
        trainer: newPlan.trainer || "",
      };
      const id = await addWorkoutPlan(payload);
      setPlans((prev) => [{ id, ...payload }, ...prev]);
      setOpen(false);
      setNewPlan({ name: "", duration: "", days: "", level: "", goal: "", trainer: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = plans.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.goal.toLowerCase().includes(search.toLowerCase())
  );

  const levelColors: Record<string, string> = {
    Beginner: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Intermediate: "bg-[#7367f0]/15 text-[#7367f0] border-[#7367f0]/30",
    Advanced: "bg-orange-500/15 text-[#ff9f43] border-[#ff9f43]/30",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Plans"
        description={`${plans.length} workout plans available`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />Create Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Workout Plan</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Plan Name</Label><Input placeholder="e.g. Beginner Full Body" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Duration</Label><Input placeholder="e.g. 4 weeks" value={newPlan.duration} onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Days/Week</Label><Input type="number" placeholder="3" value={newPlan.days} onChange={(e) => setNewPlan({ ...newPlan, days: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Level</Label>
                    <Select value={newPlan.level || undefined} onValueChange={(val) => setNewPlan({ ...newPlan, level: val })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Goal</Label><Input placeholder="e.g. Weight Loss" value={newPlan.goal} onChange={(e) => setNewPlan({ ...newPlan, goal: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={handleCreate} disabled={isSubmitting || !newPlan.name}>Create Plan</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search plans..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -2 }}>
            <Card className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-600 to-[#6355e0]" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold">{plan.name}</p>
                  <Badge variant="outline" className={levelColors[plan.level]}>{plan.level}</Badge>
                </div>
                <Badge variant="secondary" className="mb-3 text-xs">{plan.goal}</Badge>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                  <div className="bg-muted rounded-lg p-2">
                    <p className="font-bold text-sm text-foreground">{plan.duration}</p>
                    <p className="text-muted-foreground">Duration</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <p className="font-bold text-sm text-foreground">{plan.days}</p>
                    <p className="text-muted-foreground">Days/wk</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <p className="font-bold text-sm text-foreground">{plan.members}</p>
                    <p className="text-muted-foreground">Members</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" />{plan.trainer}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
