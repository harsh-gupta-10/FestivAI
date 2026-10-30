import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getErrorMessage } from "@/lib/error";

export async function POST(req: NextRequest) {
  try {
    // Rate limit file uploads (20 uploads per minute per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`upload_${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error || "Upload rate limit exceeded. Please wait a minute." },
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Enforce 5MB file size limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit.` },
        { status: 400 }
      );
    }

    // 2. Strict MIME whitelist (disallows SVG to prevent stored XSS)
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const contentType = file.type?.toLowerCase() || "";
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are permitted for security." },
        { status: 400 }
      );
    }

    const { BUCKET } = await getAppBindings();
    const arrayBuffer = await file.arrayBuffer();
    // 3. Sanitize key to block directory traversal
    const extension = contentType.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "jpg";
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const key = `covers/${Date.now()}_${cleanFileName}.${extension}`;

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
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error);
    console.error("POST /api/upload error:", errorMsg);
    return NextResponse.json({ error: errorMsg || "Failed to upload file to R2" }, { status: 500 });
  }
}
