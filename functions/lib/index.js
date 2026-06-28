"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
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
exports.sendPushOnNotification = (0, firestore_1.onDocumentCreated)({
    document: "notifications/{notifId}",
    region: "asia-south1",
}, async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data) {
        firebase_functions_1.logger.warn("sendPushOnNotification: no data in event");
        return;
    }
    const { recipientId, title, body, linkPath, type } = data;
    if (!recipientId) {
        firebase_functions_1.logger.warn("sendPushOnNotification: missing recipientId");
        return;
    }
    // Admin notifications use a sentinel recipientId — skip FCM for those
    if (recipientId === "admin") {
        firebase_functions_1.logger.info("sendPushOnNotification: admin notification, skipping FCM");
        return;
    }
    // Look up the recipient's FCM token
    const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();
    const fcmToken = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.fcmToken;
    if (!fcmToken) {
        firebase_functions_1.logger.info(`sendPushOnNotification: no FCM token for user ${recipientId}`);
        return;
    }
    const notifId = event.params.notifId;
    try {
        const response = await admin.messaging().send({
            token: fcmToken,
            notification: {
                title: title !== null && title !== void 0 ? title : "PTRB",
                body: body !== null && body !== void 0 ? body : "",
            },
            // Data payload — passed to Flutter even when app is terminated
            data: {
                linkPath: linkPath !== null && linkPath !== void 0 ? linkPath : "",
                notifId,
                type: type !== null && type !== void 0 ? type : "",
            },
            android: {
                notification: {
                    channelId: "ptrb_default",
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
        firebase_functions_1.logger.info(`sendPushOnNotification: sent to ${recipientId} — message ID: ${response}`);
    }
    catch (err) {
        firebase_functions_1.logger.error("sendPushOnNotification: FCM send failed", err);
    }
});
//# sourceMappingURL=index.js.map