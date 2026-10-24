import { NextRequest, NextResponse } from "next/server";
import { getAppBindings } from "@/lib/cloudflare";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

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
      },
    });
  } catch (error: any) {
    console.error("GET /api/r2/[key] error:", error);
    return NextResponse.json({ error: "Failed to serve R2 object" }, { status: 500 });
  }
}
