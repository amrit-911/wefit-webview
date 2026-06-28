import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ─── Daily Check-In ──────────────────────────────────────────────────────────

export interface CheckinData {
  id?: string;
  userId: string;
  trainerId?: string;
  date: string; // "YYYY-MM-DD"
  createdAt?: Date;

  // Legacy
  weight?: number;
  mood?: string;
  energy?: number;
  notes?: string;
  trainerFeedback?: string;
  feedbackAt?: Date;

  // New fields
  trainingSession?: string;       // What training session did you do?
  trainingRating?: number;        // 1-10
  trainingRatingNote?: string;    // If not 10/10, why?
  cardio?: string;                // Cardio details
  nutrition?: number;             // 1-10
  nutritionNote?: string;         // If not 10/10, why?
  hunger?: number;                // 1-10
  steps?: string;                 // Steps count
  waterIntake?: string;           // Water intake
  sleep?: string;                 // Sleep hours
  energyLevel?: number;           // 1-10
  motivation?: number;            // 1-10
  note?: string;                  // General note
}

// ─── Period (3d / 7d / 14d / 30d) Check-In ──────────────────────────────────

export type PeriodType = "3days" | "7days" | "14days" | "1month";

export interface PeriodCheckinData {
  id?: string;
  userId: string;
  trainerId?: string;
  date: string;          // "YYYY-MM-DD" (start date of the period)
  period: PeriodType;
  createdAt?: Date;

  // Section: Basic
  weight?: string;
  photoUrls?: string[];

  // Section: Training & Nutrition adherence
  trainingAdherence?: number;     // 1-10
  trainingAdherenceNote?: string;
  nutritionAdherence?: number;    // 1-10
  nutritionAdherenceNote?: string;

  // Section: Open questions
  recoveryAndMotivation?: string;
  littleWins?: string;
  goalsNextWeek?: string;
  whatCanIDo?: string;
  unsureAbout?: string;
  anythingElse?: string;

  // Section: Scale ratings
  hunger?: number;       // 1-10
  energy?: number;       // 1-10
  fatigue?: number;      // 1-10
  stress?: number;       // 1-10
  recovery?: number;     // 1-10
  digestion?: number;    // 1-10
  qualityOfSleep?: number; // 1-10

  trainerFeedback?: string;
  feedbackAt?: Date;
}

import { getLocalDateString } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return getLocalDateString(date);
}

// ─── Daily Check-In functions ─────────────────────────────────────────────────

/**
 * Submit a daily check-in. Document ID = userId_YYYY-MM-DD for idempotency.
 */
export async function submitCheckin(
  userId: string,
  data: Omit<CheckinData, "id" | "userId" | "date" | "createdAt">
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const today = toDateString(new Date());
  const docId = `${userId}_${today}`;
  const ref = doc(db, "checkins", docId);
  await setDoc(ref, {
    userId,
    trainerId: data.trainerId ?? null,
    date: today,
    createdAt: serverTimestamp(),

    // Legacy
    weight: data.weight ?? null,
    mood: data.mood ?? null,
    energy: data.energy ?? null,
    notes: data.notes ?? null,

    // New fields
    trainingSession: data.trainingSession ?? null,
    trainingRating: data.trainingRating ?? null,
    trainingRatingNote: data.trainingRatingNote ?? null,
    cardio: data.cardio ?? null,
    nutrition: data.nutrition ?? null,
    nutritionNote: data.nutritionNote ?? null,
    hunger: data.hunger ?? null,
    steps: data.steps ?? null,
    waterIntake: data.waterIntake ?? null,
    sleep: data.sleep ?? null,
    energyLevel: data.energyLevel ?? null,
    motivation: data.motivation ?? null,
    note: data.note ?? null,
  });
}

/**
 * Check if today's check-in already exists.
 */
