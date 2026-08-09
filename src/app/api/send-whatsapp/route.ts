import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/send-whatsapp
// Body: { classId, message, studentIds?, excludeAlreadyReminded? }
export async function POST(req: NextRequest) {
  try {
    const { classId, message, studentIds, excludeAlreadyReminded } = await req.json();

    if (!classId || !message) {
      return NextResponse.json({ error: "classId and message are required" }, { status: 400 });
    }

    // 1. Fetch recipients
    let query = supabaseServer
      .from("registrations")
      .select(`
        id,
        student_id,
        reminder_sent,
        students(id, full_name, phone)
      `)
      .eq("class_id", classId)
      .eq("paid", true);

    if (studentIds && studentIds.length > 0) {
      query = query.in("student_id", studentIds);
    }

    if (excludeAlreadyReminded) {
      query = query.eq("reminder_sent", false);
    }

    const { data: registrations, error } = await query;

    if (error) throw error;
    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: "No eligible recipients found" });
    }

    // 2. Send via Ultramsg API
    const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE_ID;
    const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;

    const results = [];
    for (const reg of registrations) {
      const student = reg.students as any;
      if (!student?.phone) continue;

      const personalizedMsg = message
        .replace(/{name}/g, student.full_name || "Student")
        .replace(/{class}/g, "")
        .replace(/{date}/g, "");

      let status = "failed";
      try {
        if (ULTRAMSG_INSTANCE && ULTRAMSG_TOKEN) {
          const res = await fetch(
            `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: ULTRAMSG_TOKEN,
                to: student.phone,
                body: personalizedMsg,
              }),
            }
          );
          status = res.ok ? "sent" : "failed";
        } else {
          // DEMO MODE: simulate success if no credentials
          status = "sent";
          console.log(`[DEMO WhatsApp] To: ${student.phone} | Msg: ${personalizedMsg.slice(0, 60)}...`);
        }
      } catch (e) {
        status = "failed";
      }

      // 3. Log message
      await supabaseServer.from("message_logs").insert({
        class_id: classId,
        student_id: student.id,
        channel: "whatsapp",
        message: personalizedMsg,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      });

      // 4. Mark reminder sent
      if (status === "sent") {
        await supabaseServer
          .from("registrations")
          .update({ reminder_sent: true })
          .eq("id", reg.id);
      }

      results.push({ phone: student.phone, status });

      // Rate limit: 1 message per second
      await new Promise((r) => setTimeout(r, 1000));
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, failed, total: results.length });
  } catch (err: any) {
    console.error("WhatsApp send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
