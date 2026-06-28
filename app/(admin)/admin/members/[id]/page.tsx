"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { getMemberById, updateMember, type Member } from "@/lib/services/members.service";
import { getTrainers, type Trainer } from "@/lib/services/trainers.service";
import {
  getCheckins, getPeriodCheckinsByPeriod, getPeriodCheckins,
  type CheckinData, type PeriodCheckinData, type PeriodType,
} from "@/lib/services/checkin.service";
import { getClientWorkoutPlan, type ClientWorkoutPlan } from "@/lib/services/client-workout.service";
import { notifyAdminTrainerChanged } from "@/lib/services/notifications.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { User, Loader2, X, Dumbbell, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const tabs = ["Overall Details", "Progress", "Workout Plans"];

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overall Details");

  const [client, setClient] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Real data
  const [checkinSubTab, setCheckinSubTab] = useState<"daily" | PeriodType>("daily");
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [periodCheckins, setPeriodCheckins] = useState<PeriodCheckinData[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<ClientWorkoutPlan | null>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);

  // Change Trainer states
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerSearch, setTrainerSearch] = useState("");
  const [changeTrainerOpen, setChangeTrainerOpen] = useState(false);
  const [isAssigningId, setIsAssigningId] = useState<string | null>(null);

  // For displaying assigned trainer name if client.trainer is an ID
  const [assignedTrainerName, setAssignedTrainerName] = useState("Loading...");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await getMemberById(params.id as string);
        if (data) setClient(data);
      } catch (err) {
        toast.error("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id]);

  // Fetch checkins when Overall Details tab is active or sub-tab changes
  useEffect(() => {
    if (!client || activeTab !== "Overall Details") return;
    setCheckinsLoading(true);
    if (checkinSubTab === "daily") {
      getCheckins(client.id)
        .then(setCheckins)
        .catch(() => toast.error("Failed to load daily check-ins"))
        .finally(() => setCheckinsLoading(false));
    } else {
      getPeriodCheckinsByPeriod(client.id, checkinSubTab)
        .then(setPeriodCheckins)
        .catch(() => toast.error("Failed to load period check-ins"))
        .finally(() => setCheckinsLoading(false));
    }
  }, [client, activeTab, checkinSubTab]);

  // Fetch workout plan when Workout Plans tab is active
  useEffect(() => {
    if (!client || activeTab !== "Workout Plans") return;
    setWorkoutLoading(true);
    getClientWorkoutPlan(client.id)
      .then(setWorkoutPlan)
      .catch(() => toast.error("Failed to load workout plan"))
      .finally(() => setWorkoutLoading(false));
  }, [client, activeTab]);

  useEffect(() => {
    if (changeTrainerOpen && trainers.length === 0) {
      getTrainers().then(setTrainers).catch(() => toast.error("Failed to load trainers"));
    }
  }, [changeTrainerOpen, trainers.length]);

  useEffect(() => {
    if (client?.trainer) {
      if (trainers.length > 0) {
        const found = trainers.find(t => t.id === client.trainer);
        if (found) setAssignedTrainerName(found.name);
        else setAssignedTrainerName(client.trainer);
      } else {
        getTrainers().then(ts => {
           setTrainers(ts);
           const found = ts.find(t => t.id === client.trainer);
           if (found) setAssignedTrainerName(found.name);
           else setAssignedTrainerName(client.trainer);
        });
      }
    } else {
      setAssignedTrainerName("No Trainer Assigned");
    }
  }, [client?.trainer, trainers]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7367f0]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-[#b9b9c3]">
        <p className="text-lg">Client not found</p>
        <Link href="/admin/members" className="text-[#7367f0] hover:underline text-sm mt-2 inline-block">Back to Client Management</Link>
      </div>
    );
  }

  const handleAssignTrainer = async (trainer: Trainer) => {
    setIsAssigningId(trainer.id);
    try {
      await updateMember(client.id, {
        trainer: trainer.id,
        trainerSpec: trainer.specialization,
      });
      setClient({ ...client, trainer: trainer.id, trainerSpec: trainer.specialization });
      setAssignedTrainerName(trainer.name);
      toast.success("Trainer assigned successfully!");
      setChangeTrainerOpen(false);
      // Notify admin about the trainer change
      notifyAdminTrainerChanged(
        client.name,
        client.id,
        trainer.name,
        trainer.id
      ).catch(console.error);
    } catch (err) {
      toast.error("Failed to assign trainer");
    } finally {
      setIsAssigningId(null);
    }
  };

  const filteredTrainers = trainers.filter(t => t.name.toLowerCase().includes(trainerSearch.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Title + breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h1 className="text-xl font-semibold text-[#5e5873]">Client Profile</h1>
        <div className="text-sm text-[#b9b9c3]">
          <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/admin/members" className="text-[#7367f0] hover:underline">Client Management</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#6e6b7b]">{activeTab}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left sidebar - Client Details card */}
        <motion.div
          className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex justify-center mb-5">
            <div className="w-[100px] h-[100px] rounded-md bg-gray-100 flex items-center justify-center font-bold text-3xl uppercase text-gray-400">
              {client.name.charAt(0)}
            </div>
          </div>

          <h3 className="text-[13px] text-[#b9b9c3] font-medium mb-4 uppercase tracking-wider">Client Details</h3>

          <div className="space-y-3.5 text-sm">
            <DetailRow label="Username:" value={client.name} />
            <DetailRow label="Email:" value={client.email} breakAll />
            <div className="flex items-start">
              <span className="font-semibold text-[#5e5873] w-[130px] shrink-0">Gender:</span>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                client.gender === "Male" ? "bg-[#28c76f]/15 text-[#28c76f]" : 
                client.gender === "Female" ? "bg-[#ff9f43]/15 text-[#ff9f43]" : "bg-gray-100 text-gray-500"
              )}>{client.gender || "N/A"}</span>
            </div>
            <DetailRow label="Date of Birth:" value={client.dob || "N/A"} />
            <DetailRow label="Injuries:" value={client.injuries || "N/A"} />
            <DetailRow label="Country:" value={client.country || "N/A"} />
            <DetailRow label="Height:" value={client.height ? `${client.height} cm` : "N/A"} />
            <DetailRow label="Goal:" value={client.goal || "N/A"} />
            <DetailRow label="Current weight:" value={client.currentWeight ? `${client.currentWeight} kg` : "N/A"} />
            <DetailRow label="Goal weight:" value={client.goalWeight ? `${client.goalWeight} kg` : "N/A"} />
            <DetailRow label="Purpose:" value={client.purpose || "N/A"} />
            <DetailRow label="Contact:" value={client.phone} />
            <DetailRow label="Membership end date:" value={client.membershipEnd || "N/A"} />
          </div>
        </motion.div>

        {/* Right side - tabs + content */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-[#7367f0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.4)]"
                    : "text-[#6e6b7b] hover:text-[#7367f0] bg-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ─── Tab: Overall Details ─── */}
          {activeTab === "Overall Details" && (
            <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center uppercase font-bold text-sm">
                    {assignedTrainerName === "No Trainer Assigned" ? <User className="w-5 h-5 text-gray-300" /> : assignedTrainerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#5e5873]">{assignedTrainerName}</p>
                    <p className="text-xs text-[#b9b9c3]">{client.trainerSpec || "No Specialization"}</p>
                  </div>
                </div>

                <Dialog open={changeTrainerOpen} onOpenChange={setChangeTrainerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-[#7367f0] text-[#7367f0] hover:bg-[#7367f0] hover:text-white text-sm h-9 px-5">
                      Change Trainer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md p-0 gap-0 [&>button]:hidden">
                    <DialogTitle className="sr-only">Change Trainer</DialogTitle>
                    <button onClick={() => setChangeTrainerOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 z-10"><X className="w-5 h-5 text-gray-500" /></button>
                    
                    <div className="p-8 pt-10">
                      <h2 className="text-2xl font-bold text-[#5e5873] text-center mb-2">Clients assigned to trainers</h2>
                      <p className="text-sm text-[#b9b9c3] text-center mb-6">"Assign to trainers with our gym management software."</p>

                      <div className="mb-6">
                        <label className="text-xs font-medium text-[#b9b9c3] mb-1.5 block">Search Trainer</label>
                        <Input 
                          placeholder="Name" 
                          value={trainerSearch} 
                          onChange={(e) => setTrainerSearch(e.target.value)} 
                          className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" 
                        />
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {filteredTrainers.map(trainer => (
                          <div key={trainer.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold uppercase text-sm">
                                  {trainer.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-[#5e5873]">{trainer.name.toLowerCase()}</p>
                                  <p className="text-xs text-[#b9b9c3]">{trainer.specialization}</p>
                               </div>
                            </div>
                            <Button 
                               className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-8 px-5 rounded-md shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
                               onClick={() => handleAssignTrainer(trainer)}
                               disabled={isAssigningId !== null}
                            >
                               {isAssigningId === trainer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select"}
                            </Button>
                          </div>
                        ))}
                        {filteredTrainers.length === 0 && (
                          <p className="text-center text-sm text-[#b9b9c3]">No trainers found.</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#5e5873]">Check-Ins</h3>
              </div>

              {/* Sub-tab selector */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {(["daily", "3days", "7days", "14days", "1month"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCheckinSubTab(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                      checkinSubTab === t
                        ? "bg-[#7367f0] text-white shadow-[0_2px_8px_rgba(115,103,240,0.4)]"
                        : "text-[#6e6b7b] bg-gray-100 hover:text-[#7367f0]"
                    )}
                  >
                    {{ daily: "Daily", "3days": "3 Days", "7days": "7 Days", "14days": "14 Days", "1month": "1 Month" }[t]}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                {/* Daily check-ins table */}
                {checkinSubTab === "daily" && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Date</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Training Session</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Nutrition</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Energy</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Motivation</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkinsLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#7367f0] mx-auto" /></TableCell></TableRow>
                      ) : checkins.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-sm text-[#b9b9c3] py-8">No daily check-ins recorded yet</TableCell></TableRow>
                      ) : checkins.map((c) => (
                        <TableRow key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <TableCell className="text-sm text-[#5e5873] font-medium whitespace-nowrap">
                            {new Date(c.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </TableCell>
                          <TableCell className="text-xs text-[#6e6b7b] max-w-[160px] truncate">{c.trainingSession || "—"}</TableCell>
                          <TableCell><RatingPill value={c.nutrition} /></TableCell>
                          <TableCell><RatingPill value={c.energyLevel} /></TableCell>
                          <TableCell><RatingPill value={c.motivation} /></TableCell>
                          <TableCell className="text-xs text-[#b9b9c3] max-w-[180px] truncate">{c.note || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Period check-ins table */}
                {checkinSubTab !== "daily" && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Date</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Weight</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Training Adherence</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Nutrition Adherence</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Energy</TableHead>
                        <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Sleep</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkinsLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#7367f0] mx-auto" /></TableCell></TableRow>
                      ) : periodCheckins.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-sm text-[#b9b9c3] py-8">No check-ins recorded for this period</TableCell></TableRow>
                      ) : periodCheckins.map((c) => (
                        <TableRow key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <TableCell className="text-sm text-[#5e5873] font-medium whitespace-nowrap">
                            {new Date(c.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </TableCell>
                          <TableCell className="text-sm text-[#6e6b7b] font-semibold">{c.weight ? `${c.weight} kg` : "—"}</TableCell>
                          <TableCell><RatingPill value={c.trainingAdherence} /></TableCell>
                          <TableCell><RatingPill value={c.nutritionAdherence} /></TableCell>
                          <TableCell><RatingPill value={c.energy} /></TableCell>
                          <TableCell><RatingPill value={c.qualityOfSleep} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* ─── Tab: Progress ─── */}
          {activeTab === "Progress" && (
            <ProgressTab clientId={client.id} goal={client.goal} goalWeight={client.goalWeight} />
          )}

          {/* ─── Tab: Workout Plans ─── */}
          {activeTab === "Workout Plans" && (
            <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5">
              {workoutLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
                </div>
              ) : !workoutPlan ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Dumbbell className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm font-semibold text-[#5e5873] mb-1">No workout plan assigned</p>
                  <p className="text-xs text-[#b9b9c3]">The trainer hasn't assigned a workout plan yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold text-[#5e5873]">Assigned Workout Plan</h3>
                      <p className="text-xs text-[#b9b9c3] mt-0.5">
                        {workoutPlan.assignedAt
                          ? `Assigned ${new Date((workoutPlan.assignedAt as any).toDate?.() ?? workoutPlan.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                          : `${workoutPlan.days.length} day plan`}
                      </p>
                    </div>
                    <span className="bg-[#7367f0]/10 text-[#7367f0] text-xs font-bold px-3 py-1 rounded-full">
                      {workoutPlan.days.filter(d => !d.isRestDay).length} active days
                    </span>
                  </div>

                  {workoutPlan.days.map((day) => (
                    <div key={day.dayNumber} className="border border-gray-100 rounded-lg overflow-hidden">
                      {/* Day header */}
                      <div className={cn(
                        "flex items-center justify-between px-4 py-3",
                        day.isRestDay ? "bg-gray-50" : "bg-[#7367f0]/5"
                      )}>
                        <div className="flex items-center gap-2">
                          {day.isRestDay
                            ? <Moon className="w-4 h-4 text-[#b9b9c3]" />
                            : <Dumbbell className="w-4 h-4 text-[#7367f0]" />}
                          <span className="text-sm font-bold text-[#5e5873]">Day {day.dayNumber} — {day.label}</span>
                        </div>
                        {day.isRestDay
                          ? <span className="text-xs text-[#b9b9c3] font-medium">Rest Day</span>
                          : <span className="text-xs text-[#7367f0] font-semibold">{day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}</span>}
                      </div>

                      {/* Exercises */}
                      {!day.isRestDay && day.exercises.length > 0 && (
                        <div className="divide-y divide-gray-50">
                          {day.exercises.map((ex, ei) => (
                            <div key={ei} className="px-4 py-3 flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#5e5873] truncate">{ex.name}</p>
                                {ex.note && <p className="text-xs text-[#b9b9c3] truncate mt-0.5">{ex.note}</p>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-xs text-[#6e6b7b]">
                                <span className="bg-[#7367f0]/10 text-[#7367f0] font-bold px-2 py-0.5 rounded">{ex.sets} sets</span>
                                <span className="bg-gray-100 font-bold px-2 py-0.5 rounded">{ex.reps} reps</span>
                                {ex.restTime && <span className="text-[#b9b9c3]">Rest: {ex.restTime}</span>}
                                {ex.videoLink && (
                                  <a href={ex.videoLink} target="_blank" rel="noreferrer" className="text-[#7367f0] hover:underline font-medium">▶ Video</a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
      <span className="font-semibold text-[#5e5873] w-[130px] shrink-0">{label}</span>
      <span className={cn("text-[#6e6b7b]", breakAll && "break-all")}>{value}</span>
    </div>
  );
}

function RatingPill({ value }: { value?: number | null }) {
  if (value == null) return <span className="text-xs text-[#b9b9c3]">—</span>;
  const color = value >= 8 ? "#28c76f" : value >= 5 ? "#ff9f43" : "#ea5455";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-[#b9b9c3]">/10</span>
    </span>
  );
}

function ProgressTab({ clientId, goal, goalWeight }: { clientId: string; goal?: string; goalWeight?: number }) {
  const [weightData, setWeightData] = useState<{ label: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeriodCheckins(clientId)
      .then((rows) => {
        const points = rows
          .filter((r) => r.weight && !isNaN(parseFloat(r.weight!)))
          .map((r) => ({
            label: new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            weight: parseFloat(r.weight!),
          }))
          .reverse()
          .slice(-12);
        setWeightData(points);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  const latest = weightData[weightData.length - 1]?.weight;
  const earliest = weightData[0]?.weight;
  const change = latest != null && earliest != null && weightData.length > 1 ? latest - earliest : null;

  return (
    <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5">
      <h3 className="text-xl font-bold text-[#5e5873] mb-1 capitalize">{goal || "Weight Progress"}</h3>
      <p className="text-xs text-[#b9b9c3] mb-6">Weight logged from period check-ins</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
        </div>
      ) : weightData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[#b9b9c3] text-sm">No weight data from period check-ins yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Current Weight", value: latest ? `${latest} kg` : "N/A", color: "#7367f0" },
              { label: "Goal Weight", value: goalWeight ? `${goalWeight} kg` : "N/A", color: "#28c76f" },
              {
                label: "Total Change",
                value: change != null ? `${change > 0 ? "+" : ""}${change.toFixed(1)} kg` : "—",
                color: change != null && change < 0 ? "#28c76f" : "#ea5455",
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-[11px] text-[#b9b9c3] font-medium uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebe9f1" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#b9b9c3" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#b9b9c3" }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #ebe9f1", borderRadius: 6, fontSize: 12 }} formatter={(v) => [`${v} kg`, "Weight"]} />
              <Bar dataKey="weight" fill="#7367f0" radius={[4, 4, 0, 0]} barSize={36} name="Weight (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
