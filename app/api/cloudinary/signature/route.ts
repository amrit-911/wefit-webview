import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const { folder, publicId } = await request.json();
    if (!folder) {
      return NextResponse.json({ error: "Missing folder" }, { status: 400 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number | boolean> = { timestamp, folder };
    if (publicId) {
      paramsToSign.public_id = publicId;
      paramsToSign.overwrite = true;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: any) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
