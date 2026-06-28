import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type RecipientRole = "user" | "trainer" | "admin";

export type NotifType =
  // User-targeted
  | "plan_assigned"        // trainer assigned a workout/nutrition plan
  | "subscription_expiring"// subscription about to end
  | "subscription_expired" // subscription ended
  | "trainer_message"      // trainer sent a message
  // Trainer-targeted
  | "checkin"              // client submitted daily check-in
  | "period_checkin"       // client submitted a weekly/monthly (period) check-in
  | "workout"              // client completed a workout
  | "nutrition"            // client completed nutrition day
  | "weight"               // client logged weight
  | "photo"                // client uploaded a progress photo
  | "streak"               // client hit a streak
  | "missed"               // client missed a session
  | "new_client"           // admin assigned a new client
  // Admin-targeted
  | "trainer_added_client" // trainer added a new client
  | "trainer_request"      // new trainer registration submitted
  | "payment_received";    // payment/renewal received

export interface AppNotification {
  id: string;
  recipientId: string;       // uid of the person receiving
  recipientRole: RecipientRole;
  type: NotifType;
  title: string;
  body?: string;             // optional extra detail line
  read: boolean;
  actorId?: string;          // who triggered it (clientId, trainerId, etc.)
  actorName?: string;
  linkPath?: string;         // optional deep-link within the app
  createdAt?: Date;
}

// ─── Legacy alias so trainer notification page keeps working ─
export type TrainerNotification = AppNotification & {
  trainerId: string;
  clientId: string;
  clientName: string;
};

const COL = "notifications";

// ─────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────

function toAppNotification(id: string, data: any): AppNotification {
  return {
    id,
    recipientId:   data.recipientId   ?? data.trainerId ?? "",
    recipientRole: data.recipientRole ?? "trainer",
    type:          data.type as NotifType,
    title:         data.title ?? "",
    body:          data.body,
    read:          data.read ?? false,
    actorId:       data.actorId  ?? data.clientId,
    actorName:     data.actorName ?? data.clientName,
    linkPath:      data.linkPath,
    createdAt:     (data.createdAt as Timestamp)?.toDate(),
  };
}

async function createNotification(payload: Omit<AppNotification, "id" | "createdAt">): Promise<void> {
  if (!db) return;
  const ref = doc(collection(db, COL));
  await setDoc(ref, { ...payload, read: false, createdAt: serverTimestamp() });
}

// ─────────────────────────────────────────────────────────────
// Read / mark-read
// ─────────────────────────────────────────────────────────────

