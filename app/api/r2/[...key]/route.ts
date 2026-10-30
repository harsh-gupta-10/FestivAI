import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] | string }> }
) {
  try {
    const rawParams = await params;
    const keyParam = rawParams.key;
    const rawKey = Array.isArray(keyParam) ? keyParam.join("/") : keyParam;
    if (!rawKey) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Strict Path traversal & character validation defense
    if (rawKey.includes("..") || rawKey.startsWith("/") || rawKey.includes("\\")) {
      return NextResponse.json({ error: "Invalid object key path traversal" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(rawKey)) {
      return NextResponse.json({ error: "Invalid characters in object key" }, { status: 400 });
    }

    const key = rawKey;

    const { BUCKET } = await getAppBindings();
    const object = await BUCKET.get(key);

    if (!object) {
      return NextResponse.json({ error: "Object not found in R2" }, { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType || "application/octet-stream";
    const buffer = await object.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/r2/[key] error:", error);
    return NextResponse.json({ error: "Failed to serve R2 object" }, { status: 500 });
  }
}
