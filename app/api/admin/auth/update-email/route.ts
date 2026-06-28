import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { uid, email } = await request.json();
    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    await adminAuth.updateUser(uid, { email });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