/** Fetch notifications for any recipient (user, trainer, or admin), newest first */
export async function getNotifications(recipientId: string): Promise<AppNotification[]> {
  if (!db) return [];

  // Query the new unified collection
  const q = query(
    collection(db, COL),
    where("recipientId", "==", recipientId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  const unified = snap.docs.map((d) => toAppNotification(d.id, d.data()));

  // Backwards-compat: also read legacy trainerNotifications for this trainer
  const legacyQ = query(
    collection(db, "trainerNotifications"),
    where("trainerId", "==", recipientId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const legacySnap = await getDocs(legacyQ).catch(() => null);
  const legacy = (legacySnap?.docs ?? []).map((d) =>
    toAppNotification(d.id, { ...d.data(), recipientId, recipientRole: "trainer" })
  );

  // Merge and re-sort
  return [...unified, ...legacy].sort((a, b) =>
    (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  ).slice(0, 50);
}

/** @deprecated Use getNotifications() instead */
export async function getTrainerNotifications(trainerId: string): Promise<AppNotification[]> {
  return getNotifications(trainerId);
}

export async function markNotificationRead(notifId: string): Promise<void> {
  if (!db) return;
  // Try new collection first, fall back to legacy
  try {
    await updateDoc(doc(db, COL, notifId), { read: true });
  } catch {
    await updateDoc(doc(db, "trainerNotifications", notifId), { read: true }).catch(() => {});
  }
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);

  const q = query(collection(db, COL), where("recipientId", "==", recipientId), where("read", "==", false));
  const snap = await getDocs(q);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));

  // Legacy
  const lq = query(collection(db, "trainerNotifications"), where("trainerId", "==", recipientId), where("read", "==", false));
  const lsnap = await getDocs(lq).catch(() => null);
  (lsnap?.docs ?? []).forEach((d) => batch.update(d.ref, { read: true }));

  await batch.commit();
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  if (!db) return 0;
  const q = query(collection(db, COL), where("recipientId", "==", recipientId), where("read", "==", false), limit(99));
  const snap = await getDocs(q);

  // Legacy
  const lq = query(collection(db, "trainerNotifications"), where("trainerId", "==", recipientId), where("read", "==", false), limit(99));
  const lsnap = await getDocs(lq).catch(() => null);

  return snap.size + (lsnap?.size ?? 0);
}

// ─────────────────────────────────────────────────────────────
// Trigger functions — USER
// ─────────────────────────────────────────────────────────────

/** Trainer assigned a workout or nutrition plan to a user */
export async function notifyUserPlanAssigned(
  userId: string,
  trainerName: string,
  planType: "workout" | "nutrition"
): Promise<void> {
  await createNotification({
    recipientId:   userId,
    recipientRole: "user",
    type:          "plan_assigned",
    title:         `New ${planType === "workout" ? "Workout" : "Nutrition"} Plan Assigned`,
    body:          `${trainerName} has assigned you a new ${planType} plan.`,
    actorName:     trainerName,
    read:          false,
    linkPath:      planType === "workout" ? "/workouts" : "/nutrition",
  });
}

/** Subscription is about to expire (call this from a scheduled check) */
export async function notifySubscriptionExpiring(
  userId: string,
  userName: string,
  daysLeft: number
): Promise<void> {
  await createNotification({
    recipientId:   userId,
    recipientRole: "user",
    type:          "subscription_expiring",
    title:         `Subscription Expiring in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
    body:          `Renew now to keep access to your plans and trainer.`,
    actorName:     userName,
    read:          false,
    linkPath:      "/profile",
  });
}

/** Subscription has expired */
export async function notifySubscriptionExpired(userId: string): Promise<void> {
  await createNotification({
    recipientId:   userId,
    recipientRole: "user",
    type:          "subscription_expired",
    title:         "Your Subscription Has Expired",
    body:          "Contact your trainer or renew to regain full access.",
    read:          false,
    linkPath:      "/profile",
  });
}

// ─────────────────────────────────────────────────────────────
// Trigger functions — TRAINER
// ─────────────────────────────────────────────────────────────

/** Client submitted a check-in */
export async function createCheckinNotification(
  trainerId: string,
  clientId: string,
  clientName: string,
  weight: number,
  mood?: string,
  energy?: number
): Promise<void> {
  const bodyParts: string[] = [];
  if (weight) bodyParts.push(`Weight: ${weight} kg`);
  if (mood) bodyParts.push(`Mood: ${mood}`);
  if (energy != null) bodyParts.push(`Energy: ${energy}/10`);

  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "checkin",
    title:         `${clientName} Completed Today's Check-In`,
    body:          bodyParts.length > 0 ? bodyParts.join(" · ") : undefined,
    actorId:       clientId,
    actorName:     clientName,
    read:          false,
    linkPath:      `/trainer/clients/${clientId}`,
  });
}

/** Client completed a workout */
export async function notifyTrainerWorkoutDone(
  trainerId: string,
  clientId: string,
  clientName: string,
  workoutName: string
): Promise<void> {
  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "workout",
    title:         `${clientName} Completed a Workout`,
    body:          workoutName,
    actorId:       clientId,
    actorName:     clientName,
    read:          false,
    linkPath:      `/trainer/clients/${clientId}`,
  });
}

/** Client completed their nutrition day */
export async function notifyTrainerNutritionDone(
  trainerId: string,
  clientId: string,
  clientName: string,
  dayMode: "workout" | "off"
): Promise<void> {
  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "nutrition",
    title:         `${clientName} Logged Their Nutrition`,
    body:          `${dayMode === "workout" ? "Workout" : "Off"} day nutrition completed`,
    actorId:       clientId,
    actorName:     clientName,
    read:          false,
    linkPath:      `/trainer/clients/${clientId}`,
  });
}

/** Client submitted a period (3/7/14/30-day) check-in */
export async function createPeriodCheckinNotification(
  trainerId: string,
  clientId: string,
  clientName: string,
  period: string,
  weight?: string
): Promise<void> {
  const periodLabels: Record<string, string> = {
    "3days": "3-Day",
    "7days": "7-Day",
    "14days": "14-Day",
    "1month": "Monthly",
  };
  const label = periodLabels[period] ?? period;
  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "period_checkin",
    title:         `${clientName} Submitted a ${label} Check-In`,
    body:          weight ? `Weight: ${weight} kg` : undefined,
    actorId:       clientId,
    actorName:     clientName,
    read:          false,
    linkPath:      `/trainer/clients/${clientId}`,
  });
}

/** Client missed a scheduled session */
export async function notifyTrainerMissedSession(
  trainerId: string,
  clientId: string,
  clientName: string
): Promise<void> {
  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "missed",
    title:         `${clientName} Missed a Session`,
    actorId:       clientId,
    actorName:     clientName,
    read:          false,
    linkPath:      `/trainer/clients/${clientId}`,
  });
}

