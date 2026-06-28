import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BANNER_DOC = "settings/homeBanner";

export interface BannerSettings {
  /** @deprecated Use clientImageUrl / trainerImageUrl instead */
  imageUrl?: string;

  clientImageUrl: string;
  trainerImageUrl: string;

  updatedAt?: Date;
}

const DEFAULT: BannerSettings = { clientImageUrl: "", trainerImageUrl: "" };

export async function getBannerSettings(): Promise<BannerSettings> {
  if (!db) return DEFAULT;
  const snap = await getDoc(doc(db, BANNER_DOC));
  if (!snap.exists()) return DEFAULT;
  const data = snap.data();
  const legacy = data.imageUrl ?? "";
  return {
    clientImageUrl: data.clientImageUrl ?? legacy,
    trainerImageUrl: data.trainerImageUrl ?? legacy,
    updatedAt: data.updatedAt?.toDate?.(),
  };
}

export type BannerAudience = "client" | "trainer";

export async function uploadBannerForAudience(file: File, audience: BannerAudience): Promise<string> {
  if (!storage || !db) throw new Error("Firebase not initialized");
  const storageRef = ref(storage, `banners/home-banner-${audience}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const field = audience === "client" ? "clientImageUrl" : "trainerImageUrl";
  const snap = await getDoc(doc(db, BANNER_DOC));
  const existing = snap.exists() ? snap.data() : {};
  await setDoc(doc(db, BANNER_DOC), { ...existing, [field]: url, updatedAt: serverTimestamp() });
  return url;
}

export async function removeBannerForAudience(audience: BannerAudience): Promise<void> {
  if (!db) return;
  const field = audience === "client" ? "clientImageUrl" : "trainerImageUrl";
  const snap = await getDoc(doc(db, BANNER_DOC));
  const existing = snap.exists() ? snap.data() : {};
  await setDoc(doc(db, BANNER_DOC), { ...existing, [field]: "", updatedAt: serverTimestamp() });
}

// ── Legacy compat ──────────────────────────────────────────────────────────
/** @deprecated Use getBannerSettings() instead */
export async function getBanner(): Promise<{ imageUrl: string } | null> {
  const s = await getBannerSettings();
  return { imageUrl: s.clientImageUrl };
}

/** @deprecated Use uploadBannerForAudience() instead */
export async function uploadBanner(file: File): Promise<string> {
  return uploadBannerForAudience(file, "client");
}

/** @deprecated Use removeBannerForAudience() instead */
export async function removeBanner(): Promise<void> {
  return removeBannerForAudience("client");
}
