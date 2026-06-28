"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadFile } from "@/lib/services/storage.service";
import { notifyAdminTrainerRequest } from "@/lib/services/notifications.service";
import { toast } from "sonner";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Canada",
  "Chile","China","Colombia","Croatia","Czech Republic","Denmark","Egypt","Ethiopia","Finland","France",
  "Germany","Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kenya","Malaysia","Mexico","Morocco","Netherlands","New Zealand",
  "Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia",
  "Singapore","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Tanzania","Thailand",
  "Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Vietnam","Zimbabwe"
];

type UploadField = "proofId" | "certificate" | "ptInsurance";

export default function TrainerRegistrationPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  // File upload state
  const [uploads, setUploads] = useState<Record<UploadField, { url: string; name: string; uploading: boolean }>>({
    proofId:     { url: "", name: "", uploading: false },
    certificate: { url: "", name: "", uploading: false },
    ptInsurance: { url: "", name: "", uploading: false },
  });

  const proofIdRef    = useRef<HTMLInputElement>(null);
  const certRef       = useRef<HTMLInputElement>(null);
  const insuranceRef  = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: UploadField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploads((prev) => ({ ...prev, [field]: { ...prev[field], uploading: true, name: file.name } }));
    try {
      const { url } = await uploadFile(file, "trainer_requests");
      setUploads((prev) => ({ ...prev, [field]: { url, name: file.name, uploading: false } }));
      toast.success("File uploaded ✓");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${field}`);
      setUploads((prev) => ({ ...prev, [field]: { url: "", name: "", uploading: false } }));
    }
  };

  const onSubmit = async (data: any) => {
    if (!uploads.proofId.url) { toast.error("Please upload your ID proof."); return; }
    if (!uploads.certificate.url) { toast.error("Please upload your trainer certificate."); return; }

    setLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");

      await addDoc(collection(db, "trainer_requests"), {
        name:           data.fullName,
        email:          data.email,
        phone:          data.phone,
        gender:         data.gender,
        dob:            data.dob,
        address:        data.address,
        country:        data.country,
        height:         data.height,
        weight:         data.weight,
        certifications: data.certifications,
        experience:     data.experience,
        bio:            data.bio,
        proofId:        uploads.proofId.url,
        certificate:    uploads.certificate.url,
        ptInsurance:    uploads.ptInsurance.url,
        status:         "pending",
        createdAt:      serverTimestamp(),
      });

      router.push("/trainer-success");
      // Notify admin of new request (fire-and-forget)
      notifyAdminTrainerRequest(data.fullName, data.email).catch(console.error);
    } catch (err: any) {
      toast.error("Failed to submit application. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const anyUploading = Object.values(uploads).some((u) => u.uploading);

  const UploadRow = ({
    field, label, required, inputRef,
  }: {
    field: UploadField;
    label: string;
    required?: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    const state = uploads[field];
    return (
      <div className="space-y-1.5">
        <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">
          {label} {required && <span className="text-red-400">*</span>}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state.uploading}
          className={`w-full h-[45px] rounded-[8px] px-4 text-[12px] font-medium flex items-center gap-2 transition-all border ${
            state.url
              ? "bg-[#a3e635]/10 border-[#a3e635]/40 text-[#a3e635]"
              : "bg-[#1c1c1e] border-[#2a2a2c] text-gray-400 hover:border-[#a3e635]/30"
          }`}
        >
          {state.uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Uploading…</>
          ) : state.url ? (
            <><CheckCircle2 className="w-4 h-4 shrink-0" /><span className="truncate">{state.name}</span></>
          ) : (
            <><Upload className="w-4 h-4 shrink-0" /> Choose file (PDF or image)</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFileUpload(e, field)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#121212] relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-sm pt-12 pb-4 px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[22px] font-extrabold text-white tracking-wide">Trainer Registration</h1>
        <p className="text-[11px] text-gray-500 font-medium mt-1">Complete your profile to get started</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col px-6 pb-12 z-10 max-w-md mx-auto w-full pt-4"
      >
        {/* Avatar placeholder */}
        <div className="flex justify-center mb-8">
          <button type="button" className="relative group">
            <div className="w-[60px] h-[60px] rounded-full bg-[#a3e635] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Camera className="w-[22px] h-[22px] text-black" fill="currentColor" strokeWidth={1} />
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">

          {/* ── Section: Personal Info ── */}
          <p className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase ml-1 pt-1">Personal Info</p>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">FULL NAME *</p>
            <input
              type="text" placeholder="e.g. John Smith" required
              {...register("fullName")}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">GENDER *</p>
              <select
                required
                {...register("gender")}
                className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all appearance-none"
              >
                <option value="" disabled>Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">DATE OF BIRTH *</p>
              <input
                type="date" required
                {...register("dob")}
                className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
          </div>

          {/* Height + Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">HEIGHT (cm)</p>
              <input
                type="number" placeholder="175"
                {...register("height")}
                className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">WEIGHT (kg)</p>
              <input
                type="number" placeholder="75"
                {...register("weight")}
                className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">ADDRESS</p>
            <input
              type="text" placeholder="Street, City"
              {...register("address")}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">COUNTRY *</p>
            <select
              required
              defaultValue=""
              {...register("country")}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all appearance-none"
            >
              <option value="" disabled>Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Section: Contact ── */}
          <p className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase ml-1 pt-1">Contact</p>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">EMAIL *</p>
            <input
              type="email" placeholder="your@email.com" required
              {...register("email")}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">PHONE NUMBER *</p>
            <input
              type="tel"
              placeholder="10-digit phone number"
              required
              inputMode="numeric"
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              {...register("phone", {
                required: true,
                pattern: { value: /^[0-9]{10}$/, message: "Enter a valid 10-digit phone number" },
                onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); },
              })}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
            {errors.phone && (
              <p className="text-[10px] text-red-400 ml-1">{errors.phone.message as string || "Enter a valid 10-digit phone number"}</p>
            )}
          </div>

          {/* ── Section: Professional ── */}
          <p className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase ml-1 pt-1">Professional Details</p>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">CERTIFICATIONS *</p>
            <input
              type="text" placeholder="e.g., ACE, NASM, ISSA..." required
              {...register("certifications")}
              className="w-full h-[45px] bg-[#1c1c1e] rounded-[8px] px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">EXPERIENCE *</p>
            <textarea
              placeholder="Years of experience, previous roles..."
              required
              {...register("experience")}
              className="w-full h-[80px] bg-[#1c1c1e] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-white tracking-wider uppercase ml-1">BIO *</p>
            <textarea
              placeholder="Tell us about yourself"
              required
              {...register("bio")}
              className="w-full h-[80px] bg-[#1c1c1e] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
            />
          </div>

          {/* ── Section: Documents ── */}
          <p className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase ml-1 pt-1">Documents</p>
          <p className="text-[10px] text-gray-500 ml-1 -mt-3">Upload PDF or image files. ID and certificate are required.</p>

          <UploadRow field="proofId"     label="ID Proof (Passport / License)" required inputRef={proofIdRef} />
          <UploadRow field="certificate" label="Personal Trainer Certificate"  required inputRef={certRef} />
          <UploadRow field="ptInsurance" label="PT Insurance (optional)"                inputRef={insuranceRef} />

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading || anyUploading}
              className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[13px] rounded-[10px] py-[22px] tracking-wide transition-colors disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
                : anyUploading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading files…</>
                : "Submit Application"
              }
            </Button>
          </div>

          <div className="text-center text-[11px] font-medium text-gray-400 tracking-wide mt-4">
            Already Approved?{" "}
            <button type="button" onClick={() => router.push("/login")} className="text-[#a3e635] font-bold hover:underline">
              Sign in
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
