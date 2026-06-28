"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function UserEditProfilePage() {
  const router = useRouter();
  const { user, displayName, avatarUrl, refreshUserData } = useAuth();

  const [name, setName] = useState(displayName || "");
  const [phone, setPhone] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>(avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch phone from Firestore on mount
  useEffect(() => {
    if (!user || !db) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.phone) setPhone(data.phone);
      }
    }).catch(console.error);
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !storage || !db) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    setError("");

    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", user.uid), { avatar: downloadUrl });
      await refreshUserData();
      setPreviewUrl(downloadUrl);
    } catch (e: any) {
      setError("Failed to upload photo. Please try again.");
      setPreviewUrl(avatarUrl || "");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user || !db) return;
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: phone.trim(),
      });
      await refreshUserData();
      setSuccess(true);
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 text-[12px] font-medium mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        back
      </button>

      <h1 className="text-[22px] font-extrabold text-white mb-8">Edit Profile</h1>

      {/* Avatar — full circle is clickable */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-[#2a2a2c] border-2 border-[#a3e635]/30 flex items-center justify-center focus:outline-none active:opacity-80"
          >
            {previewUrl ? (
              <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="text-[32px] font-extrabold text-white">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </span>
            )}
            {/* Dark overlay hint */}
            <span className="absolute inset-0 bg-black/30 flex items-end justify-center pb-2">
              <Camera className="w-4 h-4 text-white/80" />
            </span>
          </button>

          {/* Upload spinner badge */}
          {uploading && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1c1c1e] rounded-full flex items-center justify-center border-2 border-[#121212]">
              <Loader2 className="w-4 h-4 text-[#a3e635] animate-spin" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-500 -mt-4 mb-8">Tap photo to change</p>

      {/* Fields */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full bg-[#1c1c1e] border border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9191919191"
            type="tel"
            className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
          />
        </div>

        {error && <p className="text-red-400 text-[12px] font-medium">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || success || uploading}
          className="w-full h-13 bg-[#a3e635] disabled:opacity-60 rounded-2xl text-[15px] font-extrabold text-black mt-2"
        >
          {success ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
}