export async function getTodayCheckin(userId: string): Promise<CheckinData | null> {
  if (!db) return null;
  const today = toDateString(new Date());
  const docId = `${userId}_${today}`;
  const ref = doc(db, "checkins", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    userId: d.userId,
    trainerId: d.trainerId,
    weight: d.weight,
    mood: d.mood,
    energy: d.energy,
    notes: d.notes,
    date: d.date,
    createdAt: (d.createdAt as Timestamp)?.toDate(),
    trainingSession: d.trainingSession,
    trainingRating: d.trainingRating,
    trainingRatingNote: d.trainingRatingNote,
    cardio: d.cardio,
    nutrition: d.nutrition,
    nutritionNote: d.nutritionNote,
    hunger: d.hunger,
    steps: d.steps,
    waterIntake: d.waterIntake,
    sleep: d.sleep,
    energyLevel: d.energyLevel,
    motivation: d.motivation,
    note: d.note,
  };
}

/**
 * Get all check-ins for a user (for calendar view), newest first, last 60 days.
 */
export async function getCheckins(userId: string): Promise<CheckinData[]> {
  if (!db) return [];
  const q = query(
    collection(db, "checkins"),
    where("userId", "==", userId),
    limit(60)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({
    id: d.id,
    userId: d.data().userId,
    trainerId: d.data().trainerId,
    weight: d.data().weight,
    mood: d.data().mood,
    energy: d.data().energy,
    notes: d.data().notes,
    date: d.data().date,
    createdAt: (d.data().createdAt as Timestamp)?.toDate(),
    trainerFeedback: d.data().trainerFeedback ?? "",
    feedbackAt: (d.data().feedbackAt as Timestamp)?.toDate(),
    trainingSession: d.data().trainingSession,
    trainingRating: d.data().trainingRating,
    trainingRatingNote: d.data().trainingRatingNote,
    cardio: d.data().cardio,
    nutrition: d.data().nutrition,
    nutritionNote: d.data().nutritionNote,
    hunger: d.data().hunger,
    steps: d.data().steps,
    waterIntake: d.data().waterIntake,
    sleep: d.data().sleep,
    energyLevel: d.data().energyLevel,
    motivation: d.data().motivation,
    note: d.data().note,
  }));
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get the latest check-in for a user — used by trainer overview.
 */
export async function getLatestCheckin(userId: string): Promise<CheckinData | null> {
  if (!db) return null;
  const q = query(
    collection(db, "checkins"),
    where("userId", "==", userId),
    limit(10)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const sorted = snap.docs
    .map((d) => ({
      id: d.id,
      userId: d.data().userId,
      trainerId: d.data().trainerId,
      weight: d.data().weight,
      mood: d.data().mood,
      energy: d.data().energy,
      notes: d.data().notes,
      date: d.data().date,
      createdAt: (d.data().createdAt as Timestamp)?.toDate(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0];
}

/**
 * Save trainer feedback on a DAILY check-in document.
 */
export async function saveCheckinFeedback(
  checkinId: string,
  feedback: string
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const { doc: fsDoc, setDoc, serverTimestamp: st } = await import("firebase/firestore");
  const ref = fsDoc(db, "checkins", checkinId);
  await setDoc(ref, { trainerFeedback: feedback, feedbackAt: st() }, { merge: true });
}

/**
 * Save trainer feedback on a PERIOD check-in document (period_checkins collection).
 */
export async function savePeriodCheckinFeedback(
  checkinId: string,
  feedback: string
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const { doc: fsDoc, setDoc, serverTimestamp: st } = await import("firebase/firestore");
  const ref = fsDoc(db, "period_checkins", checkinId);
  await setDoc(ref, { trainerFeedback: feedback, feedbackAt: st() }, { merge: true });
}

// ─── Period Check-In functions ────────────────────────────────────────────────

/**
 * Submit a period (3/7/14/30-day) check-in.
 * Document ID = userId_YYYY-MM-DD_period for idempotency per-date.
 */
export async function submitPeriodCheckin(
  userId: string,
  data: Omit<PeriodCheckinData, "id" | "userId" | "createdAt">
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const docId = `${userId}_${data.date}_${data.period}`;
  const ref = doc(db, "period_checkins", docId);
  await setDoc(ref, {
    userId,
    trainerId: data.trainerId ?? null,
    date: data.date,
    period: data.period,
    createdAt: serverTimestamp(),

    weight: data.weight ?? null,
    photoUrls: data.photoUrls ?? [],

    trainingAdherence: data.trainingAdherence ?? null,
    trainingAdherenceNote: data.trainingAdherenceNote ?? null,
    nutritionAdherence: data.nutritionAdherence ?? null,
    nutritionAdherenceNote: data.nutritionAdherenceNote ?? null,

    recoveryAndMotivation: data.recoveryAndMotivation ?? null,
    littleWins: data.littleWins ?? null,
    goalsNextWeek: data.goalsNextWeek ?? null,
    whatCanIDo: data.whatCanIDo ?? null,
    unsureAbout: data.unsureAbout ?? null,
    anythingElse: data.anythingElse ?? null,

    hunger: data.hunger ?? null,
    energy: data.energy ?? null,
    fatigue: data.fatigue ?? null,
    stress: data.stress ?? null,
    recovery: data.recovery ?? null,
    digestion: data.digestion ?? null,
    qualityOfSleep: data.qualityOfSleep ?? null,
  });
}

/**
 * Get all period check-ins for a user.
 */
export async function getPeriodCheckins(userId: string): Promise<PeriodCheckinData[]> {
  if (!db) return [];
  const q = query(
    collection(db, "period_checkins"),
    where("userId", "==", userId),
    limit(30)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PeriodCheckinData, "id">),
    createdAt: (d.data().createdAt as Timestamp)?.toDate(),
    feedbackAt: (d.data().feedbackAt as Timestamp)?.toDate(),
  }));
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export { toDateString };

/**
 * Get a single daily check-in by document ID.
 */
export async function getCheckinById(checkinId: string): Promise<CheckinData | null> {
  if (!db) return null;
  const ref = doc(db, "checkins", checkinId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    userId: d.userId,
    trainerId: d.trainerId,
    weight: d.weight,
    mood: d.mood,
    energy: d.energy,
    notes: d.notes,
    date: d.date,
    createdAt: (d.createdAt as Timestamp)?.toDate(),
    trainerFeedback: d.trainerFeedback ?? "",
    feedbackAt: (d.feedbackAt as Timestamp)?.toDate(),
    trainingSession: d.trainingSession,
    trainingRating: d.trainingRating,
    trainingRatingNote: d.trainingRatingNote,
    cardio: d.cardio,
    nutrition: d.nutrition,
    nutritionNote: d.nutritionNote,
    hunger: d.hunger,
    steps: d.steps,
    waterIntake: d.waterIntake,
    sleep: d.sleep,
    energyLevel: d.energyLevel,
    motivation: d.motivation,
    note: d.note,
  };
}

/**
 * Get a single period check-in by document ID.
 */
export async function getPeriodCheckinById(checkinId: string): Promise<PeriodCheckinData | null> {
  if (!db) return null;
  const ref = doc(db, "period_checkins", checkinId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...(snap.data() as Omit<PeriodCheckinData, "id">),
    createdAt: (snap.data().createdAt as Timestamp)?.toDate(),
    feedbackAt: (snap.data().feedbackAt as Timestamp)?.toDate(),
  };
}

/**
 * Get period check-ins for a client filtered by period type.
 */
export async function getPeriodCheckinsByPeriod(
  userId: string,
  period: PeriodType
): Promise<PeriodCheckinData[]> {
  if (!db) return [];
  const q = query(
    collection(db, "period_checkins"),
    where("userId", "==", userId),
    where("period", "==", period),
    limit(30)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PeriodCheckinData, "id">),
    createdAt: (d.data().createdAt as Timestamp)?.toDate(),
    feedbackAt: (d.data().feedbackAt as Timestamp)?.toDate(),
  }));
  return results.sort((a, b) => b.date.localeCompare(a.date));
}
