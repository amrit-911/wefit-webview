# WeFit — Firebase Integration Plan
> Generated: March 14, 2026  
> Status: Pre-implementation planning document

---

## 1. Current State Analysis

### What's Already Built (Admin Side — Real Firebase)
The admin side is **already connected to Firestore** via service files:

| Collection | Service File | Status |
|---|---|---|
| `users` | `members.service.ts` | ✅ Real Firestore — `addMemberWithAuth` creates Firebase Auth + doc |
| `trainers` | `trainers.service.ts` | ✅ Real Firestore — `addTrainerWithAuth` creates Auth + `trainers/` + `users/` |
| `subscriptions` | `subscriptions.service.ts` | ✅ Real Firestore |
| `workout_plans` | `workout-plans.service.ts` | ✅ Real Firestore (library, not per-client) |
| `exercises` | `exercises.service.ts` | ✅ Real Firestore (exercise library) |
| `nutrition_items` | `nutrition.service.ts` | ✅ Real Firestore (food library) |

### What's Still Mock Data (Trainer + User Side)
| Screen | Mock Data Location | Needs Real Data |
|---|---|---|
| Trainer home (`/trainer`) | Hardcoded name "Eswar G", stats, client list | ✅ |
| Trainer clients list (`/trainer/clients`) | Hardcoded array | ✅ |
| Client detail page (`/trainer/clients/[id]`) | Hardcoded "Ajay Kumar" | ✅ |
| Workouts tab (`workouts-tab.tsx`) | Hardcoded plan | ✅ |
| Assign Workout (`assign-workout/page.tsx`) | Hardcoded days | ✅ |
| Exercise Builder (`exercise-builder/page.tsx`) | Hardcoded exercises | ✅ |
| Nutrition tab (`nutrition-tab.tsx`) | Hardcoded meals | ✅ |
| Assign Nutrition (`assign-nutrition/page.tsx`) | Hardcoded meals | ✅ |
| Add Food (`add-food/page.tsx`) | No save | ✅ |
| Progress tab (`progress-tab.tsx`) | Hardcoded weights/calendar | ✅ |
| Notifications (`/trainer/notifications`) | Hardcoded array | ✅ |
| User main page (`/main`) | Hardcoded name "Eswar G" | ✅ |
| User daily check-in | Hardcoded calendar | ✅ |

---

## 2. Inconsistencies Found

