import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user auth:", error);
    // If the user is already deleted or not found, we shouldn't necessarily fail the document deletion,
    // but the service handles this by catching the error.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
