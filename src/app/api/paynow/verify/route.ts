import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET /api/paynow/verify?regId=xxx&demo=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regId = searchParams.get("regId");
    const demo = searchParams.get("demo") === "true";

    if (!regId) {
      return NextResponse.json({ error: "regId required" }, { status: 400 });
    }

    if (demo) {
      // DEMO: Auto-mark as paid for testing
      await supabaseServer
        .from("registrations")
        .update({ paid: true, payment_method: "ecocash", payment_reference: `DEMO-${Date.now()}` })
        .eq("id", regId);

      return NextResponse.json({ success: true, paid: true, demo: true });
    }

    // Production: Poll Paynow for status
    // const status = await pollPaynowStatus(regId);
    return NextResponse.json({ success: true, paid: false, message: "Production polling not configured" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
