import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WorkoutSetLog {
  kg: string;
  reps: string;
}

export interface WorkoutExerciseLog {
  name: string;
  setLogs: WorkoutSetLog[];
}

export interface WorkoutLog {
  id?: string;
  userId: string;
  dayNumber: number;
  dayLabel: string;
  dayHeader?: string;
  exercises: WorkoutExerciseLog[];
  steps?: number;
  stepsDone?: boolean;
  date: string; // YYYY-MM-DD
  loggedAt?: Date;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Save a workout log entry to Firestore. Returns the new doc ID. */
export async function saveWorkoutLog(
  log: Omit<WorkoutLog, "id" | "loggedAt">
): Promise<string> {
  if (!db) throw new Error("Firebase not initialized");
  const ref = await addDoc(collection(db, "workoutLogs"), {
    ...stripUndefined(log as unknown as Record<string, unknown>),
    loggedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Fetch all workout logs for a user, newest first. */
export async function getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  if (!db) return [];
  const q = query(
    collection(db, "workoutLogs"),
    where("userId", "==", userId),
    orderBy("loggedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    loggedAt: (d.data().loggedAt as Timestamp)?.toDate(),
  })) as WorkoutLog[];
}

/** Fetch a single workout log by its Firestore document ID. */
export async function getWorkoutLogById(logId: string): Promise<WorkoutLog | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "workoutLogs", logId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), loggedAt: (snap.data().loggedAt as Timestamp)?.toDate() } as WorkoutLog;
}

/** Fetch only the most recent workout log for a user. */
export async function getLastWorkoutLog(userId: string): Promise<WorkoutLog | null> {
  if (!db) return null;
  const q = query(
    collection(db, "workoutLogs"),
    where("userId", "==", userId),
    orderBy("loggedAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data(), loggedAt: (d.data().loggedAt as Timestamp)?.toDate() } as WorkoutLog;
}
