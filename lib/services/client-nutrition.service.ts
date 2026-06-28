import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export interface NutritionItem {
  name: string;
  quantity: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  /** Optional preparation / description note set by trainer */
  note?: string;
}

export interface MealSection {
  meal: string;
  emoji: string;
  items: NutritionItem[];
}

export interface DayNutrition {
  meals: MealSection[];
}

/** A supplement assigned by the trainer to a client's nutrition plan */
export interface AssignedSupplement {
  /** ID from the supplements library */
  id: string;
  name: string;
  brand?: string;
  dosage?: string;
  frequency?: string;
  usageTiming?: string;
  /** Trainer's custom note for this client */
  note?: string;
}

export interface ClientNutritionPlan {
  id?: string;
  clientId: string;
  trainerId: string;
  /** Separate plans per day type */
  workoutDay: DayNutrition;
  offDay: DayNutrition;
  /** Daily water target in Liters set by trainer */
  waterTargetLiters?: number;
  /** Supplements assigned by trainer */
  supplements?: AssignedSupplement[];
  /** Legacy flat meals — kept for backwards compat reads */
  meals?: MealSection[];
  assignedAt?: Date;
  updatedAt?: Date;
}

// ─── Default empty day (used only as initial state in new plans) ───────────
export const EMPTY_DAY: DayNutrition = { meals: [] };

// Legacy constants kept for any remaining imports — now empty arrays
export const WORKOUT_DAY_MEALS: MealSection[] = [];
export const OFF_DAY_MEALS: MealSection[] = [];

/** Default meal names created for every new client */
export const DEFAULT_MEAL_NAMES = [
  "Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5", "Meal 6", "Meal 7",
  "Pre-Workout", "Post Workout",
];

function buildDefaultDay(): DayNutrition {
  return {
    meals: DEFAULT_MEAL_NAMES.map((name) => ({ meal: name, emoji: "🍽️", items: [] })),
  };
}

/**
 * Create a default nutrition plan for a newly created client.
 * Sets up empty meal slots for both workout and off days.
 */
