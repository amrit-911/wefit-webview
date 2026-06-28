"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Trash2, Upload, CheckCircle, Users, Dumbbell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getBannerSettings,
  uploadBannerForAudience,
  removeBannerForAudience,
  type BannerAudience,
} from "@/lib/services/banner.service";

interface AudienceBannerState {
  currentUrl: string | null;
  preview: string | null;
  file: File | null;
  uploading: boolean;
  success: boolean;
}

const EMPTY: AudienceBannerState = {
  currentUrl: null,
  preview: null,
  file: null,
  uploading: false,
  success: false,
};

export default function BannerManagementPage() {
  const [client, setClient] = useState<AudienceBannerState>(EMPTY);
  const [trainer, setTrainer] = useState<AudienceBannerState>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBannerSettings()
      .then((s) => {
        setClient((p) => ({ ...p, currentUrl: s.clientImageUrl || null }));
        setTrainer((p) => ({ ...p, currentUrl: s.trainerImageUrl || null }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3]">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Banner Management</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#5e5873]">Banner Management</h2>
        <p className="text-sm text-[#b9b9c3]">Configure separately for clients &amp; trainers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AudienceBannerCard
          audience="client"
          icon={<Users className="w-4 h-4" />}
          label="Client Banner"
          description="Shown on the Client home page"
          accentColor="#7367f0"
          state={client}
          loading={loading}
          onChange={setClient}
        />
        <AudienceBannerCard
          audience="trainer"
          icon={<Dumbbell className="w-4 h-4" />}
          label="Trainer Banner"
          description="Shown on the Trainer home page"
          accentColor="#28c76f"
          state={trainer}
          loading={loading}
          onChange={setTrainer}
        />
      </div>

    
    </div>
  );
}

function AudienceBannerCard({
  audience,
  icon,
  label,
  description,
  accentColor,
  state,
  loading,
  onChange,
}: {
  audience: BannerAudience;
  icon: React.ReactNode;
  label: string;
  description: string;
  accentColor: string;
  state: AudienceBannerState;
  loading: boolean;
  onChange: React.Dispatch<React.SetStateAction<AudienceBannerState>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<AudienceBannerState>) =>
    onChange((p) => ({ ...p, ...patch }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    set({ file: f, preview: URL.createObjectURL(f), success: false });
  };

  const handleUpload = async () => {
    if (!state.file) return;
    set({ uploading: true });
    try {
      const url = await uploadBannerForAudience(state.file, audience);
      set({ currentUrl: url, preview: null, file: null, uploading: false, success: true });
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => set({ success: false }), 3000);
    } catch (err) {
      console.error(err);
      set({ uploading: false });
    }
  };

  const handleRemove = async () => {
    await removeBannerForAudience(audience).catch(console.error);
    set({ currentUrl: null, preview: null, file: null, success: false });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: accentColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#5e5873]">{label}</h3>
          <p className="text-xs text-[#b9b9c3]">{description}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="w-full aspect-[21/9] rounded-xl bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#7367f0]/50 hover:bg-[#7367f0]/[0.02] transition-colors"
          >
            {state.preview ? (
              <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden">
                <Image src={state.preview} alt="Preview" fill className="object-cover" />
              </div>
            ) : state.currentUrl ? (
              <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden">
                <Image src={state.currentUrl} alt="Current banner" fill className="object-cover" />
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#7367f0]/10 flex items-center justify-center mb-3">
                  <ImagePlus className="w-6 h-6 text-[#7367f0]" />
                </div>
                <p className="text-sm font-semibold text-[#5e5873] mb-1">Click to choose an image</p>
                <p className="text-xs text-[#b9b9c3]">PNG, JPG, WEBP — recommended 1200×400px</p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!state.file || state.uploading}
              className="flex-1 h-10 bg-[#7367f0] hover:bg-[#6355e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {state.uploading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {state.uploading ? "Uploading…" : "Upload Banner"}
            </button>
            {state.file && (
              <button
                onClick={() => { set({ file: null, preview: null }); if (inputRef.current) inputRef.current.value = ""; }}
                className="px-4 h-10 border border-gray-200 text-[#6e6b7b] text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            {state.currentUrl && !state.file && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-4 h-10 border border-red-200 text-red-500 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>

          {state.success && (
            <div className="flex items-center gap-2 text-[#28c76f] text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Banner updated successfully
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
