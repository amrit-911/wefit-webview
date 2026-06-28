import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const TICKER_DOC = "settings/ticker";

export interface TickerSettings {
  /** @deprecated Use clientEnabled / trainerEnabled instead */
  enabled?: boolean;
  /** @deprecated Use clientContent / trainerContent instead */
  content?: string;

  clientEnabled: boolean;
  clientContent: string;

  trainerEnabled: boolean;
  trainerContent: string;

  updatedAt?: Date;
}

const DEFAULT: TickerSettings = {
  clientEnabled: false,
  clientContent: "",
  trainerEnabled: false,
  trainerContent: "",
};

export async function getTickerSettings(): Promise<TickerSettings> {
  if (!db) return DEFAULT;
  const snap = await getDoc(doc(db, TICKER_DOC));
  if (!snap.exists()) return DEFAULT;
  const data = snap.data();

  // Backward-compat: if old single-enabled doc exists, migrate reads
  const legacyEnabled = data.enabled ?? false;
  const legacyContent = data.content ?? "";

  return {
    clientEnabled: data.clientEnabled ?? legacyEnabled,
    clientContent: data.clientContent ?? legacyContent,
    trainerEnabled: data.trainerEnabled ?? legacyEnabled,
    trainerContent: data.trainerContent ?? legacyContent,
    updatedAt: data.updatedAt?.toDate?.(),
  };
}

export async function saveTickerSettings(
  settings: Pick<TickerSettings, "clientEnabled" | "clientContent" | "trainerEnabled" | "trainerContent">
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  await setDoc(doc(db, TICKER_DOC), { ...settings, updatedAt: serverTimestamp() });
}
