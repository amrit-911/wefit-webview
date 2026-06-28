"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { getTrainerById, updateTrainer, TRAINER_PLANS, computeTrainerPlanEnd, daysUntilTrainerExpiry, type Trainer } from "@/lib/services/trainers.service";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, ChevronLeft, ChevronRight, Check, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const tabs = ["Certifications"];

export default function TrainerProfilePage() {
  const params = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState("Certifications");
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);

  useEffect(() => {
    getTrainerById(params.id)
      .then(setTrainer)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRenew = async () => {
    if (!selectedPlan) { toast.error("Please select a plan."); return; }
    setRenewLoading(true);
    try {
      const newEnd = computeTrainerPlanEnd(selectedPlan);
      await updateTrainer(params.id, { plan: selectedPlan, periodOfAccess: newEnd });
      setTrainer((prev) => prev ? { ...prev, plan: selectedPlan, periodOfAccess: newEnd } : prev);
      toast.success("Plan renewed successfully!");
      setRenewOpen(false);
      setSelectedPlan("");
    } catch {
      toast.error("Failed to renew plan.");
    } finally {
      setRenewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-[#b9b9c3]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="text-center py-20 text-[#b9b9c3]">
        <p className="text-lg">Trainer not found</p>
        <Link href="/admin/trainers" className="text-[#7367f0] hover:underline text-sm mt-2 inline-block">Back to Trainer Management</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title + breadcrumb */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-[#5e5873]">Trainer Profile</h1>
        <div className="text-[#b9b9c3] px-2 text-xl">|</div>
        <div className="text-sm text-[#b9b9c3]">
          <Link href="/admin/dashboard" className="text-[#7367f0] hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/admin/trainers" className="text-[#7367f0] hover:underline">Trainer Management</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#6e6b7b] font-medium">Profile</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left sidebar - Trainer Details card */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5 flex flex-col items-center"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-[120px] h-[120px] rounded-md bg-gray-50 flex items-center justify-center mb-6 overflow-hidden">
            {trainer.avatar ? (
               <img src={trainer.avatar} alt={trainer.name} className="w-full h-full object-cover" />
            ) : (
               <span className="text-4xl text-[#b9b9c3] font-bold uppercase">{trainer.name.charAt(0)}</span>
            )}
          </div>

          <div className="w-full text-left">
              <h3 className="text-base text-[#b9b9c3] font-medium mb-5">Trainer Details</h3>

              <div className="space-y-4 text-sm">
                <DetailRow label="Username:" value={trainer.name} />
                <DetailRow label="Email:" value={trainer.email} breakAll />
                <DetailRow label="Address:" value={trainer.address || ""} />
                <DetailRow label="Date of Birth:" value={trainer.dob || ""} />
                <DetailRow label="Specialized:" value={trainer.specialization} />
                <DetailRow label="Language:" value={trainer.language || ""} />
                <DetailRow label="Country:" value={trainer.country || ""} />
                <DetailRow label="Height :" value={trainer.height ? String(trainer.height) : ""} />
                <DetailRow label="Weight :" value={trainer.weight ? String(trainer.weight) : ""} />
                <DetailRow label="Contact :" value={trainer.phone.replace("+91 ", "").replace(" ", "")} />

                {/* Plan info */}
                {trainer.plan && (
                  <div className="flex items-start">
                    <span className="font-semibold text-[#5e5873] w-[90px] shrink-0">Plan:</span>
                    <span className="text-[#6e6b7b]">{trainer.plan}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-[#5e5873] w-[90px] shrink-0">Period of<br/>access:</span>
                      <span className="text-[#6e6b7b] px-2">{trainer.periodOfAccess || "N/A"}</span>
                    </div>
                    {(() => {
                      const days = trainer.periodOfAccess ? daysUntilTrainerExpiry(trainer.periodOfAccess) : null;
                      if (days === null) return null;
                      if (days < 0) return <span className="ml-[90px] text-xs text-[#ea5455] font-medium">Expired</span>;
                      return (
                        <span className={cn("ml-[90px] text-xs font-medium", days <= 7 ? "text-[#ff9f43]" : "text-[#28c76f]")}>
                          {days} day{days !== 1 ? "s" : ""} remaining
                        </span>
                      );
                    })()}
                  </div>
                  <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-xs h-8 px-3 leading-tight shrink-0">
                        Plan<br/>Renewal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogTitle className="text-base font-semibold text-[#5e5873]">Renew / Update Plan</DialogTitle>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold text-[#5e5873]">Select Plan</Label>
                          <Select value={selectedPlan || undefined} onValueChange={setSelectedPlan}>
                            <SelectTrigger className="h-10 border-gray-200 text-sm">
                              <SelectValue placeholder="Choose a plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {TRAINER_PLANS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedPlan && (
                          <p className="text-xs text-[#6e6b7b]">
                            New expiry: <span className="font-semibold text-[#5e5873]">{computeTrainerPlanEnd(selectedPlan)}</span>
                          </p>
                        )}
                        <div className="flex gap-3 pt-2">
                          <Button
                            className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9"
                            disabled={renewLoading}
                            onClick={handleRenew}
                          >
                            {renewLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            {renewLoading ? "Saving..." : "Confirm"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-sm h-9"
                            onClick={() => { setRenewOpen(false); setSelectedPlan(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <span className="font-semibold text-[#5e5873] w-[90px] shrink-0">ID proof:</span>
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                        {trainer.proofId ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="w-full h-full cursor-pointer hover:opacity-80">
                                        <img src={trainer.proofId} alt="ID" className="w-full h-full object-cover" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                                    <img src={trainer.proofId} alt="ID" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <User className="w-5 h-5 text-[#b9b9c3]" />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <span className="font-semibold text-[#5e5873] w-[90px] shrink-0">PT insurance:</span>
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                        {trainer.ptInsurance ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="w-full h-full cursor-pointer hover:opacity-80">
                                        <img src={trainer.ptInsurance} alt="PT Insurance" className="w-full h-full object-cover" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                                    <img src={trainer.ptInsurance} alt="PT Insurance" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <User className="w-5 h-5 text-[#b9b9c3]" />
                        )}
                    </div>
                </div>

                {/* <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-gray-50">
                    <Button variant="outline" className="flex-1 border-[#ea5455] text-[#ea5455] hover:bg-[#ea5455] hover:text-white h-9 text-xs">
                        Temporary Suspend
                    </Button>
                    <Button variant="outline" className="flex-1 border-[#ea5455] text-[#ea5455] hover:bg-[#ea5455] hover:text-white h-9 text-xs">
                        Suspend
                    </Button>
                </div> */}

              </div>
          </div>
        </motion.div>

        {/* Right side - tabs + content */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          {/* Tabs */}
          <div className="flex gap-1 mb-5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-[#7367f0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.4)]"
                    : "text-[#6e6b7b] hover:text-[#7367f0] bg-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ─── Tab: Certifications ─── */}
          {activeTab === "Certifications" && (
            <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5 min-h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certificate Image */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-2 min-h-[200px] flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                     {trainer.certificate ? (
                         <Dialog>
                           <DialogTrigger asChild>
                             <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                <img src={trainer.certificate} alt="Trainer Certificate" className="max-w-full max-h-[250px] object-contain rounded" />
                             </div>
                           </DialogTrigger>
                           <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                             <img src={trainer.certificate} alt="Trainer Certificate" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
                           </DialogContent>
                         </Dialog>
                     ) : (
                         <div className="text-center">
                            <p className="text-[#b9b9c3] text-sm">No Private Trainer Certificate Uploaded</p>
                         </div>
                     )}
                  </div>
                  {/* Insurance Image */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-2 min-h-[200px] flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                     {trainer.ptInsurance ? (
                         <Dialog>
                           <DialogTrigger asChild>
                             <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                <img src={trainer.ptInsurance} alt="Trainer Insurance" className="max-w-full max-h-[250px] object-contain rounded" />
                             </div>
                           </DialogTrigger>
                           <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                             <img src={trainer.ptInsurance} alt="Trainer Insurance" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
                           </DialogContent>
                         </Dialog>
                     ) : (
                         <div className="text-center">
                            <p className="text-[#b9b9c3] text-sm">No PT Insurance Uploaded</p>
                         </div>
                     )}
                  </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, breakAll }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="flex items-start">
      <span className="font-semibold text-[#5e5873] w-[90px] shrink-0">{label}</span>
      <span className={cn("text-[#6e6b7b]", breakAll && "break-all")}>{value}</span>
    </div>
  );
}
