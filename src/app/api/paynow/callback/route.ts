import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/paynow/callback
// Paynow sends webhook here when payment completes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, status, paynowreference } = body;

    if (status === "paid" || status === "ok") {
      await supabaseServer
        .from("registrations")
        .update({
          paid: true,
          payment_method: "ecocash",
          payment_reference: paynowreference,
        })
        .eq("id", reference);

      // Send WhatsApp confirmation
      const { data: reg } = await supabaseServer
        .from("registrations")
        .select("student:students(phone)")
        .eq("id", reference)
        .single();

      // Handle Supabase response format (student is an array)
      const studentData = reg?.student ? (Array.isArray(reg.student) ? reg.student[0] : reg.student) : null;

      if (studentData?.phone) {
        // Trigger WhatsApp confirmation (implement via Ultramsg)
        console.log(`[Paynow Webhook] Payment confirmed for ${studentData.phone}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