### 2.1 Add Client — Trainer vs Admin
**Problem:** Trainer's Add Client form (`/trainer/clients/add`) is missing fields that admin has:
- ❌ No `tempPassword` field (client can't log in without one)
- ❌ No `plan` selector (1, 3, 6, 9, 12 months)
- ❌ No `gender` field
- ❌ No `dob` field
- ❌ No `height` field
- ❌ No `startDate` (subscription start)
- ❌ No `trainerAssignment` (when trainer adds a client, the client should be auto-linked to that trainer)

**Fix:** Trainer's add client form needs these additional fields AND must call the same `addMemberWithAuth()` service that admin uses, but also automatically set `trainerId = currentTrainer.uid`.

### 2.2 Member doc structure — `users/` vs `trainers/`
**Problem:** Admin creates members in `users/{uid}` collection. But there is a separate `trainers/{uid}` collection for trainers. When trainer logs in, their profile is in **both** `trainers/{uid}` AND `users/{uid}` (just for routing).

**Trainer home page needs:** `trainers/{trainerUid}` to show real name, stats.
**User home page needs:** `users/{userUid}` to show real name.

### 2.3 Workout Plan assignment — No per-client storage
**Problem:** `workout_plans` collection stores **template plans** (library). But when a trainer **assigns** a workout to a specific client, there is no collection storing that assignment.

**Currently:** The assign-workout page just calls `router.back()` — nothing is saved.

**Fix:** Need a new subcollection or document structure (see Section 3).

### 2.4 Nutrition assignment — No per-client storage
Same problem as workouts. `nutrition_items` is a food **library**. There is no structure for "Trainer assigned THIS meal plan to THIS client."

### 2.5 Daily Check-in — No Firestore write
User's daily check-in page has hardcoded calendar. Nothing is saved to Firestore. 
The trainer's progress tab reads from nowhere — it's all mock data.

### 2.6 Notifications — Completely mock
Trainer notifications are a hardcoded static array. No real-time connection, no routing logic (trainer sees clients assigned to them, admin sees unassigned users).

### 2.7 Subscription — Stored separately, not linked to user doc
`subscriptions` collection stores subscription records. But `users/{uid}` also has `plan` and `membershipEnd` fields. These two can get out of sync.

**Fix:** Single source of truth — subscription data lives in `subscriptions/{subId}` with `memberId` linking to user. The `users/{uid}` doc just stores a `activeSubscriptionId` reference.

---

## 3. Proposed Firestore Schema

### 3.1 `users/{uid}` — All users (members, trainers, admins)
```
users/{uid}
  uid: string
  name: string
  email: string
  phone: string
  role: "user" | "trainer" | "admin" | "pending_trainer" | "rejected_trainer"
  
  // Onboarding (users only)
  onboardingComplete: boolean
  onboarding: {
    goal: string              // "lose_weight" | "build_muscle" | "stay_active" | "improve_health"
    gender: string            // "male" | "female"
    age: number
    height: number            // cm
    weight: number            // kg (starting)
    goalWeight: number        // kg
    fitnessLevel: string      // "beginner" | "intermediate" | "advanced"
    completedAt: Timestamp
  }
  
  // Profile
  avatar: string              // Storage URL or ""
  dob: string                 // "DD/MM/YYYY"
  gender: string
  country: string
  
  // Fitness data (users only)
  currentWeight: number
  goalWeight: number
  height: number
  
  // Trainer link (users only)
  trainerId: string | null    // uid of assigned trainer, null = not assigned (admin manages)
  
  // Subscription reference (users only)
  activeSubscriptionId: string | null
  plan: string                // "1 Month" | "3 Months" etc. (denormalized for quick reads)
  membershipEnd: string       // "DD/MM/YYYY" (denormalized)
  
  // Status
  status: "Active" | "Inactive" | "Suspended"
  
  createdAt: Timestamp
  updatedAt: Timestamp
```

### 3.2 `trainers/{uid}` — Trainer profiles (uid matches users/{uid})
```
trainers/{uid}
  uid: string
  name: string
  email: string
  phone: string
  specialization: string
  experience: string
  status: "Active" | "Inactive" | "Pending"
  gender: string
  dob: string
  country: string
  height: number
  weight: number
  avatar: string
  certificate: string         // Storage URL
  proofId: string             // Storage URL
  ptInsurance: string         // Storage URL
  language: string
  address: string
  periodOfAccess: string
  
  // Derived/cached stats (updated by Cloud Functions or on write)
  clientCount: number
  
  createdAt: Timestamp
  updatedAt: Timestamp
```

### 3.3 `subscriptions/{subId}` — Subscription records
```
subscriptions/{subId}
  memberId: string            // users/{uid}
  memberName: string          // denormalized
  trainerId: string | null    // assigned trainer uid
  plan: string                // "1 Month" | "3 Months" | "6 Months" | "9 Months" | "12 Months"
  durationMonths: number      // 1 | 3 | 6 | 9 | 12
  amount: number              // ₹ paid
  startDate: Timestamp
  endDate: Timestamp
  status: "Active" | "Expired" | "Pending" | "Cancelled"
  createdAt: Timestamp
  createdBy: string           // uid of admin/trainer who created it
```

### 3.4 `clientWorkoutPlans/{planId}` — Per-client assigned workout ⭐ NEW
```
clientWorkoutPlans/{planId}
  clientId: string            // users/{uid}
  trainerId: string           // trainers/{uid}
  assignedAt: Timestamp
  updatedAt: Timestamp
  
  days: [                     // Array of day objects
    {
      dayNumber: number       // 1-6
      label: string           // "Push Day - Chest & Shoulders"
      isRestDay: boolean
      exercises: [
        {
          name: string
          sets: number
          reps: number
          restTime: string    // "90s"
          note: string        // optional
        }
      ]
    }
  ]
```

### 3.5 `clientNutritionPlans/{planId}` — Per-client assigned nutrition ⭐ NEW
```
clientNutritionPlans/{planId}
  clientId: string
  trainerId: string
  assignedAt: Timestamp
  updatedAt: Timestamp
  
  meals: [
    {
      mealType: "Breakfast" | "Lunch" | "Snacks" | "Dinner"
      items: [
        {
          name: string
          quantity: string    // "90g" or ""
          calories: number
          protein: number     // grams
          carbs: number       // grams
          fats: number        // grams (optional)
        }
      ]
    }
  ]
  
  dailyTotals: {              // computed on save
    calories: number
    protein: number
    carbs: number
  }
```

### 3.6 `checkins/{checkinId}` — Daily check-in by user ⭐ NEW
```
checkins/{checkinId}
  userId: string
  trainerId: string | null    // for routing notifications
  date: string                // "2026-03-14" (ISO date, used as unique key per user per day)
  
  weight: number              // kg
  energyLevel: number         // 1-10
  mood: string                // "great" | "good" | "okay" | "tired"
  note: string                // user's text note
  photos: string[]            // Storage URLs (optional)
  workoutCompleted: boolean
  
  createdAt: Timestamp
```

### 3.7 `notifications/{notifId}` — Notifications ⭐ NEW
```
notifications/{notifId}
  type: "workout_completed" | "checkin_submitted" | "weight_updated" 
       | "workout_missed" | "checkin_with_photos" | "streak_achieved"
       | "plan_expiring" | "plan_expired"
  
  // Who it's for
  recipientId: string         // trainer uid OR admin uid
  recipientRole: "trainer" | "admin"
  
  // Who triggered it
  actorId: string             // user uid who did the action
  actorName: string           // denormalized for display
  
  // Context
  title: string               // "Ajay Kumar Completed Today's Workout"
  relatedId: string           // checkin id / subscription id etc.
  relatedType: string         // "checkin" | "subscription" | "workout"
  
  read: boolean
  createdAt: Timestamp
```

---

## 4. Notification Routing Rules

```
User has trainerId assigned?
  YES → notification goes to: notifications/{id} where recipientId = trainerId
  NO  → notification goes to: notifications/{id} where recipientRole = "admin"

Critical actions that generate notifications:
  1. User submits daily check-in              → type: "checkin_submitted"
  2. User marks workout as completed          → type: "workout_completed"
  3. User updates weight                      → type: "weight_updated"
  4. User misses workout (day passed, no log) → type: "workout_missed"  [server-side/scheduled]
  5. User submits check-in with photos        → type: "checkin_with_photos"
  6. User achieves N-day streak               → type: "streak_achieved"
  7. Subscription expiring in 5 days          → type: "plan_expiring"   [server-side/scheduled]
  8. Subscription expired                     → type: "plan_expired"    [server-side/scheduled]
```

> **Note:** Items 4, 7, 8 require Firebase Cloud Functions (scheduled). Items 1-3, 5-6 are triggered client-side on user action.

---

## 5. Implementation Phases

### Phase 1 — Auth & Profile (Read real data) 
**Goal:** Replace hardcoded names with real user data everywhere.

**Files to update:**
- `providers/auth-provider.tsx` — already reads `users/{uid}`. Expose `displayName` from context.
- `app/trainer/page.tsx` — read `trainers/{uid}` for trainer name, avatar
- `app/(user)/main/page.tsx` — read `users/{uid}` for user name, goal, stats
- `app/trainer/clients/[id]/page.tsx` — read `users/{clientId}` for real client data

**New service:** `lib/services/profile.service.ts`
```typescript
getTrainerProfile(uid) → trainers/{uid}
getUserProfile(uid)    → users/{uid}
```

---

### Phase 2 — Trainer Add Client (Fix form + real save)
**Goal:** Fix the trainer's Add Client form to match admin's capability.

**Files to update:**
- `app/trainer/clients/add/page.tsx` — Add missing fields:
  - `tempPassword` (min 6 chars, show/hide toggle)
  - `plan` select: 1, 3, 6, 9, 12 months
  - `gender` select
  - `dob` input
  - `height` input
  - Auto-set `trainerId = currentUser.uid`

**Service call:** Use existing `addMemberWithAuth()` from `members.service.ts`
**Also create:** subscription record in `subscriptions/` on client add

---

### Phase 3 — Trainer Clients List (Real data)
**Goal:** Load trainer's actual clients from Firestore.

**Query:** `users` where `role == "user"` AND `trainerId == currentTrainer.uid`

**New service function in `members.service.ts`:**
```typescript
getMembersByTrainer(trainerId: string): Promise<Member[]>
```

**Files to update:**
- `app/trainer/clients/page.tsx` — replace mock array with real query

---

### Phase 4 — Workout Plan Assignment (Save + Load)
**Goal:** When trainer saves a workout plan, write to `clientWorkoutPlans/`. When workout tab loads, read from it.

**New service:** `lib/services/client-workout.service.ts`
```typescript
getClientWorkoutPlan(clientId)      → clientWorkoutPlans where clientId==x
saveClientWorkoutPlan(clientId, trainerId, days) → upsert
```

**Files to update:**
- `app/trainer/clients/[id]/workouts-tab.tsx` — load real plan
- `app/trainer/clients/[id]/assign-workout/page.tsx` — save on "Plan Assigned"
- `app/trainer/clients/[id]/exercise-builder/page.tsx` — save exercises

---

### Phase 5 — Nutrition Plan Assignment (Save + Load)
**Goal:** Same pattern as Phase 4 but for nutrition.

**New service:** `lib/services/client-nutrition.service.ts`
```typescript
getClientNutritionPlan(clientId)    → clientNutritionPlans where clientId==x
saveClientNutritionPlan(clientId, trainerId, meals) → upsert
```

**Files to update:**
- `app/trainer/clients/[id]/nutrition-tab.tsx` — load real plan
- `app/trainer/clients/[id]/assign-nutrition/page.tsx` — save on "Save & Assign"
- `app/trainer/clients/[id]/add-food/page.tsx` — add item to plan in state, pass back

---

### Phase 6 — Daily Check-in (Save + show in progress)
**Goal:** User's check-in writes to Firestore. Trainer's progress tab reads from it.

**New service:** `lib/services/checkin.service.ts`
```typescript
submitCheckin(userId, trainerId, data)  → write to checkins/
getCheckins(userId, month, year)        → read for calendar
getLatestCheckin(userId)                → for trainer overview
```

**Files to update:**
- `app/(user)/daily-checkin/page.tsx` — write to Firestore on submit
- `app/trainer/clients/[id]/progress-tab.tsx` — load real checkin dates, weight history
- `app/trainer/clients/[id]/page.tsx` (Overview tab) — show real last check-in

---

### Phase 7 — Notifications (Real Firestore)
**Goal:** Replace mock notifications with real-time Firestore reads.

**New service:** `lib/services/notifications.service.ts`
```typescript
getNotificationsForRecipient(uid)       → notifications where recipientId==uid
markNotificationRead(notifId)           → update read: true
markAllRead(uid)                        → batch update
createNotification(data)               → write new notification
getUnreadCount(uid)                     → for bell badge
```

**Trigger points (client-side):**
- On checkin submit → `createNotification({ type: "checkin_submitted", actorId, actorName, recipientId: trainerId || adminId })`
- On workout complete → `createNotification({ type: "workout_completed", ... })`
- On weight update → `createNotification({ type: "weight_updated", ... })`

**Files to update:**
- `app/trainer/notifications/page.tsx` — load real notifications with `onSnapshot` listener
- `app/trainer/page.tsx` — show real unread count on bell badge
- `app/(user)/daily-checkin/page.tsx` — trigger notification on submit
- `app/(user)/workouts/page.tsx` — trigger notification on workout complete

---

### Phase 8 — Trainer Home Stats (Real data)
**Goal:** Replace hardcoded "3 Members expiring", "4 checkins", stats grid.

**Queries:**
- Total clients: `users` where `trainerId == uid` count
- Active clients: above where `status == "Active"` count
- Pending check-ins: `checkins` where `trainerId == uid` and `createdAt > lastReviewedAt`
- Expiring soon: `subscriptions` where `trainerId == uid` and `endDate < now+5days`

---

### Phase 9 — Progress Tab (Real weight data)
**Goal:** Weight progress chart reads from check-in history.

**Data source:** `checkins` where `userId == clientId`, ordered by `date`, extract weight field.

---

## 6. Firebase Security Rules (Planned)

```
users/{uid}:
  read: uid == request.auth.uid  
        || (resource.data.trainerId == request.auth.uid)  ← trainer reads their clients
        || isAdmin()
  write: uid == request.auth.uid || isAdmin()

clientWorkoutPlans/{planId}:
  read: resource.data.clientId == request.auth.uid        ← user reads own plan
        || resource.data.trainerId == request.auth.uid    ← trainer reads plans they own
        || isAdmin()
  write: resource.data.trainerId == request.auth.uid || isAdmin()

checkins/{checkinId}:
  read: resource.data.userId == request.auth.uid
        || resource.data.trainerId == request.auth.uid
        || isAdmin()
  write: resource.data.userId == request.auth.uid

notifications/{notifId}:
  read: resource.data.recipientId == request.auth.uid || isAdmin()
  write: isAuthenticated()      ← any logged in user can create (client-side triggers)
  update: resource.data.recipientId == request.auth.uid  ← only recipient can mark read
```

---

## 7. Implementation Order (Recommended)

```
Week 1 — Foundation
  [1] Phase 1 — Show real names everywhere (auth context exposes displayName)
  [2] Phase 2 — Fix trainer Add Client form (most critical — can't function without it)
  [3] Phase 3 — Trainer clients list (load real clients)

Week 2 — Core Trainer Features  
  [4] Phase 4 — Workout plan save/load
  [5] Phase 5 — Nutrition plan save/load

Week 3 — User Engagement Loop
  [6] Phase 6 — Daily check-in saves to Firestore
  [7] Phase 7 — Notifications (the check-in triggers feed into this)

Week 4 — Polish
  [8] Phase 8 — Trainer home real stats
  [9] Phase 9 — Progress tab real weight chart
  [10] Security rules
```

---

## 8. Fields to Add to Auth Context

Currently `auth-provider.tsx` exposes: `{ user, role, loading, logout, refreshUserData }`

**Needs to also expose:**
```typescript
displayName: string       // from users/{uid}.name
trainerId: string | null  // for users: their assigned trainer (null = admin managed)
avatarUrl: string         // from users/{uid}.avatar
```

This lets every page use `const { displayName } = useAuth()` instead of making separate Firestore calls just to show the user's name.

---

## 9. Summary of New Files to Create

| File | Purpose |
|---|---|
| `lib/services/profile.service.ts` | Read trainer/user profiles |
| `lib/services/client-workout.service.ts` | Per-client workout plans CRUD |
| `lib/services/client-nutrition.service.ts` | Per-client nutrition plans CRUD |
| `lib/services/checkin.service.ts` | Daily check-in write/read |
| `lib/services/notifications.service.ts` | Notifications CRUD + real-time |
| `firestore.rules` | Security rules |

---

## 10. Quick Wins (Can do today)

These are simple changes that don't require new collections:

1. **Show real name on trainer home** — read `trainers/{uid}` on page load (1 Firestore call)
2. **Show real name on user home** — `useAuth()` already has `user.displayName` from Firebase Auth
3. **Fix trainer Add Client form** — add missing fields + call `addMemberWithAuth()` 
4. **Auto-assign trainerId** — when trainer adds client, set `trainerId = trainerUid` in the user doc

These 4 things alone would make the trainer flow actually functional end-to-end.
