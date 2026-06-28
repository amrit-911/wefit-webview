"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getMembers, addMemberWithAuth, updateMember, deleteMember, type Member } from "@/lib/services/members.service";
import { PTRB_PLANS, computeMembershipEnd } from "@/lib/services/subscriptions.service";
import { updateAuthEmail } from "@/lib/services/auth-admin.service";
import { notifyAdminClientAdded } from "@/lib/services/notifications.service";
import { getTrainerById } from "@/lib/services/trainers.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const EMPTY_FORM = {
  name: "", phone: "", email: "", plan: "",
  gender: "", dob: "", height: "", currentWeight: "",
  goalWeight: "", goal: "", country: "", injuries: "", purpose: "",
  tempPassword: "",
};

export default function TrainerClientsPage() {
  const params = useParams();
  const trainerId = params.id as string;
  const router = useRouter();

  const [membersList, setMembersList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_FORM);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showTempPwd, setShowTempPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Fetch from Firestore ─────────────────────────────────────────────────────
  useEffect(() => {
    getMembers()
      .then((allMembers) => {
        // Filter members by this trainer's ID
        const trainerClients = allMembers.filter(m => m.trainer === trainerId);
        setMembersList(trainerClients);
      })
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoading(false));

    // Fetch trainer name for notifications
    getTrainerById(trainerId).then((t) => { if (t) setTrainerName(t.name); }).catch(() => {});
  }, [trainerId]);

  const filtered = membersList.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  );

  // Pagination logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filtered.slice(startIndex, endIndex);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  // ── Form submit → addMember() or updateMember() ──
  const handleSubmit = async () => {
    if (!newMember.name.trim()) return;
    if (!newMember.email.trim()) { toast.error("Email is required so the client can sign in."); return; }
    
    // Only require password for NEW members
    if (!editingMemberId && (!newMember.tempPassword || newMember.tempPassword.length < 6)) { 
      toast.error("Temporary password must be at least 6 characters."); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      const membershipEnd = newMember.plan ? computeMembershipEnd(newMember.plan) : "N/A";

      const payload = {
        name: newMember.name,
        email: newMember.email || "",
        phone: newMember.phone || "",
        plan: newMember.plan,
        goal: newMember.goal || "General fitness",
        gender: newMember.gender || "Other",
        dob: newMember.dob || "",
        injuries: newMember.injuries || "None",
        country: newMember.country || "India",
        height: Number(newMember.height) || 0,
        currentWeight: Number(newMember.currentWeight) || 0,
        goalWeight: Number(newMember.goalWeight) || 0,
        membershipEnd,
        purpose: newMember.purpose || "",
      };

      if (editingMemberId) {
        // UPDATE existing
        await updateAuthEmail(editingMemberId, payload.email);
        await updateMember(editingMemberId, payload);
        setMembersList((prev) =>
          prev.map((m) => (m.id === editingMemberId ? { ...m, ...payload } : m))
        );
        toast.success("Client updated successfully!");
      } else {
        // CREATE new
        const fullPayload = {
          ...payload,
          status: "Active",
          joinDate: new Date().toISOString().split("T")[0],
          avatar: "",
          trainer: trainerId,
          trainerSpec: "",
          progress: 0,
        };
        const newId = await addMemberWithAuth(fullPayload, newMember.tempPassword);
        const created: Member = { id: newId, ...fullPayload };
        setMembersList((prev) => [created, ...prev]);
        toast.success("Client added and assigned to trainer! They can sign in with their email and temporary password.");
        // Notify admin
        notifyAdminClientAdded(fullPayload.name, fullPayload.plan, trainerName || "Trainer").catch(console.error);
      }

      setNewMember(EMPTY_FORM);
      setEditingMemberId(null);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message?.includes("email-already-in-use") ? "That email already has an account." : (err?.message || "Failed to save client."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this member?")) return;
    try {
      await deleteMember(id);
      setMembersList((prev) => prev.filter((m) => m.id !== id));
      toast.success("Member deleted.");
    } catch {
      toast.error("Failed to delete member.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-semibold text-[#5e5873]">Trainer Clients</h1>
        <div className="text-[#b9b9c3] px-2 text-xl">|</div>
        <div className="text-sm">
          <Link href="/admin" className="text-[#7367f0] hover:underline">Home</Link>
          <span className="text-[#b9b9c3] mx-1.5">/</span>
          <Link href="/admin/trainers" className="text-[#7367f0] hover:underline">Trainer Management</Link>
          <span className="text-[#b9b9c3] mx-1.5">/</span>
          <span className="text-[#6e6b7b] font-medium">Clients</span>
        </div>
      </div>

      <motion.div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-16 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setNewMember(EMPTY_FORM);
                setEditingMemberId(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-9 px-5 shadow-[0_3px_10px_rgba(115,103,240,0.35)]" onClick={() => { setNewMember(EMPTY_FORM); setEditingMemberId(null); }}>
                  Add New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button]:hidden">
                <DialogTitle className="sr-only">Add New Client Form</DialogTitle>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#b9b9c3] hover:text-[#5e5873] z-10"><X className="w-5 h-5" /></button>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-[#5e5873] text-center mb-1">{editingMemberId ? "Edit Client" : "Add New Client"}</h2>
                  <p className="text-sm text-[#b9b9c3] text-center mb-8">{editingMemberId ? "Update the client's details below." : "Client can sign in later with their email using the app."}</p>
                  <div className="space-y-5">
                    {/* Row 1: Full Name | Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Full Name *</Label>
                        <Input placeholder="First Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Gender</Label>
                        <Select value={newMember.gender || undefined} onValueChange={(val) => setNewMember({ ...newMember, gender: val })}>
                          <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Row 2: Goal | Birth Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Goal</Label>
                        <Select value={newMember.goal || undefined} onValueChange={(val) => setNewMember({ ...newMember, goal: val })}>
                          <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select your goal" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lose weight">Lose weight</SelectItem>
                            <SelectItem value="Build muscle">Build muscle</SelectItem>
                            <SelectItem value="Maintain fitness">Maintain fitness</SelectItem>
                            <SelectItem value="General fitness">General fitness</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Birth Date</Label>
                        <Input placeholder="06/03/2000" value={newMember.dob} onChange={(e) => setNewMember({ ...newMember, dob: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                    </div>
                    {/* Row 3: Height | Current Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Height (cm)</Label>
                        <Input placeholder="170" value={newMember.height} onChange={(e) => setNewMember({ ...newMember, height: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Current Weight (kg)</Label>
                        <Input placeholder="70" value={newMember.currentWeight} onChange={(e) => setNewMember({ ...newMember, currentWeight: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                    </div>
                    {/* Row 4: Goal Weight | Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Goal Weight (kg)</Label>
                        <Input placeholder="65" value={newMember.goalWeight} onChange={(e) => setNewMember({ ...newMember, goalWeight: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Email *</Label>
                        <Input type="email" placeholder="member@email.com" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" />
                      </div>
                    </div>
                    {/* Row 5: Contact | Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Contact</Label>
                        <Input placeholder="Contact No." value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" type="tel" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Country</Label>
                        <Select value={newMember.country || undefined} onValueChange={(val) => setNewMember({ ...newMember, country: val })}>
                          <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select Country" /></SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Temp Password row */}
                    {!editingMemberId && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Temporary Password * <span className="text-xs text-[#b9b9c3] font-normal">(client uses this to sign in)</span></Label>
                        <div className="relative">
                          <Input
                            type={showTempPwd ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={newMember.tempPassword}
                            onChange={(e) => setNewMember({ ...newMember, tempPassword: e.target.value })}
                            className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3] pr-10"
                            autoComplete="new-password"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9b9c3] hover:text-[#5e5873]" onClick={() => setShowTempPwd(!showTempPwd)}>
                            {showTempPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Medical Injuries */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#5e5873]">Medical Injuries</Label>
                      <Textarea placeholder="Medical Injuries" value={newMember.injuries} onChange={(e) => setNewMember({ ...newMember, injuries: e.target.value })} className="border-gray-200 text-sm placeholder:text-[#b9b9c3] min-h-[80px] resize-y" />
                    </div>
                    {/* Purpose */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#5e5873]">Purpose of Workout</Label>
                      <Textarea placeholder="Purpose of Workout" value={newMember.purpose} onChange={(e) => setNewMember({ ...newMember, purpose: e.target.value })} className="border-gray-200 text-sm placeholder:text-[#b9b9c3] min-h-[80px] resize-y" />
                    </div>
                    {/* Membership Plan */}
                    <h3 className="text-xl font-bold text-[#5e5873] text-center pt-4">Membership Details</h3>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#5e5873]">Select Plan</Label>
                      <Select value={newMember.plan || undefined} onValueChange={(val) => setNewMember({ ...newMember, plan: val })}>
                        <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select Your Plan" /></SelectTrigger>
                        <SelectContent>
                          {PTRB_PLANS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.tag ?? `${p.price?.toLocaleString("en-IN")} ₹`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <Button className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-10 px-8 shadow-[0_3px_10px_rgba(115,103,240,0.35)]" onClick={handleSubmit} disabled={isSubmitting || !newMember.name.trim()}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Submit"}
                      </Button>
                      <Button className="bg-[#82868b] hover:bg-[#6e6b7b] text-white text-sm h-10 px-8" disabled={isSubmitting} onClick={() => { setOpen(false); setNewMember(EMPTY_FORM); setEditingMemberId(null); }}>Cancel</Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b9b9c3]" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-[180px] border-gray-200 text-sm" />
            </div>
            <Select defaultValue="client">
              <SelectTrigger className="w-24 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#7367f0]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 bg-transparent">
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase w-12">No</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Client</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Goal</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Progress</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Contact</TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-[#b9b9c3]">No clients found.</TableCell></TableRow>
              ) : currentItems.map((member, i) => (
                <motion.tr
                  key={member.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/admin/members/${member.id}`)}
                >
                  <TableCell className="text-sm text-[#7367f0] font-medium py-3.5">{startIndex + i + 1}</TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#6e6b7b] font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] py-3.5 font-semibold text-[#5e5873]">{member.goal || "Lose weight"}</TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-sm text-[#6e6b7b] w-8">{member.progress}%</span>
                      <Progress value={member.progress} className="h-[6px] flex-1 bg-[#ede8ff] [&>div]:bg-[#7367f0]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] font-semibold py-3.5">{member.phone}</TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#7367f0] hover:bg-[#7367f0]/5 transition-colors" onClick={(e) => {
                          e.stopPropagation();
                          setEditingMemberId(member.id);
                          setNewMember({
                            name: member.name, phone: member.phone || "", email: member.email || "", plan: member.plan || "",
                            gender: member.gender || "", dob: member.dob || "", height: member.height ? String(member.height) : "", currentWeight: member.currentWeight ? String(member.currentWeight) : "",
                            goalWeight: member.goalWeight ? String(member.goalWeight) : "", goal: member.goal || "", country: member.country || "", injuries: member.injuries || "", purpose: member.purpose || "",
                            tempPassword: "" // don't populate temp password
                          });
                          setOpen(true);
                        }}><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#ea5455] hover:bg-[#ea5455]/5 transition-colors" onClick={(e) => handleDelete(member.id, e)}><Trash2 className="w-4 h-4" /></button>
                      <Link href={`/admin/members/${member.id}`}>
                        <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#7367f0] hover:bg-[#7367f0]/5 transition-colors"><Eye className="w-4 h-4" /></button>
                      </Link>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm text-[#b9b9c3]">
          <span>Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems}</span>
          {totalPages > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-[#b9b9c3] hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                    currentPage === number
                      ? "bg-[#7367f0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
                      : "bg-gray-50 text-[#6e6b7b] hover:bg-gray-100"
                  )}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-[#b9b9c3] hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
