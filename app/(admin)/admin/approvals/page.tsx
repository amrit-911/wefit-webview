"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, getDocs,
  doc, setDoc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuthAccount } from "@/lib/firebase-secondary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, Clock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";

interface TrainerRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  country?: string;
  height?: string;
  weight?: string;
  certifications?: string;
  experience?: string;
  bio?: string;
  proofId?: string;
  certificate?: string;
  ptInsurance?: string;
  createdAt: any;
}

interface ApproveForm {
  password: string;
  confirmPassword: string;
  plan: string;
}

const EMPTY_FORM: ApproveForm = { password: "", confirmPassword: "", plan: "" };

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrainerRequest | null>(null);
  const [form, setForm] = useState<ApproveForm>(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "trainer_requests"), where("status", "==", "pending"));
    getDocs(q)
      .then((snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainerRequest))))
      .finally(() => setLoading(false));
  }, []);

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApproveSubmit = async () => {
    if (!selected || !db) return;

    if (!form.password || form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!form.plan) {
      toast.error("Please select a plan.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Firebase Auth account via secondary app (admin's session untouched)
      const uid = await createAuthAccount(selected.email, form.password, selected.name);

      // 2. Compute access end date
      const months = parseInt(form.plan);
      const accessEnd = new Date();
      accessEnd.setMonth(accessEnd.getMonth() + months);
      const accessEndStr = `${String(accessEnd.getDate()).padStart(2, "0")}/${String(accessEnd.getMonth() + 1).padStart(2, "0")}/${accessEnd.getFullYear()}`;

      // 3. Create users/{uid} doc with role "trainer"
      await setDoc(doc(db, "users", uid), {
        uid,
        name: selected.name,
        email: selected.email,
        phone: selected.phone ?? "",
        role: "trainer",
        createdAt: serverTimestamp(),
      });

      // 4. Create trainers/{uid} doc with full profile
      await setDoc(doc(db, "trainers", uid), {
        uid,
        name:           selected.name,
        email:          selected.email,
        phone:          selected.phone ?? "",
        gender:         selected.gender ?? "",
        dob:            selected.dob ?? "",
        address:        selected.address ?? "",
        country:        selected.country ?? "",
        height:         selected.height ? Number(selected.height) : 0,
        weight:         selected.weight ? Number(selected.weight) : 0,
        certifications: selected.certifications ?? "",
        experience:     selected.experience ?? "",
        bio:            selected.bio ?? "",
        proofId:        selected.proofId ?? "",
        certificate:    selected.certificate ?? "",
        ptInsurance:    selected.ptInsurance ?? "",
        specialization: "",
        plan:           `${form.plan} Month`,
        accessPeriodMonths: months,
        periodOfAccess: accessEndStr,
        status:         "Active",
        clients:        0,
        avatar:         "",
        createdAt:      serverTimestamp(),
        approvedAt:     serverTimestamp(),
      });

      // 5. Mark the original request as approved
      await updateDoc(doc(db, "trainer_requests", selected.id), {
        status: "approved",
        uid,
        approvedAt: serverTimestamp(),
      });

      toast.success(`${selected.name} approved! They can now sign in with their email and the password you set.`);
      setRequests((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        toast.error("A Firebase account already exists for this email.");
      } else {
        toast.error("Failed to approve: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (req: TrainerRequest) => {
    if (!db) return;
    setRejectingId(req.id);
    try {
      await updateDoc(doc(db, "trainer_requests", req.id), { status: "rejected" });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`${req.name}'s request rejected.`);
    } catch {
      toast.error("Failed to reject.");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainer Approvals"
        description="Review and approve trainer registration requests"
      />

      {/* ── Approval Popup ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Close */}
              <button
                className="absolute top-4 right-4 text-[#b9b9c3] hover:text-[#ea5455] transition-colors"
                onClick={() => { setSelected(null); setForm(EMPTY_FORM); }}
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-[#5e5873] mb-1">Approve Trainer</h2>
              <p className="text-xs text-[#b9b9c3] mb-4">
                Set login credentials for{" "}
                <span className="font-semibold text-[#7367f0]">{selected.name}</span>{" "}
                ({selected.email})
              </p>

              {/* Submitted details summary */}
              <div className="bg-gray-50 rounded-xl p-3 mb-5 space-y-1.5 text-xs text-[#6e6b7b]">
                {selected.phone     && <p><span className="font-semibold">Phone:</span> {selected.phone}</p>}
                {selected.gender    && <p><span className="font-semibold">Gender:</span> {selected.gender}</p>}
                {selected.dob       && <p><span className="font-semibold">DOB:</span> {selected.dob}</p>}
                {selected.country   && <p><span className="font-semibold">Country:</span> {selected.country}</p>}
                {selected.certifications && <p><span className="font-semibold">Certifications:</span> {selected.certifications}</p>}
                {selected.experience     && <p><span className="font-semibold">Experience:</span> {selected.experience}</p>}
                {selected.bio            && <p><span className="font-semibold">Bio:</span> {selected.bio}</p>}
                {/* Documents */}
                {(selected.proofId || selected.certificate || selected.ptInsurance) && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {selected.proofId && (
                      <a href={selected.proofId} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7367f0]/10 text-[#7367f0] font-medium hover:bg-[#7367f0]/20 transition-colors">
                        🪪 ID Proof
                      </a>
                    )}
                    {selected.certificate && (
                      <a href={selected.certificate} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#28c76f]/10 text-[#28c76f] font-medium hover:bg-[#28c76f]/20 transition-colors">
                        📄 Certificate
                      </a>
                    )}
                    {selected.ptInsurance && (
                      <a href={selected.ptInsurance} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff9f43]/10 text-[#ff9f43] font-medium hover:bg-[#ff9f43]/20 transition-colors">
                        🛡️ Insurance
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-10 border-gray-200 text-sm pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9b9c3] hover:text-[#5e5873]"
                      onClick={() => setShowPwd(!showPwd)}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && form.password.length < 6 && (
                    <p className="text-xs text-[#ea5455]">The Password field is required</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="h-10 border-gray-200 text-sm pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9b9c3] hover:text-[#5e5873]"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Plan */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-[#5e5873]">Select Plans</Label>
                  <Select value={form.plan || undefined} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]">
                      <SelectValue placeholder="Select Your Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "6", "12"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m} Month{parseInt(m) > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1 bg-[#7367f0] hover:bg-[#6355e0] text-white gap-2 shadow-[0_0_10px_rgba(115,103,240,0.3)]"
                  onClick={handleApproveSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-[#6e6b7b]"
                  onClick={() => { setSelected(null); setForm(EMPTY_FORM); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-[#b9b9c3]">
            <Clock className="w-10 h-10" />
            <p className="text-sm font-medium">No pending approvals</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100">
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Trainer</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Email</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Experience</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Documents</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Status</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req, i) => (
                <motion.tr
                  key={req.id}
                  className="border-b border-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#ff9f43]/15 text-[#ff9f43] flex items-center justify-center text-xs font-bold">
                        {req.name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm text-[#6e6b7b] font-medium">{req.name}</p>
                        {req.certifications && (
                          <p className="text-[10px] text-[#b9b9c3]">{req.certifications}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#b9b9c3] py-3">{req.email}</TableCell>
                  <TableCell className="text-sm text-[#b9b9c3] py-3 max-w-[140px] truncate">{req.experience ?? "—"}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1">
                      {req.proofId && (
                        <a href={req.proofId} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#7367f0] hover:underline">🪪 ID Proof</a>
                      )}
                      {req.certificate && (
                        <a href={req.certificate} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#28c76f] hover:underline">📄 Certificate</a>
                      )}
                      {req.ptInsurance && (
                        <a href={req.ptInsurance} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#ff9f43] hover:underline">🛡️ Insurance</a>
                      )}
                      {!req.proofId && !req.certificate && !req.ptInsurance && (
                        <span className="text-[10px] text-[#b9b9c3]">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className="bg-[#ff9f43]/10 text-[#ff9f43] border-0 text-xs">Pending</Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        className="bg-[#28c76f] hover:bg-[#24b263] text-white gap-1.5 h-8 px-3 text-xs"
                        onClick={() => { setSelected(req); setForm(EMPTY_FORM); }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#ea5455] text-[#ea5455] hover:bg-[#ea5455] hover:text-white gap-1.5 h-8 px-3 text-xs"
                        onClick={() => handleReject(req)}
                        disabled={rejectingId === req.id}
                      >
                        {rejectingId === req.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <X className="w-3.5 h-3.5" />}
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
