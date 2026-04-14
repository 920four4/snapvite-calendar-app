import { NextRequest, NextResponse } from "next/server";

// Web Share Target API — receives POST from Android share sheet
// Stashes the image in a temporary in-memory map and redirects to /?shared=<token>
// For production, use Vercel Blob or signed URL instead of in-memory

const shareStore = new Map<string, { data: string; mediaType: string; expiresAt: number }>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of shareStore) {
    if (val.expiresAt < now) shareStore.delete(key);
  }
}, 5 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.redirect(new URL("/?error=no_image", req.url));
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const token = crypto.randomUUID();

    shareStore.set(token, {
      data: base64,
      mediaType: file.type || "image/jpeg",
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minute TTL
    });

    return NextResponse.redirect(new URL(`/?shared=${token}`, req.url));
  } catch (err) {
    console.error("[/api/share]", err);
    return NextResponse.redirect(new URL("/?error=share_failed", req.url));
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 400 });
  }

  const entry = shareStore.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    shareStore.delete(token ?? "");
    return NextResponse.json({ error: "Token expired or not found" }, { status: 404 });
  }

  shareStore.delete(token);
  return NextResponse.json({ data: entry.data, mediaType: entry.mediaType });
}
