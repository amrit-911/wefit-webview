import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

// Sends an FCM push for a notification doc already written to Firestore.
// Stand-in for the Firestore-triggered Cloud Function (functions/src/index.ts),
// which needs the Blaze plan — this runs on our own Next.js hosting instead.
export async function POST(request: Request) {
  try {
    const { recipientId, title, body, linkPath, type } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });
    }

    // Admin notifications use a sentinel recipientId — skip FCM for those
    if (recipientId === "admin") {
      return NextResponse.json({ skipped: true, reason: "admin sentinel" });
    }

    const userDoc = await adminDb.collection("users").doc(recipientId).get();
    const fcmToken: string | undefined = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      return NextResponse.json({ skipped: true, reason: "no fcm token" });
    }

    const response = await adminMessaging.send({
      token: fcmToken,
      notification: {
        title: title ?? "WeFit",
        body: body ?? "",
      },
      // Data payload — passed to Flutter even when app is terminated
      data: {
        linkPath: linkPath ?? "",
        type: type ?? "",
      },
      android: {
        notification: {
          channelId: "wefit_default",
          priority: "high",
          sound: "default",
          icon: "ic_launcher",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
