# PTRB Flutter WebView Integration Guide

> **Audience:** Flutter developer building the native shell around the PTRB Next.js web app.  
> **Web stack:** Next.js 15 App Router · TypeScript · Firebase Auth/Firestore/Storage · Tailwind CSS  
> **Storage bucket:** `ptrb-c992e.appspot.com`

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Recommended Package](#2-recommended-package)
3. [🔴 Critical — Video Playback (window.open)](#3--critical--video-playback)
4. [🔴 Critical — Firebase Storage CORS](#4--critical--firebase-storage-cors)
5. [🔴 Critical — File Upload / Camera Permissions](#5--critical--file-upload--camera-permissions)
6. [⚠️ Safe Area / Notch / Status Bar](#6-️-safe-area--notch--status-bar)
7. [⚠️ Android Hardware Back Button](#7-️-android-hardware-back-button)
8. [⚠️ Google Fonts (CDN Dependency)](#8-️-google-fonts-cdn-dependency)
9. [⚠️ JavaScript Channels (Optional)](#9-️-javascript-channels-optional)
10. [✅ What Already Works Out of the Box](#10--what-already-works-out-of-the-box)
11. [Flutter Implementation — Full Setup](#11-flutter-implementation--full-setup)
12. [Android Manifest](#12-android-manifest)
13. [iOS Info.plist](#13-ios-infoplist)
14. [Firebase Storage CORS Config](#14-firebase-storage-cors-config)
15. [Next.js Changes Required](#15-nextjs-changes-required)
16. [Deployment Checklist](#16-deployment-checklist)

---

## 1. Overview & Architecture

The PTRB web app is a **full-stack Next.js application** that handles:

- **Authentication** — Firebase Auth (email/password). Sign-up, login, onboarding flows are all web screens.
- **User roles** — `member`, `trainer`, `admin` (determined in Firestore, enforced in `lib/user-roles.ts`).
- **Navigation** — Mobile users (member + trainer) use a **bottom nav bar** with 5 tabs. All routing is client-side via `next/navigation` (`router.push`, `router.back`).
- **Media** — Profile photo uploads go to Firebase Storage. Exercise videos are YouTube/external links opened with `window.open`.

**Flutter's job:** Embed the web app in an `InAppWebView`, handle file-picker bridging, intercept video URLs, and manage OS-level permissions.

**The Flutter app should NOT replicate any UI.** All screens (login, onboarding, home, workouts, nutrition, profile) live entirely in the web app.

---

## 2. Recommended Package

Use **`flutter_inappwebview`** (not the official `webview_flutter`).

| Feature | `flutter_inappwebview` | `webview_flutter` |
|---|---|---|
| `<input type="file">` with camera | ✅ Built-in | ❌ Requires manual bridge |
| iOS WKWebView file picker | ✅ | ❌ |
| JavaScript Channels | ✅ | ✅ |
| `navigationDelegate` intercept | ✅ `shouldOverrideUrlLoading` | ✅ |
| Download listener | ✅ | ❌ |
| Android back button history | ✅ `goBack()` | Partial |

```yaml
# pubspec.yaml
dependencies:
  flutter_inappwebview: ^6.1.5
  url_launcher: ^6.3.0        # for opening video URLs externally
  permission_handler: ^11.3.0 # for camera / storage permissions
```

---

## 3. 🔴 Critical — Video Playback

### The Problem

In `app/(user)/workouts/[id]/active/page.tsx` **line 139**, the PLAY VIDEO button calls:

```typescript
window.open(currentEx.videoLink, "_blank")
```

This is the **only `window.open` / `target="_blank"` call in the entire codebase.** All other navigation is internal `router.push` within the Next.js app.

In a WebView, `window.open(..., "_blank")` is typically **blocked silently** or creates a new window with no visible result. The user taps PLAY VIDEO and nothing happens.

### The Fix — Flutter Side

Intercept this URL in `shouldOverrideUrlLoading` and launch it with `url_launcher`:

```dart
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';

InAppWebView(
  initialUrlRequest: URLRequest(
    url: WebUri("https://your-production-domain.com"),
  ),
  initialSettings: InAppWebViewSettings(
    javaScriptEnabled: true,
    allowFileAccessFromFileURLs: true,
    mediaPlaybackRequiresUserGesture: false,
    allowsInlineMediaPlayback: true, // iOS: play video inline
  ),
  shouldOverrideUrlLoading: (controller, navigationAction) async {
    final url = navigationAction.request.url?.toString() ?? "";

    // Intercept window.open("...", "_blank") — these come through as
    // navigation requests from a null/blank frame
    final isExternal = navigationAction.isForMainFrame == false ||
        url.contains("youtube.com") ||
        url.contains("youtu.be") ||
        url.contains("vimeo.com") ||
        url.contains("drive.google.com");

    if (isExternal) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return NavigationActionPolicy.CANCEL;
    }
    return NavigationActionPolicy.ALLOW;
  },
  onCreateWindow: (controller, createWindowAction) async {
    // Also catch window.open via onCreateWindow
    final url = createWindowAction.request.url?.toString() ?? "";
    if (url.isNotEmpty) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
    return true; // suppress the new window
  },
)
```

---

## 4. 🔴 Critical — Firebase Storage CORS

### The Problem

Firebase Storage uploads use `uploadBytes` + `getDownloadURL` from the Firebase JS SDK. By default, Firebase Storage has **restrictive CORS headers** that can block requests from a WebView's origin (especially on Android where the origin may be `null` or `file://`).

### Where File Uploads Happen in the App

| Screen | File Type | Storage Path |
|---|---|---|
| `app/(user)/profile/edit-profile/page.tsx` | Avatar photo | `avatars/{uid}` |
| `app/trainer/profile/edit-profile/page.tsx` | Avatar photo | `avatars/{uid}` |
| `app/(admin)/admin/supplements/page.tsx` | Product image | `supplements/{name}` |
| `app/(admin)/admin/trainers/page.tsx` | Profile photo | `trainers/photos/{...}` |
| `app/(admin)/admin/trainers/page.tsx` | Proof of ID | `trainers/proofId/{...}` |
| `app/(admin)/admin/trainers/page.tsx` | Certificate | `trainers/certificates/{...}` |
| `app/(admin)/admin/trainers/page.tsx` | PT Insurance | `trainers/ptInsurance/{...}` |
| `app/(admin)/admin/exercises/page.tsx` | Exercise thumbnail | `exercises/{name}` |

### The Fix — Run Once (Firebase Console or CLI)

Create a `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it to the storage bucket:

```bash
gsutil cors set cors.json gs://ptrb-c992e.appspot.com
```

> **Note:** If you prefer a tighter policy, replace `"*"` with your production domain: `"https://your-domain.com"`. For WebView on Android, also add `"null"` (since Android WebView may send `Origin: null`).

---

## 5. 🔴 Critical — File Upload / Camera Permissions

The app has `<input type="file" accept="image/*">` elements for profile photo upload. `flutter_inappwebview` handles the file picker natively, but the OS permissions must be declared.

### Android — `android/app/src/main/AndroidManifest.xml`

```xml
<manifest ...>
    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET"/>

    <!-- Camera (for profile photo) -->
    <uses-permission android:name="android.permission.CAMERA"/>

    <!-- Storage — choose based on target SDK -->
    <!-- For Android < 13 (API < 33) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28"/>

    <!-- For Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>

    <application ...>
        <!-- Required for file picker on Android 11+ -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"/>
        </provider>
    </application>
</manifest>
```

Create `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="."/>
    <cache-path name="cache_files" path="."/>
</paths>
```

### iOS — `ios/Runner/Info.plist`

```xml
<!-- Camera access -->
<key>NSCameraUsageDescription</key>
<string>PTRB needs camera access to update your profile photo.</string>

<!-- Photo library access -->
<key>NSPhotoLibraryUsageDescription</key>
<string>PTRB needs photo library access to update your profile photo.</string>

<!-- Photo library add (for saving) -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>PTRB needs permission to save photos.</string>
```

### Runtime Permission Request (Flutter)

Request permissions before the WebView loads:

```dart
import 'package:permission_handler/permission_handler.dart';

Future<void> requestPermissions() async {
  await [
    Permission.camera,
    Permission.photos,       // iOS
    Permission.storage,      // Android < 13
    Permission.mediaLibrary, // Android 13+
  ].request();
}

@override
void initState() {
  super.initState();
  requestPermissions();
}
```

---

## 6. ⚠️ Safe Area / Notch / Status Bar

### The Problem

`app/layout.tsx` has **no `viewport-fit=cover` meta tag**, and `app/globals.css` has **no `env(safe-area-inset-*)` padding**. On devices with notches (iPhone 14 Pro, Pixel 9), content will be clipped under the status bar or home indicator.

### Fix A — Next.js Side (Preferred)

**In `app/layout.tsx`**, add the viewport meta tag inside `<head>`:

```tsx
<head>
  {/* ... existing font links ... */}
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</head>
```

**In `app/globals.css`**, add safe area padding to the main app shell. The user/trainer layout (`app/(user)/layout.tsx`) wraps everything with `pb-20` for the bottom nav — replace or extend it:

```css
/* Safe area support for WebView / PWA */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

/* Apply to bottom nav so it clears home indicator */
.bottom-nav-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
```

### Fix B — Flutter Side (Quick Fix)

Set the WebView background colour and let Flutter's `SafeArea` handle top/bottom:

```dart
Scaffold(
  backgroundColor: Color(0xFF121212), // matches app background
  body: SafeArea(
    top: true,
    bottom: false, // web handles its own bottom nav
    child: InAppWebView(...),
  ),
)
```

> ✅ **Recommendation:** Do both. Flutter's `SafeArea` for the status bar (top), and `env(safe-area-inset-bottom)` in CSS for the home indicator (bottom nav area).

---

## 7. ⚠️ Android Hardware Back Button

### The Problem

On Android, pressing the hardware back button by default exits the Flutter app. But the user may be deep in a Next.js route stack (`/workouts/3/active`, `/profile/edit-profile`, etc.) and expects the back button to navigate within the web app.

### The Fix

```dart
late InAppWebViewController _webViewController;

@override
Widget build(BuildContext context) {
  return WillPopScope( // or PopScope on Flutter 3.16+
    onWillPop: () async {
      if (await _webViewController.canGoBack()) {
        await _webViewController.goBack();
        return false; // don't pop the Flutter route
      }
      return true; // allow app exit / Flutter navigation
    },
    child: InAppWebView(
      onWebViewCreated: (controller) {
        _webViewController = controller;
      },
      // ...
    ),
  );
}
```

> For Flutter 3.16+, use `PopScope` with `canPop: false` and `onPopInvoked`.

---

## 8. ⚠️ Google Fonts (CDN Dependency)

### The Problem

`app/layout.tsx` loads the **Public Sans** font from Google Fonts CDN:

```html
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:..." rel="stylesheet" />
```

In a WebView with no internet connection (or slow connection), the font will fail to load and the app will fall back to the system default font — causing layout shifts.

### Options

**Option A — Add a system-font fallback in CSS (minimal effort):**

In `app/globals.css`, ensure `font-sans` falls back gracefully:

```css
body {
  font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

**Option B — Self-host the font (best for offline/slow networks):**

1. Download Public Sans from Google Fonts or use `next/font/google`:

```tsx
// app/layout.tsx
import { Public_Sans } from "next/font/google";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-public-sans",
});
```

2. Replace the `<link>` tags in `layout.tsx` and apply the CSS variable.

This bundles the font at build time — no CDN required.

---

## 9. ⚠️ JavaScript Channels (Optional)

You may want the web app to communicate with Flutter for future features (e.g., push notifications token, biometric unlock, deep link state). Set up a JS channel now so it's available:

```dart
InAppWebView(
  onWebViewCreated: (controller) {
    _webViewController = controller;

    // Flutter → Web: call JS function
    // controller.evaluateJavascript(source: "window.onFlutterReady()");

    // Web → Flutter: add a message handler
    controller.addJavaScriptHandler(
      handlerName: 'FlutterBridge',
      callback: (args) {
        final action = args[0] as String;
        final payload = args.length > 1 ? args[1] : null;

        switch (action) {
          case 'logout':
            // handle logout at Flutter level if needed
            break;
          case 'pushToken':
            // store FCM token from web context
            break;
        }
      },
    );
  },
)
```

To call from the Next.js side:

```typescript
// anywhere in Next.js
declare global {
  interface Window {
    flutter_inappwebview?: {
      callHandler: (name: string, ...args: unknown[]) => Promise<unknown>;
    };
  }
}

// Usage
window.flutter_inappwebview?.callHandler("FlutterBridge", "logout");
```

---

## 10. ✅ What Already Works Out of the Box

These require **no changes** in Flutter or Next.js:

| Feature | Status | Notes |
|---|---|---|
| Firebase Auth (email/password) | ✅ Works | Runs in browser context inside WebView |
| All forms / inputs | ✅ Works | Standard HTML inputs |
| `next/image` remote images | ✅ Works | `next.config.ts` already has `hostname: "**"` |
| Bottom navigation (user + trainer) | ✅ Works | Fully client-side, no native bridging needed |
| Framer Motion animations | ✅ Works | CSS animations in WebView |
| Sonner toast notifications | ✅ Works | In-page toasts, no OS notification needed |
| `min-h-dvh` layout | ✅ Works | Dynamic viewport height works in WebView |
| All internal routing (`router.push`) | ✅ Works | Stays within the WebView |
| Dark theme (#121212 background) | ✅ Works | Set Flutter scaffold to same colour to avoid flash |
| Firestore reads/writes | ✅ Works | Firebase SDK runs in WebView browser context |
| Admin dashboard | ✅ Works | But designed for desktop — not in mobile WebView scope |

---

## 11. Flutter Implementation — Full Setup

```dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart';

class PtrbWebView extends StatefulWidget {
  const PtrbWebView({super.key});

  @override
  State<PtrbWebView> createState() => _PtrbWebViewState();
}

class _PtrbWebViewState extends State<PtrbWebView> {
  late InAppWebViewController _controller;

  // ⬇️ CHANGE THIS to your production Next.js URL
  static const String _baseUrl = "https://your-ptrb-domain.com";

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.photos,
      Permission.storage,
    ].request();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (await _controller.canGoBack()) {
          await _controller.goBack();
          return false;
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF121212),
        body: SafeArea(
          top: true,
          bottom: false,
          child: InAppWebView(
            initialUrlRequest: URLRequest(url: WebUri(_baseUrl)),
            initialSettings: InAppWebViewSettings(
              javaScriptEnabled: true,
              domStorageEnabled: true,
              databaseEnabled: true,
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserGesture: false,
              allowFileAccessFromFileURLs: true,
              allowUniversalAccessFromFileURLs: true,
              useOnDownloadStart: true,
              // Android: allow mixed content for Firebase Storage
              mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
              // Disable zoom — web app is designed for fixed mobile width
              supportZoom: false,
              builtInZoomControls: false,
              displayZoomControls: false,
            ),
            onWebViewCreated: (controller) {
              _controller = controller;
            },
            shouldOverrideUrlLoading: (controller, navigationAction) async {
              final url = navigationAction.request.url?.toString() ?? "";

              // Intercept external video/media URLs
              if (!url.startsWith(_baseUrl) &&
                  (url.startsWith("http") || url.startsWith("https"))) {
                // Let internal firebase URLs through
                if (url.contains("firebaseapp.com") ||
                    url.contains("googleapis.com") ||
                    url.contains("firebasestorage.googleapis.com") ||
                    url.contains("accounts.google.com")) {
                  return NavigationActionPolicy.ALLOW;
                }
                // Open everything else externally
                final uri = Uri.parse(url);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
                return NavigationActionPolicy.CANCEL;
              }
              return NavigationActionPolicy.ALLOW;
            },
            onCreateWindow: (controller, createWindowAction) async {
              final url = createWindowAction.request.url?.toString() ?? "";
              if (url.isNotEmpty) {
                final uri = Uri.parse(url);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              }
              return true;
            },
          ),
        ),
      ),
    );
  }
}
```

---

## 12. Android Manifest

Full `android/app/src/main/AndroidManifest.xml` additions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28"/>
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

    <application
        android:label="PTRB"
        android:usesCleartextTraffic="true"
        ...>

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:hardwareAccelerated="true"
            ...>
        </activity>

        <!-- Required by flutter_inappwebview for file picker -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"/>
        </provider>

    </application>
</manifest>
```

`android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="."/>
    <cache-path name="cache_files" path="."/>
    <files-path name="files" path="."/>
</paths>
```

---

## 13. iOS Info.plist

Add to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>PTRB needs camera access to update your profile photo.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>PTRB needs photo library access to update your profile photo.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Allow PTRB to save photos to your library.</string>

<key>NSMicrophoneUsageDescription</key>
<string>PTRB may need microphone access for video features.</string>

<!-- Allow loading content from Firebase domains -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

`ios/Runner/Info.plist` — also set the WebView to allow inline playback:

```xml
<key>NSAllowsArbitraryLoadsInWebContent</key>
<true/>
```

---

## 14. Firebase Storage CORS Config

Save this as `cors.json` anywhere on your machine, then run the `gsutil` command.

```json
[
  {
    "origin": [
      "https://your-ptrb-domain.com",
      "null"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
```

Apply:

```bash
# Install Google Cloud SDK if you haven't
# Then authenticate:
gcloud auth login

# Apply CORS
gsutil cors set cors.json gs://ptrb-c992e.appspot.com

# Verify
gsutil cors get gs://ptrb-c992e.appspot.com
```

> Replace `https://your-ptrb-domain.com` with the actual deployed URL. The `"null"` entry covers Android WebView requests where origin is null.

---

## 15. Next.js Changes Required

These are changes that need to be made to the **Next.js project** to support WebView properly.

### 15.1 — Add `viewport-fit=cover` meta tag

**File:** `app/layout.tsx`

Add inside `<head>`:

```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 15.2 — Add safe area CSS variables

**File:** `app/globals.css`

Add at the top:

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

In the bottom navigation component (`components/layout/bottom-nav.tsx` and `components/layout/trainer-bottom-nav.tsx`), add `pb-[env(safe-area-inset-bottom,0px)]` or `pb-[max(8px,env(safe-area-inset-bottom))]` to the nav wrapper.

### 15.3 — Self-host Google Fonts (Recommended)

**File:** `app/layout.tsx`

Replace CDN `<link>` tags with `next/font/google`:

```tsx
import { Public_Sans } from "next/font/google";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// In <html>:
<html lang="en" className={publicSans.className}>
```

Remove the `<link rel="preconnect">` and `<link href="https://fonts.googleapis.com/...">` tags from `<head>`.

---

## 16. Deployment Checklist

Before handing off the Flutter project:

- [ ] Next.js app deployed to production (Vercel / custom domain)
- [ ] Production URL set in Flutter `_baseUrl` constant
- [ ] Firebase Storage CORS configured (`gsutil cors set`)
- [ ] Android `AndroidManifest.xml` updated with permissions + FileProvider
- [ ] `android/app/src/main/res/xml/file_paths.xml` created
- [ ] iOS `Info.plist` updated with camera/photo usage descriptions
- [ ] `pubspec.yaml` has `flutter_inappwebview`, `url_launcher`, `permission_handler`
- [ ] `flutter pub get` run
- [ ] `viewport-fit=cover` added to `app/layout.tsx`
- [ ] Google Fonts self-hosted via `next/font/google` (optional but recommended)
- [ ] Test video play (PLAY VIDEO button in workout session) → opens YouTube externally ✅
- [ ] Test profile photo upload on Android (camera + gallery) ✅
- [ ] Test profile photo upload on iOS (camera + photo library) ✅
- [ ] Test Android hardware back button navigates within app ✅
- [ ] Test on notched device (iPhone + Android) for safe area ✅

---

## Quick Reference — App Routes

The Flutter WebView loads the base URL and then the Next.js app handles all routing internally. Here are the main route groups for reference:

| Path | Who sees it |
|---|---|
| `/intro`, `/join`, `/login`, `/signup` | Unauthenticated users |
| `/onboarding-*` | New members during onboarding |
| `/trainer-intro`, `/trainer-registration` | New trainers |
| `/main` | Member home |
| `/workouts`, `/workouts/[id]`, `/workouts/[id]/active` | Member workout flow |
| `/nutrition` | Member nutrition |
| `/stats` | Member progress |
| `/profile`, `/profile/settings`, `/profile/edit-profile`, `/profile/change-password` | Member profile |
| `/daily-checkin` | Member check-in |
| `/trainer` | Trainer home |
| `/trainer/clients` | Trainer client list |
| `/trainer/profile` | Trainer profile |
| `/admin/...` | Admin (desktop only — not in mobile WebView) |

---

*Generated for PTRB project — Next.js + Firebase stack*
