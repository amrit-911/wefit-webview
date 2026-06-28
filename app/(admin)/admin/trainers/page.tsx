"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { getTrainers, addTrainerWithAuth, updateTrainer, deleteTrainer, computeTrainerPlanEnd, TRAINER_PLANS, type Trainer } from "@/lib/services/trainers.service";
import { getMembers, type Member } from "@/lib/services/members.service";
import { updateAuthEmail } from "@/lib/services/auth-admin.service";
import { notifyAdminTrainerRequest, notifyAdminTrainerAdded } from "@/lib/services/notifications.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFile } from "@/lib/services/storage.service";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function TrainersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [trainersList, setTrainersList] = useState<Trainer[]>([]);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [newTrainer, setNewTrainer] = useState({
    name: "", gender: "", address: "", dob: "", height: "", weight: "",
    email: "", confirmEmail: "", phone: "", confirmPhone: "",
    language: "English", country: "", password: "", confirmPassword: "",
    profilePhoto: "", proofId: "", certificate: "", ptInsurance: "",
    plan: ""
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getTrainers(), getMembers()])
      .then(([ts, ms]) => {
        setTrainersList(ts);
        setMembersList(ms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = trainersList.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "profilePhoto" | "proofId" | "certificate" | "ptInsurance") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const { url } = await uploadFile(file, "trainers");
      setNewTrainer((prev) => ({ ...prev, [field]: url }));
      toast.success(`${field} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!newTrainer.name) { toast.error("Name is required."); return; }
    if (!newTrainer.email) { toast.error("Email is required."); return; }
    if (newTrainer.email !== newTrainer.confirmEmail) { toast.error("Emails do not match."); return; }
    if (newTrainer.phone && newTrainer.phone.replace(/\D/g, "").length !== 10) { toast.error("Contact number must be exactly 10 digits."); return; }
    if (newTrainer.phone !== newTrainer.confirmPhone) { toast.error("Contact numbers do not match."); return; }
    if (!newTrainer.profilePhoto) { toast.error("Profile Photo is required."); return; }
    if (!newTrainer.proofId) { toast.error("ID proof is required."); return; }
    if (!newTrainer.certificate) { toast.error("Personal Trainer Certificate is required."); return; }
    if (!newTrainer.ptInsurance) { toast.error("PT Insurance is required."); return; }
    
    if (!editingTrainerId) {
      if (!newTrainer.password || newTrainer.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
      if (newTrainer.password !== newTrainer.confirmPassword) { toast.error("Passwords do not match."); return; }
      if (!newTrainer.plan) { toast.error("Please select a plan."); return; }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newTrainer.name,
        email: newTrainer.email,
        phone: newTrainer.phone || "",
        specialization: "General Fitness",
        address: newTrainer.address || "",
        dob: newTrainer.dob || "",
        language: newTrainer.language || "English",
        country: newTrainer.country || "India",
        height: Number(newTrainer.height) || 170,
        weight: Number(newTrainer.weight) || 70,
        proofId: newTrainer.proofId || "",
        ptInsurance: newTrainer.ptInsurance || "",
        avatar: newTrainer.profilePhoto || "",
        certificate: newTrainer.certificate || "",
        gender: newTrainer.gender || "",
        ...(newTrainer.plan ? { plan: newTrainer.plan, periodOfAccess: computeTrainerPlanEnd(newTrainer.plan) } : {}),
      };

      if (editingTrainerId) {
        await updateAuthEmail(editingTrainerId, payload.email);
        await updateTrainer(editingTrainerId, payload);
        setTrainersList((prev) => prev.map(t => t.id === editingTrainerId ? { ...t, ...payload } : t));
        toast.success("Trainer updated successfully!");
      } else {
        const fullPayload = {
          ...payload,
          experience: "0 years",
          status: "Active",
          clients: 0,
          periodOfAccess: newTrainer.plan ? computeTrainerPlanEnd(newTrainer.plan) : "",
        };
        const newId = await addTrainerWithAuth(fullPayload, newTrainer.password);
        setTrainersList([{ id: newId, ...fullPayload }, ...trainersList]);
        toast.success("Trainer added! They can sign in with their email and password.");
        // Notify admin
        notifyAdminTrainerAdded(payload.name, payload.email, newId).catch(console.error);
      }
      
      setNewTrainer({
        name: "", gender: "", address: "", dob: "", height: "", weight: "",
        email: "", confirmEmail: "", phone: "", confirmPhone: "",
        language: "English", country: "", password: "", confirmPassword: "",
        profilePhoto: "", proofId: "", certificate: "", ptInsurance: "", plan: ""
      });
      setEditingTrainerId(null);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message?.includes("email-already-in-use") ? "That email already has an account." : (err?.message || "Failed to save trainer."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this trainer?")) return;
    try {
      await deleteTrainer(id);
      setTrainersList((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trainer deleted.");
    } catch {
      toast.error("Failed to delete trainer.");
    }
  };

  // Pagination logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filtered.slice(startIndex, endIndex);

  // Generate page numbers
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

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/dashboard" className="text-[#7367f0] hover:underline">Home</Link>
        <span className="text-[#b9b9c3] mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Trainer Management</span>
      </div>

      {/* Table card */}
      <motion.div
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Controls */}
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
                setNewTrainer({
                  name: "", gender: "", address: "", dob: "", height: "", weight: "",
                  email: "", confirmEmail: "", phone: "", confirmPhone: "",
                  language: "English", country: "", password: "", confirmPassword: "",
                  profilePhoto: "", proofId: "", certificate: "", ptInsurance: "", plan: ""
                });
                setEditingTrainerId(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#28c76f] hover:bg-[#1fa85c] text-white text-sm h-9 px-5 shadow-[0_3px_10px_rgba(40,199,111,0.35)]" onClick={() => {
                  setNewTrainer({
                    name: "", gender: "", address: "", dob: "", height: "", weight: "",
                    email: "", confirmEmail: "", phone: "", confirmPhone: "",
                    language: "English", country: "", password: "", confirmPassword: "",
                    profilePhoto: "", proofId: "", certificate: "", ptInsurance: "", plan: ""
                  });
                  setEditingTrainerId(null);
                }}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add New Trainer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button]:hidden">
                <DialogTitle className="sr-only">Add New Trainer Form</DialogTitle>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#b9b9c3] hover:text-[#5e5873] z-10">
                  <X className="w-5 h-5" />
                </button>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-[#5e5873] text-center mb-1">{editingTrainerId ? "Edit Trainer" : "Add New Trainer"}</h2>
                  <p className="text-sm text-[#b9b9c3] text-center mb-8">{editingTrainerId ? "Update trainer details below." : "Updating user details will receive a privacy audit."}</p>
                  <div className="space-y-5">
                    {/* Row 1: Full Name | Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Full Name</Label><Input placeholder="First Name" value={newTrainer.name} onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Gender</Label>
                        <Select value={newTrainer.gender || undefined} onValueChange={(val) => setNewTrainer({ ...newTrainer, gender: val })}>
                          <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Address | Birth Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Address</Label><Input placeholder="Address" value={newTrainer.address} onChange={(e) => setNewTrainer({ ...newTrainer, address: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Birth Date</Label>
                        <Input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={newTrainer.dob}
                          onChange={(e) => setNewTrainer({ ...newTrainer, dob: e.target.value })}
                          className="h-10 border-gray-200 text-sm text-[#5e5873]"
                        />
                      </div>
                    </div>

                    {/* Row 3: Height | Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Height</Label><Input placeholder="158 Cm" value={newTrainer.height} onChange={(e) => setNewTrainer({ ...newTrainer, height: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Weight</Label><Input placeholder="60Kg" value={newTrainer.weight} onChange={(e) => setNewTrainer({ ...newTrainer, weight: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                    </div>

                    {/* Row 4: Email | Confirm Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Email</Label><Input type="email" placeholder="Email" value={newTrainer.email} onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Confirm Email</Label><Input type="email" placeholder="Email" value={newTrainer.confirmEmail} onChange={(e) => setNewTrainer({ ...newTrainer, confirmEmail: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                    </div>

                    {/* Row 5: Contact | Confirm Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Contact</Label><Input placeholder="Contact No." value={newTrainer.phone} onChange={(e) => setNewTrainer({ ...newTrainer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Confirm Contact</Label><Input placeholder="Contact No." value={newTrainer.confirmPhone} onChange={(e) => setNewTrainer({ ...newTrainer, confirmPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3]" /></div>
                    </div>

                    {/* Row 6: Language | Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5"><Label className="text-sm font-semibold text-[#5e5873]">Language</Label><Input disabled value="English" className="h-10 border-gray-200 text-sm bg-gray-50 text-[#6e6b7b]" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Country</Label>
                        <Select value={newTrainer.country || undefined} onValueChange={(val) => setNewTrainer({ ...newTrainer, country: val })}>
                          <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select Country" /></SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {COUNTRIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 7: Password | Confirm Password - Only show when NOT editing */}
                    {!editingTrainerId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold text-[#5e5873]">Password</Label>
                          <div className="relative">
                            <Input type={showPwd ? "text" : "password"} placeholder="Password" value={newTrainer.password} onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3] pr-10" autoComplete="new-password" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9b9c3] hover:text-[#5e5873]" onClick={() => setShowPwd(!showPwd)}>
                              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold text-[#5e5873]">Confirm Password</Label>
                          <div className="relative">
                            <Input type={showConfirmPwd ? "text" : "password"} placeholder="Confirm Password" value={newTrainer.confirmPassword} onChange={(e) => setNewTrainer({ ...newTrainer, confirmPassword: e.target.value })} className="h-10 border-gray-200 text-sm placeholder:text-[#b9b9c3] pr-10" autoComplete="new-password" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9b9c3] hover:text-[#5e5873]" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                              {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Plan Selection - only for new trainers */}
                    {!editingTrainerId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold text-[#5e5873]">Plan</Label>
                          <Select value={newTrainer.plan || undefined} onValueChange={(val) => setNewTrainer({ ...newTrainer, plan: val })}>
                            <SelectTrigger className="h-10 border-gray-200 text-sm text-[#b9b9c3]"><SelectValue placeholder="Select Plan" /></SelectTrigger>
                            <SelectContent>
                              {TRAINER_PLANS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Row 8: Profile Photo | ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Profile Photo</Label>
                        <div className="flex">
                          <Input readOnly placeholder="Upload Photo" value={newTrainer.profilePhoto.substring(0, 30) + (newTrainer.profilePhoto.length > 30 ? "..." : "")} className="h-10 rounded-r-none border-gray-200 border-r-0 text-sm placeholder:text-[#b9b9c3]" />
                          <Label className={cn("flex items-center justify-center px-4 border border-gray-200 rounded-l-none rounded-r-md text-sm font-medium h-10 w-[100px]", uploadingField === "profilePhoto" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-[#6e6b7b] hover:bg-gray-50 cursor-pointer")}>
                            {uploadingField === "profilePhoto" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                            <input type="file" accept="image/*" disabled={uploadingField === "profilePhoto"} className="hidden" onChange={(e) => handleFileUpload(e, "profilePhoto")} />
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">ID (Passport, License)</Label>
                        <div className="flex">
                          <Input readOnly placeholder="Upload ID" value={newTrainer.proofId.substring(0, 30) + (newTrainer.proofId.length > 30 ? "..." : "")} className="h-10 rounded-r-none border-gray-200 border-r-0 text-sm placeholder:text-[#b9b9c3]" />
                          <Label className={cn("flex items-center justify-center px-4 border border-gray-200 rounded-l-none rounded-r-md text-sm font-medium h-10 w-[100px]", uploadingField === "proofId" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-[#6e6b7b] hover:bg-gray-50 cursor-pointer")}>
                            {uploadingField === "proofId" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                            <input type="file" accept="image/*,.pdf" disabled={uploadingField === "proofId"} className="hidden" onChange={(e) => handleFileUpload(e, "proofId")} />
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Row 9: Certificate | PT Insurance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">Personal Trainer Certificate</Label>
                        <div className="flex">
                          <Input readOnly placeholder="Upload Cerificate" value={newTrainer.certificate.substring(0, 30) + (newTrainer.certificate.length > 30 ? "..." : "")} className="h-10 rounded-r-none border-gray-200 border-r-0 text-sm placeholder:text-[#b9b9c3]" />
                          <Label className={cn("flex items-center justify-center px-4 border border-gray-200 rounded-l-none rounded-r-md text-sm font-medium h-10 w-[100px]", uploadingField === "certificate" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-[#6e6b7b] hover:bg-gray-50 cursor-pointer")}>
                            {uploadingField === "certificate" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                            <input type="file" accept="image/*,.pdf" disabled={uploadingField === "certificate"} className="hidden" onChange={(e) => handleFileUpload(e, "certificate")} />
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#5e5873]">PT Insurance</Label>
                        <div className="flex">
                          <Input readOnly placeholder="Upload Insurance" value={newTrainer.ptInsurance.substring(0, 30) + (newTrainer.ptInsurance.length > 30 ? "..." : "")} className="h-10 rounded-r-none border-gray-200 border-r-0 text-sm placeholder:text-[#b9b9c3]" />
                          <Label className={cn("flex items-center justify-center px-4 border border-gray-200 rounded-l-none rounded-r-md text-sm font-medium h-10 w-[100px]", uploadingField === "ptInsurance" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-[#6e6b7b] hover:bg-gray-50 cursor-pointer")}>
                            {uploadingField === "ptInsurance" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                            <input type="file" accept="image/*,.pdf" disabled={uploadingField === "ptInsurance"} className="hidden" onChange={(e) => handleFileUpload(e, "ptInsurance")} />
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-6 pb-2">
                      <Button disabled={isSubmitting} className="bg-[#7367f0] hover:bg-[#6355e0] text-white text-sm h-10 px-8 shadow-[0_3px_10px_rgba(115,103,240,0.35)]" onClick={handleSubmit}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isSubmitting ? "Saving..." : "Continue"}
                      </Button>
                      <Button className="bg-[#82868b] hover:bg-[#6e6b7b] text-white text-sm h-10 px-8" onClick={() => {
                        setOpen(false);
                        setNewTrainer({
                          name: "", gender: "", address: "", dob: "", height: "", weight: "",
                          email: "", confirmEmail: "", phone: "", confirmPhone: "",
                          language: "English", country: "", password: "", confirmPassword: "",
                          profilePhoto: "", proofId: "", certificate: "", ptInsurance: "", plan: ""
                        });
                      }}>Cancel</Button>
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
            <Select defaultValue="trainer">
              <SelectTrigger className="w-24 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100 bg-transparent">
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase w-12">ID</TableHead>
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Trainers</TableHead>
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Clients</TableHead>
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Specialized in which area</TableHead>
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase">Contact</TableHead>
              <TableHead className="text-[10px] font-bold tracking-wider text-[#6e6b7b] uppercase text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((trainer, i) => (
                <motion.tr
                  key={trainer.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/admin/trainers/${trainer.id}`)}
                >
                  <TableCell className="text-sm text-[#7367f0] font-medium py-3.5">{startIndex + i + 1}</TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shrink-0 uppercase">
                        {trainer.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#6e6b7b] font-medium">{trainer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div 
                      className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/trainers/${trainer.id}/clients`);
                      }}
                    >
                      {membersList.filter((m) => m.trainer === trainer.id).slice(0, 3).map((client, ci) => (
                        <div key={ci} className="w-7 h-7 rounded-full bg-[#7367f0]/20 border-2 border-white flex items-center justify-center text-[10px] text-[#7367f0] font-bold shadow-sm" title={client.name}>
                          {client.avatar ? (
                            <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {membersList.filter((m) => m.trainer === trainer.id).length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] text-[#6e6b7b] font-bold shadow-sm" title={`${membersList.filter((m) => m.trainer === trainer.id).length - 3} more clients`}>
                          +{membersList.filter((m) => m.trainer === trainer.id).length - 3}
                        </div>
                      )}
                      {membersList.filter((m) => m.trainer === trainer.id).length === 0 && (
                        <span className="text-xs text-[#b9b9c3]">0</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] py-3.5">{trainer.specialization}</TableCell>
                  <TableCell className="text-sm text-[#6e6b7b] font-semibold py-3.5">{trainer.phone.replace("+91 ", "").replace(" ", "")}</TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#7367f0] hover:bg-[#7367f0]/5 transition-colors" onClick={(e) => {
                        e.stopPropagation();
                        setEditingTrainerId(trainer.id);
                        setNewTrainer({
                          name: trainer.name, gender: trainer.gender || "", address: trainer.address || "", dob: trainer.dob || "", height: String(trainer.height || ""), weight: String(trainer.weight || ""),
                          email: trainer.email, confirmEmail: trainer.email, phone: trainer.phone, confirmPhone: trainer.phone,
                          language: trainer.language || "English", country: trainer.country || "", password: "", confirmPassword: "",
                          profilePhoto: trainer.avatar || "", proofId: trainer.proofId || "", certificate: trainer.certificate || "", ptInsurance: trainer.ptInsurance || "", plan: trainer.plan || ""
                        });
                        setOpen(true);
                      }}><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#ea5455] hover:bg-[#ea5455]/5 transition-colors" onClick={(e) => handleDelete(trainer.id, e)}><Trash2 className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded text-[#6e6b7b] hover:text-[#7367f0] hover:bg-[#7367f0]/5 transition-colors" onClick={() => router.push(`/admin/trainers/${trainer.id}/clients`)}><Eye className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[#6e6b7b]">
                  No matching records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
