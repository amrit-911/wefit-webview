# FCM Push Notification Integration Plan

> **Goal:** When a trainer sends feedback or a subscription notification is written to Firestore,  
> the **user gets a real OS push notification** on their phone even when the app is closed.

---

## Does the Next.js Web App Need Changes?

**Yes — one small but critical addition.**

The web app currently writes notifications to Firestore perfectly (all the `createNotification` calls in `notifications.service.ts`). But it has **no knowledge of FCM tokens** — it never saves the device token, so there is no way to target a specific user's phone.

### What the web app does NOT need to change
- All the `createNotification` / `notifyUser*` functions — these are already correct and complete
- Firestore notification documents — the schema is already right
- Auth / user management — nothing changes

### What the web app DOES need (1 thing)
**Save the FCM device token to Firestore when the Flutter app starts.**  
Flutter gets the token and sends it to Firestore. The web app never calls FCM directly — that's the backend's job.

---

## Architecture: How It Works End-to-End

```
Flutter app starts
       │
       ▼
Firebase Messaging → getToken() → FCM token string
       │
       ▼
Save token to Firestore: users/{uid}/fcmToken = "abc123..."
       │
       │
Trainer does something on web app
(e.g. sends feedback, assigns plan, subscription expires)
       │
       ▼
notifications.service.ts → createNotification() → writes doc to Firestore `notifications` collection
       │
       ▼
Cloud Function (Firestore trigger) watches `notifications` collection
onCreate → reads recipientId → looks up users/{recipientId}/fcmToken
       │
       ▼
Cloud Function calls FCM Admin SDK → sends push to that token
       │
       ▼
User's phone receives OS notification (even if app is closed)
       │
       ▼
User taps notification → Flutter opens app → navigates to linkPath
```

---

## What Needs to Be Built

### 1. Firestore — Token Storage (Flutter does this)

When the Flutter app initializes and the user is logged in:

```dart
// In Flutter — run once after login
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

Future<void> saveFcmToken() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return;

  final token = await FirebaseMessaging.instance.getToken();
  if (token == null) return;

  await FirebaseFirestore.instance
      .collection('users')
      .doc(user.uid)
      .update({'fcmToken': token});

  // Refresh token if it rotates
  FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
    FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .update({'fcmToken': newToken});
  });
}
```

Call `saveFcmToken()` right after the user logs in (or on app startup if already logged in).

---

### 2. Cloud Function — Firestore Trigger (Backend)

This is the **only real new piece of infrastructure**. It watches the `notifications` collection and fires FCM when a new doc is created.

Create this as a Firebase Cloud Function:

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendPushOnNotification = functions.firestore
  .onDocumentCreated("notifications/{notifId}", async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { recipientId, title, body } = data;

    // Look up the recipient's FCM token
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(recipientId)
      .get();

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return; // user has no device registered

    // Send the push notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: title ?? "PTRB",
        body: body ?? "",
      },
      data: {
        // Pass linkPath so Flutter can navigate on tap
        linkPath: data.linkPath ?? "",
        notifId: event.params.notifId,
        type: data.type ?? "",
      },
      android: {
        notification: {
          channelId: "ptrb_default",
          priority: "high",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });
  });
```

Deploy with:
```bash
cd functions
npm install firebase-admin firebase-functions
firebase deploy --only functions
```

---

### 3. Flutter — Receive & Handle Notifications

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

// Must be top-level function (not inside a class)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // App is in background/terminated — notification shown by OS automatically
  // No code needed here unless you want custom handling
}

class _PtrbWebViewState extends State<PtrbWebView> {
  late InAppWebViewController _controller;

  @override
  void initState() {
    super.initState();
    _setupFCM();
  }

  Future<void> _setupFCM() async {
    // Register background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (iOS)
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Save token to Firestore
    await saveFcmToken();

    // App is OPEN — notification arrives as data, show manually or handle
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final linkPath = message.data['linkPath'] ?? '';
      // If you want an in-app banner when the app is open:
      // showInAppBanner(message.notification?.title, linkPath);
      // Or just navigate directly:
      if (linkPath.isNotEmpty) {
        _controller.loadUrl(
          urlRequest: URLRequest(url: WebUri("$_baseUrl$linkPath")),
        );
      }
    });

    // App was in BACKGROUND — user tapped notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final linkPath = message.data['linkPath'] ?? '';
      if (linkPath.isNotEmpty) {
        _controller.loadUrl(
          urlRequest: URLRequest(url: WebUri("$_baseUrl$linkPath")),
        );
      }
    });

    // App was TERMINATED — user tapped notification that launched app
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      final linkPath = initialMessage.data['linkPath'] ?? '';
      if (linkPath.isNotEmpty) {
        // Slight delay to let WebView fully load first
        Future.delayed(const Duration(seconds: 2), () {
          _controller.loadUrl(
            urlRequest: URLRequest(url: WebUri("$_baseUrl$linkPath")),
          );
        });
      }
    }
  }
}
```