/** Trainer's own subscription expiring */
export async function notifyTrainerSubscriptionExpiring(
  trainerId: string,
  daysLeft: number
): Promise<void> {
  await createNotification({
    recipientId:   trainerId,
    recipientRole: "trainer",
    type:          "subscription_expiring",
    title:         `Your Access Expires in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
    body:          "Contact the admin to renew your trainer access.",
    read:          false,
  });
}

/** Trainer left feedback on a check-in — notify the user */
export async function notifyUserCheckinFeedback(
  userId: string,
  trainerName: string,
  trainerId: string,
  checkinDate: string,
  feedback: string
): Promise<void> {
  await createNotification({
    recipientId:   userId,
    recipientRole: "user",
    type:          "trainer_message",
    title:         `Feedback from ${trainerName}`,
    body:          feedback.length > 80 ? feedback.slice(0, 80) + "…" : feedback,
    actorId:       trainerId,
    actorName:     trainerName,
    read:          false,
    linkPath:      "/checkin-reports",
  });
}

// ─────────────────────────────────────────────────────────────
// Trigger functions — ADMIN
// ─────────────────────────────────────────────────────────────

const ADMIN_RECIPIENT = "admin"; // fixed sentinel — query by recipientRole = "admin"

/** Trainer added a new client */
export async function notifyAdminTrainerAddedClient(
  trainerName: string,
  clientName: string,
  trainerId: string
): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "trainer_added_client",
    title:         `${trainerName} Added a New Client`,
    body:          `Client: ${clientName}`,
    actorId:       trainerId,
    actorName:     trainerName,
    read:          false,
    linkPath:      `/admin/trainers/${trainerId}`,
  });
}

/** Admin / trainer added a new client directly */
export async function notifyAdminClientAdded(
  clientName: string,
  plan: string,
  addedBy: string = "Admin"
): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "trainer_added_client",
    title:         "New Client Added",
    body:          `${clientName} added by ${addedBy} — Plan: ${plan}`,
    actorName:     addedBy,
    read:          false,
    linkPath:      "/admin/members",
  });
}

/** Trainer assigned/changed on a client */
export async function notifyAdminTrainerChanged(
  clientName: string,
  clientId: string,
  trainerName: string,
  trainerId: string
): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "new_client",
    title:         "Trainer Assignment Changed",
    body:          `${clientName} assigned to ${trainerName}`,
    actorId:       trainerId,
    actorName:     trainerName,
    read:          false,
    linkPath:      `/admin/members/${clientId}`,
  });
}

/** New trainer registration request submitted */
export async function notifyAdminTrainerRequest(trainerName: string, email: string): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "trainer_request",
    title:         "New Trainer Registration Request",
    body:          `${trainerName} (${email}) has applied to become a trainer.`,
    actorName:     trainerName,
    read:          false,
    linkPath:      "/admin/approvals",
  });
}

/** Admin added a new trainer account */
export async function notifyAdminTrainerAdded(trainerName: string, email: string, trainerId: string): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "trainer_request",
    title:         "New Trainer Account Created",
    body:          `${trainerName} (${email}) was added as a trainer.`,
    actorId:       trainerId,
    actorName:     trainerName,
    read:          false,
    linkPath:      `/admin/trainers/${trainerId}`,
  });
}

/** Payment/subscription renewed */
export async function notifyAdminPaymentReceived(
  memberName: string,
  plan: string
): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "payment_received",
    title:         "Subscription Renewed",
    body:          `${memberName} renewed: ${plan}`,
    actorName:     memberName,
    read:          false,
    linkPath:      "/admin/subscriptions",
  });
}

/** New user self-registered via the signup + onboarding flow */
export async function notifyAdminNewRegistration(
  userName: string,
  userId: string,
  goal: string
): Promise<void> {
  await createNotification({
    recipientId:   ADMIN_RECIPIENT,
    recipientRole: "admin",
    type:          "new_client",
    title:         "New Member Registered",
    body:          `${userName} signed up — Goal: ${goal || "Not set"}`,
    actorId:       userId,
    actorName:     userName,
    read:          false,
    linkPath:      `/admin/members`,
  });
}

// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────

export function timeAgo(date?: Date): string {
  if (!date) return "";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Icon + colour metadata for each type — used in UI */
export const NOTIF_META: Record<NotifType, { emoji: string; color: string }> = {
  plan_assigned:         { emoji: "📋", color: "#a3e635" },
  subscription_expiring: { emoji: "⏰", color: "#eab308" },
  subscription_expired:  { emoji: "🔴", color: "#ef4444" },
  trainer_message:       { emoji: "💬", color: "#3b82f6" },
  checkin:               { emoji: "✅", color: "#a3e635" },
  period_checkin:        { emoji: "🗓️", color: "#a3e635" },
  workout:               { emoji: "💪", color: "#a3e635" },
  weight:                { emoji: "⚖️", color: "#a3e635" },
  photo:                 { emoji: "📸", color: "#a3e635" },
  streak:                { emoji: "🔥", color: "#f97316" },
  missed:                { emoji: "⚠️", color: "#ef4444" },
  new_client:            { emoji: "👤", color: "#a3e635" },
  trainer_added_client:  { emoji: "👤", color: "#7367f0" },
  trainer_request:       { emoji: "📝", color: "#ff9f43" },
  payment_received:      { emoji: "💳", color: "#28c76f" },
  nutrition:             { emoji: "🥗", color: "#a3e635" },
};
