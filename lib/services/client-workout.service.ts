import {
  collection, doc, getDocs, setDoc, query, where,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

/** Upload a trainer's own video for an exercise. Returns { url, storagePath }. */
export async function uploadExerciseVideo(
  clientId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; storagePath: string }> {
  if (!storage) throw new Error("Firebase Storage not initialized");
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `exerciseVideos/${clientId}/${ts}_${safeName}`;
  const ref = storageRef(storage, path);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(ref, file);
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      reject,
      () => resolve()
    );
  });

  const url = await getDownloadURL(ref);
  return { url, storagePath: path };
}


export const WORKOUT_CATEGORIES = [
  "Push",
  "Pull",
  "Legs",
  "Lower Body",
  "Upper Body",
  "Abs/Core",
  "Chest",
  "Back",
  "Shoulder",
  "Traps",
  "Biceps",
  "Triceps",
  "Cardio",
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export interface WorkoutExercise {
  name: string;
  sets: number | string;
  reps: number | string;
  repsPerSet?: string[];   // per-set target reps; length = sets count when present
  restTime: string;
  note: string;
  videoLink?: string;
  category?: WorkoutCategory | string;
}

export interface WorkoutDay {
  dayNumber: number;
  label: string;
  header?: string;       // short label shown in the circle/pill (e.g. "PUSH", "ABS")
  isRestDay: boolean;
  isRepeat?: boolean;    // when logged, cycle restarts from day 1
  exercises: WorkoutExercise[];
}

/** Returns the next workout day number after logging `currentDayNum`.
 *  If the next day has isRepeat, the repeat day is a boundary marker — skip it and restart from day 1. */
export function getNextWorkoutDay(days: WorkoutDay[], currentDayNum: number): number {
  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  if (sorted.length === 0) return 1;
  const idx = sorted.findIndex((d) => d.dayNumber === currentDayNum);
  if (idx === -1) return sorted[0].dayNumber;
  const next = sorted[(idx + 1) % sorted.length];
  if (next.isRepeat) return sorted[0].dayNumber;
  return next.dayNumber;
}

export interface ClientWorkoutPlan {
  id?: string;
  clientId: string;
  trainerId: string;
  days: WorkoutDay[];
  assignedAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "clientWorkoutPlans";

/**
 * Recursively remove `undefined` values from an object so Firestore doesn't reject them.
 * Only plain objects and arrays are traversed; class instances pass through as-is.
 */
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }
  return obj;
}


/** Get the current workout plan for a client (returns null if none assigned yet) */
export async function getClientWorkoutPlan(clientId: string): Promise<ClientWorkoutPlan | null> {
  if (!db) return null;
  const q = query(collection(db, COL), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ClientWorkoutPlan;
}

/** Save (upsert) the workout plan for a client — uses clientId as the document ID for easy lookup */
export async function saveClientWorkoutPlan(
  clientId: string,
  trainerId: string,
  days: WorkoutDay[]
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL, clientId);
  await setDoc(
    docRef,
    stripUndefined({
      clientId,
      trainerId,
      days,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
}

/** Mark the plan as newly assigned (sets assignedAt timestamp) */
export async function assignClientWorkoutPlan(
  clientId: string,
  trainerId: string,
  days: WorkoutDay[]
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL, clientId);
  await setDoc(docRef, stripUndefined({
    clientId,
    trainerId,
    days,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
}

/** Update plan-level settings (day rest toggles, etc.) without overwriting exercises */
export async function updateWorkoutPlanSettings(
  clientId: string,
  patch: Partial<Pick<ClientWorkoutPlan, "days">>
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL, clientId);
  await setDoc(
    docRef,
    stripUndefined({ ...patch, updatedAt: serverTimestamp() }),
    { merge: true }
  );
}
