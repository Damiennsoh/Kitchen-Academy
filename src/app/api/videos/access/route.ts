import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const videoId = request.nextUrl.searchParams.get("videoId");
  const quality = request.nextUrl.searchParams.get("quality") || "720p";
  const intent = request.nextUrl.searchParams.get("intent") || "stream";
  if (!videoId || !["stream", "download"].includes(intent)) {
    return NextResponse.json({ error: "Invalid video request" }, { status: 400 });
  }

  const [{ data: video }, { count: downloads }] = await Promise.all([
    supabaseServer.from("videos").select("*").eq("id", videoId).eq("is_published", true).single(),
    supabaseServer.from("video_download_events").select("id", { count: "exact", head: true }).eq("video_id", videoId).eq("user_id", user.id),
  ]);
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const { data: purchase } = await supabaseServer.from("video_purchases").select("id").eq("video_id", videoId).eq("user_id", user.id).maybeSingle();
  if (!purchase) return NextResponse.json({ error: "This video is not included in your access" }, { status: 403 });
  if (intent === "stream" && !["stream", "both"].includes(video.access_mode)) return NextResponse.json({ error: "Streaming is not enabled" }, { status: 403 });
  if (intent === "download" && !["download", "both"].includes(video.access_mode)) return NextResponse.json({ error: "Downloads are not enabled" }, { status: 403 });
  if (intent === "download" && (downloads || 0) >= video.download_limit) return NextResponse.json({ error: "Download limit reached" }, { status: 429 });
  if (!video.provider_path) return NextResponse.json({ error: "Video delivery is not configured yet" }, { status: 503 });

  if (intent === "download") {
    await supabaseServer.from("video_download_events").insert({ video_id: videoId, user_id: user.id, quality });
  }

  return NextResponse.json({ url: video.provider_path, expiresIn: 900, quality, intent });
}