export async function createDefaultNutritionPlan(
  clientId: string,
  trainerId: string
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = doc(db, "clientNutritionPlans", clientId);
  const day = buildDefaultDay();
  await setDoc(ref, {
    clientId,
    trainerId,
    workoutDay: sanitizeDay(day),
    offDay: sanitizeDay(day),
    waterTargetLiters: null,
    supplements: [],
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}


/**
 * Strip top-level keys whose value is `undefined` so Firestore doesn't reject them.
 * Works one level deep — sufficient for our supplement and food-item objects.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/** Sanitize a DayNutrition so no meal or NutritionItem has undefined fields. */
function sanitizeDay(day: DayNutrition): DayNutrition {
  return {
    meals: day.meals.map((meal) => {
      const { items, ...mealRest } = meal;
      return {
        ...stripUndefined(mealRest as unknown as Record<string, unknown>),
        items: items.map((item) => stripUndefined(item as unknown as Record<string, unknown>) as unknown as NutritionItem),
      } as MealSection;
    }),
  };
}

/** Sanitize an AssignedSupplement array. */
function sanitizeSupplements(supps: AssignedSupplement[]): Record<string, unknown>[] {
  return supps.map((s) => stripUndefined(s as unknown as Record<string, unknown>));
}

/**
 * Generate the next sequential meal name given existing meals.
 * e.g. [] → "Meal 1", ["Meal 1"] → "Meal 2"
 */
export function nextMealName(meals: MealSection[]): string {
  return `Meal ${meals.length + 1}`;
}

/**
 * Get the nutrition plan for a client.
 */
export async function getClientNutritionPlan(
  clientId: string
): Promise<ClientNutritionPlan | null> {
  if (!db) return null;
  const ref = doc(db, "clientNutritionPlans", clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Dynamic meals: return stored meals exactly as-is (no template merging)
  let workoutDay: DayNutrition = { meals: [] };
  let offDay: DayNutrition = { meals: [] };

  if (data.workoutDay) {
    workoutDay = data.workoutDay as DayNutrition;
  } else if (data.meals) {
    // Migrate old flat meals into workoutDay
    workoutDay = { meals: data.meals as MealSection[] };
  }

  if (data.offDay) {
    offDay = data.offDay as DayNutrition;
  }

  return {
    id: snap.id,
    clientId: data.clientId,
    trainerId: data.trainerId,
    workoutDay,
    offDay,
    waterTargetLiters: data.waterTargetLiters ?? undefined,
    supplements: data.supplements ?? [],
    assignedAt: data.assignedAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

/**
 * Save (merge update) a nutrition plan — includes water target and supplements.
 */
export async function saveClientNutritionPlan(
  clientId: string,
  trainerId: string,
  workoutDay: DayNutrition,
  offDay: DayNutrition,
  waterTargetLiters?: number,
  supplements?: AssignedSupplement[]
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = doc(db, "clientNutritionPlans", clientId);
  await setDoc(
    ref,
    {
      clientId,
      trainerId,
      workoutDay: sanitizeDay(workoutDay),
      offDay: sanitizeDay(offDay),
      waterTargetLiters: waterTargetLiters ?? null,
      supplements: sanitizeSupplements(supplements ?? []),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Assign a fresh nutrition plan.
 */
export async function assignClientNutritionPlan(
  clientId: string,
  trainerId: string,
  workoutDay: DayNutrition,
  offDay: DayNutrition,
  waterTargetLiters?: number,
  supplements?: AssignedSupplement[]
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = doc(db, "clientNutritionPlans", clientId);
  await setDoc(ref, {
    clientId,
    trainerId,
    workoutDay: sanitizeDay(workoutDay),
    offDay: sanitizeDay(offDay),
    waterTargetLiters: waterTargetLiters ?? null,
    supplements: sanitizeSupplements(supplements ?? []),
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─── Water Tracking (client-side progress log) ─────────────────────────────

/** Returns today's date string as YYYY-MM-DD in local time, used as doc key. */
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Get today's water intake (in liters) for a user.
 * Stored in Firestore: waterLogs/{userId}_{date}
 */
export async function getWaterLog(userId: string): Promise<number> {
  if (!db) return 0;
  const ref = doc(db, "waterLogs", `${userId}_${todayKey()}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  // Support both legacy "glasses" field and new "liters" field
  const data = snap.data();
  if (data.liters !== undefined) return data.liters;
  // Legacy: convert glasses to liters (1 glass = 0.25L)
  return (data.glasses ?? 0) * 0.25;
}

/**
 * Update today's water intake in liters for a user.
 */
export async function setWaterLog(userId: string, liters: number): Promise<void> {
  if (!db) return;
  const ref = doc(db, "waterLogs", `${userId}_${todayKey()}`);
  await setDoc(ref, {
    userId,
    date: todayKey(),
    liters,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Meal Check-off Tracking ───────────────────────────────────────────────────
//  Stored in Firestore: mealLogs/{userId}_{date}
//  Shape: { userId, date, workout: string[], off: string[] }
//  Keys are "{mealIndex}_{itemIndex}" e.g. "0_1"

export interface MealLog {
  workout: string[];   // checked item keys for workout day
  off: string[];       // checked item keys for off day
  completed?: boolean; // true once client hits "Complete Day"
  comment?: string;    // optional note from client submitted with the log
}

/** Get today's meal check-off log for a user. */
export async function getMealLog(userId: string): Promise<MealLog> {
  if (!db) return { workout: [], off: [], completed: false, comment: "" };
  const ref = doc(db, "mealLogs", `${userId}_${todayKey()}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { workout: [], off: [], completed: false, comment: "" };
  const data = snap.data();
  return {
    workout: data.workout ?? [],
    off: data.off ?? [],
    completed: data.completed ?? false,
    comment: data.comment ?? "",
  };
}

/** Save today's meal check-off log for a user. */
export async function setMealLog(userId: string, log: MealLog): Promise<void> {
  if (!db) return;
  const ref = doc(db, "mealLogs", `${userId}_${todayKey()}`);
  const payload: Record<string, unknown> = {
    userId,
    date: todayKey(),
    workout: log.workout,
    off: log.off,
    updatedAt: serverTimestamp(),
  };
  if (log.completed !== undefined) payload.completed = log.completed;
  if (log.comment !== undefined) payload.comment = log.comment;
  await setDoc(ref, payload, { merge: true });
}

export interface MealLogEntry extends MealLog {
  date: string;
}

/**
 * Fetch all meal log entries for a user — sorted client-side to avoid composite index.
 * Returns entries sorted by date descending.
 */
export async function getMealLogHistory(userId: string): Promise<MealLogEntry[]> {
  if (!db) return [];
  const q = query(
    collection(db, "mealLogs"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => {
    const data = d.data();
    return {
      date: data.date ?? "",
      workout: data.workout ?? [],
      off: data.off ?? [],
      comment: data.comment ?? "",
    };
  });
  // Sort client-side — no composite index required
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Fetch the meal log for a specific date for a user.
 */
export async function getMealLogByDate(userId: string, date: string): Promise<MealLog> {
  if (!db) return { workout: [], off: [], comment: "" };
  const ref = doc(db, "mealLogs", `${userId}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { workout: [], off: [], comment: "" };
  const data = snap.data();
  return { workout: data.workout ?? [], off: data.off ?? [], comment: data.comment ?? "" };
}

/**
 * Fetch the water log for a specific date for a user.
 */
export async function getWaterLogByDate(userId: string, date: string): Promise<number> {
  if (!db) return 0;
  const ref = doc(db, "waterLogs", `${userId}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  const data = snap.data();
  if (data.liters !== undefined) return data.liters;
  return (data.glasses ?? 0) * 0.25;
}