---

### 4. Flutter `pubspec.yaml`

```yaml
dependencies:
  firebase_core: ^3.x.x
  firebase_messaging: ^15.x.x
  cloud_firestore: ^5.x.x
  firebase_auth: ^5.x.x
  flutter_inappwebview: ^6.1.5
  url_launcher: ^6.3.0
  permission_handler: ^11.3.0
```

---

### 5. Android Setup

**`android/app/src/main/AndroidManifest.xml`** — add inside `<application>`:

```xml
<!-- FCM default notification channel -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="ptrb_default"/>

<!-- FCM default notification icon (optional, use your app icon) -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@mipmap/ic_launcher"/>
```

**Create notification channel** in `MainActivity.kt` (or in Flutter's `main.dart`):

```dart
// In main.dart — before runApp()
if (Platform.isAndroid) {
  await FlutterLocalNotificationsPlugin()
    .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(
      const AndroidNotificationChannel(
        'ptrb_default',
        'PTRB Notifications',
        description: 'Trainer feedback, plan updates, subscription alerts',
        importance: Importance.high,
      ),
    );
}
```

---

### 6. iOS Setup

In `ios/Runner/Info.plist` (already needed from file upload section — no extra entries required for FCM beyond what's already there).

In Xcode:
1. **Signing & Capabilities** → **+ Capability** → **Push Notifications**
2. **Signing & Capabilities** → **+ Capability** → **Background Modes** → check **Remote notifications**

Upload APNs Auth Key to Firebase Console:
- Firebase Console → Project Settings → Cloud Messaging → Apple app configuration → Upload APNs Auth Key (`.p8` file from Apple Developer portal)

---

## Notification Types → Who Gets Them

From the existing `notifications.service.ts`, these are the events that should trigger a push:

| Event | Function in service | Recipient | `linkPath` |
|---|---|---|---|
| Trainer sends check-in feedback | `notifyUserCheckinFeedback` | **User** | `/daily-checkin` |
| Trainer assigns workout plan | `notifyUserPlanAssigned` | **User** | `/workouts` |
| Trainer assigns nutrition plan | `notifyUserPlanAssigned` | **User** | `/nutrition` |
| Subscription expiring | `notifySubscriptionExpiring` | **User** | `/profile` |
| Subscription expired | `notifySubscriptionExpired` | **User** | `/profile` |
| Client submits check-in | `createCheckinNotification` | **Trainer** | `/trainer/clients/{id}` |
| Client completes workout | `notifyTrainerWorkoutDone` | **Trainer** | `/trainer/clients/{id}` |
| New client assigned | `notifyAdminClientAdded` | **Admin** | `/admin/members` |

All of these already write to Firestore — the Cloud Function triggers automatically on **all of them** with zero additional changes to the web app.

---

## Summary: Who Does What

| Task | Done by |
|---|---|
| Save FCM token to `users/{uid}/fcmToken` | Flutter |
| Write notification docs to Firestore | Web app ✅ already done |
| Cloud Function to trigger FCM on Firestore write | Backend (new) |
| Receive push & navigate to `linkPath` in WebView | Flutter |
| Android notification channel setup | Flutter |
| iOS APNs key upload | Firebase Console (one-time) |

### Web app changes needed: **ZERO** ✅
The `notifications.service.ts` already writes everything correctly. The Cloud Function watches Firestore and does the heavy lifting. The Flutter app just needs to save its token once and handle incoming messages.

---

*Plan for PTRB project — FCM integration via Firestore trigger pattern*
