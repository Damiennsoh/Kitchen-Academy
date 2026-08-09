import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/affiliate/track
// Body: { referralCode, referredStudentId }
export async function POST(req: NextRequest) {
  try {
    const { referralCode, referredStudentId } = await req.json();

    if (!referralCode || !referredStudentId) {
      return NextResponse.json({ error: "referralCode and referredStudentId required" }, { status: 400 });
    }

    // Find affiliate by referral code
    const { data: affiliate } = await supabaseServer
      .from("affiliates")
      .select("id, commission_rate")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Create referral record
    const { error } = await supabaseServer.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      referred_student_id: referredStudentId,
      commission_amount: 0,
      status: "pending",
    });

    if (error) {
      // If already referred, just return success
      if (error.message.includes("duplicate")) {
        return NextResponse.json({ success: true, alreadyReferred: true });
      }
      throw error;
    }

    // Update affiliate stats
    await supabaseServer.rpc("increment_affiliate_referrals", {
      affiliate_id: affiliate.id,
    });

    return NextResponse.json({ success: true, commissionRate: affiliate.commission_rate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
