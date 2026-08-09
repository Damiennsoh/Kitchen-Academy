import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/paynow/initiate
// Body: { registrationId, phone, method: "ecocash" | "onemoney" | "card" }
export async function POST(req: NextRequest) {
  try {
    const { registrationId, phone, method } = await req.json();

    if (!registrationId || !phone) {
      return NextResponse.json({ error: "registrationId and phone are required" }, { status: 400 });
    }

    // Get registration details
    const { data: reg } = await supabaseServer
      .from("registrations")
      .select(`id, class_id, class:classes(title, price, currency), student:students(full_name, phone)`)
      .eq("id", registrationId)
      .single();

    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Handle Supabase response format (class and student are arrays)
    const classData = reg.class ? (Array.isArray(reg.class) ? reg.class[0] : reg.class) : null;
    const studentData = reg.student ? (Array.isArray(reg.student) ? reg.student[0] : reg.student) : null;

    const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID;
    const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY;

    // DEMO MODE: If no Paynow credentials, return mock payment URL
    if (!PAYNOW_INTEGRATION_ID || !PAYNOW_INTEGRATION_KEY) {
      console.log("[DEMO Paynow] Would initiate payment for:", classData?.title, classData?.price);
      return NextResponse.json({
        success: true,
        demo: true,
        pollUrl: `/api/paynow/verify?regId=${registrationId}&demo=true`,
        instructions: "In production, this redirects to Paynow payment page.",
      });
    }

    // Production: Call Paynow API
    const paynowData = {
      id: PAYNOW_INTEGRATION_ID,
      reference: registrationId,
      amount: classData?.price,
      info: `Cooking with Chipo - ${classData?.title}`,
      returnurl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      resulturl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paynow/callback`,
      phone,
      method,
    };

    // Note: Actual Paynow integration requires their SDK or REST API
    // This is the structure — replace with real Paynow call
    return NextResponse.json({
      success: true,
      paynowUrl: "https://www.paynow.co.zw/...", // Replace with actual
      pollUrl: "...",
    });
  } catch (err: any) {
    console.error("Paynow initiate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
