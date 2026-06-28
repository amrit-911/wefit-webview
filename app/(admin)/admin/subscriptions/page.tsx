"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSubscriptions, addSubscription, PLAN_PRICES, type Subscription } from "@/lib/services/subscriptions.service";
import { PageHeader, StatusBadge } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const planPrices: Record<string, { price: string; features: string[] }> = {
  Basic: { price: "₹999/mo", features: ["Gym Access", "Basic Plan", "Locker"] },
  Premium: { price: "₹2,999/mo", features: ["Gym Access", "All Plans", "Personal Trainer (2/mo)", "Locker"] },
  Elite: { price: "₹4,999/mo", features: ["Gym Access", "All Plans", "Unlimited PT", "Nutrition Coaching", "Locker"] },
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSub, setNewSub] = useState({ member: "", plan: "", startDate: "", endDate: "" });

  useEffect(() => {
    getSubscriptions().then(setSubscriptions).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newSub.member || !newSub.plan) return;
    setIsSubmitting(true);
    try {
      const planInfo = PLAN_PRICES[newSub.plan];
      const payload = {
        member: newSub.member,
        plan: newSub.plan,
        amount: planInfo?.amount ?? 0,
        startDate: newSub.startDate || new Date().toISOString().split("T")[0],
        endDate: newSub.endDate || "",
        status: "Active" as const,
      };
      const id = await addSubscription(payload);
      setSubscriptions((prev) => [{ id, ...payload }, ...prev]);
      setOpen(false);
      setNewSub({ member: "", plan: "", startDate: "", endDate: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = subscriptions.filter((s) => s.member.toLowerCase().includes(search.toLowerCase()));
  const planPrices = PLAN_PRICES;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description={`${subscriptions.length} total subscriptions`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)] gap-2"><Plus className="w-4 h-4" />New Subscription</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Subscription</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5"><Label>Member</Label><Input placeholder="Member name or ID" /></div>
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic – ₹999/mo</SelectItem>
                      <SelectItem value="Premium">Premium – ₹2,999/mo</SelectItem>
                      <SelectItem value="Elite">Elite – ₹4,999/mo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" /></div>
                  <div className="space-y-1.5"><Label>End Date</Label><Input type="date" /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white shadow-[0_0_10px_rgba(115,103,240,0.35)]" onClick={() => setOpen(false)}>Create</Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(planPrices).map(([plan, info], i) => (
          <motion.div key={plan} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className={plan === "Elite" ? "border-[#7367f0]/40 bg-gradient-to-b from-[#7367f0]/5" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan}</CardTitle>
                  {plan === "Elite" && <Badge className="bg-[#7367f0] text-white text-xs">Popular</Badge>}
                </div>
                <p className="text-2xl font-bold text-[#7367f0]">{info.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {info.features.map((f) => <li key={f} className="flex items-center gap-1.5">✓ {f}</li>)}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search subscriptions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sub, i) => (
              <motion.tr key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-border">
                <TableCell className="font-medium">{sub.member}</TableCell>
                <TableCell><Badge variant="secondary">{sub.plan}</Badge></TableCell>
                <TableCell className="text-[#7367f0] font-semibold">₹{sub.amount.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{sub.startDate}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{sub.endDate}</TableCell>
                <TableCell><StatusBadge status={sub.status} /></TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
