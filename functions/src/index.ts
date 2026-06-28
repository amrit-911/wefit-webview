import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

admin.initializeApp();

// ─────────────────────────────────────────────────────────────────────────────
// sendPushOnNotification
//
// Triggered whenever a new document is written to the `notifications`
// Firestore collection. Looks up the recipient's FCM token from
// users/{recipientId}/fcmToken and sends a push via FCM Admin SDK.
//
// The `linkPath` field in the notification doc is forwarded as FCM data
// so the Flutter app can navigate the WebView on tap.
// ─────────────────────────────────────────────────────────────────────────────

export const sendPushOnNotification = onDocumentCreated(
  {
    document: "notifications/{notifId}",
    region: "asia-south1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) {
      logger.warn("sendPushOnNotification: no data in event");
      return;
    }

    
    const { recipientId, title, body, linkPath, type } = data as {
      recipientId: string;
      title: string;
      body?: string;
      linkPath?: string;
      type?: string;
    };

    if (!recipientId) {
      logger.warn("sendPushOnNotification: missing recipientId");
      return;
    }

    // Admin notifications use a sentinel recipientId — skip FCM for those
    if (recipientId === "admin") {
      logger.info("sendPushOnNotification: admin notification, skipping FCM");
      return;
    }

    // Look up the recipient's FCM token
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(recipientId)
      .get();

    const fcmToken: string | undefined = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      logger.info(
        `sendPushOnNotification: no FCM token for user ${recipientId}`
      );
      return;
    }

    const notifId = event.params.notifId;

    try {
      const response = await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: title ?? "WeFit",
          body: body ?? "",
        },
        // Data payload — passed to Flutter even when app is terminated
        data: {
          linkPath: linkPath ?? "",
          notifId,
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

      logger.info(
        `sendPushOnNotification: sent to ${recipientId} — message ID: ${response}`
      );
    } catch (err) {
      logger.error("sendPushOnNotification: FCM send failed", err);
    }
  }
);
