import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.startsWith("image/") && !contentType.includes("pdf")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image (PNG, JPG, WebP)." },
        { status: 400 }
      );
    }

    const { BUCKET } = await getAppBindings();
    const arrayBuffer = await file.arrayBuffer();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 40);
    const key = `banner_${Date.now()}_${cleanFileName}`;

    await BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType,
      },
    });

    return NextResponse.json({
      success: true,
      key,
      url: `/api/r2/${key}`,
      fileName: file.name,
      contentType,
      size: arrayBuffer.byteLength,
    });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to upload file to R2" }, { status: 500 });
  }
}
