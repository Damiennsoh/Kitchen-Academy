import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/send-email
// Body: { classId, subject, message, studentIds? }
export async function POST(req: NextRequest) {
  try {
    const { classId, subject, message, studentIds } = await req.json();

    if (!classId || !subject || !message) {
      return NextResponse.json({ error: "classId, subject, and message are required" }, { status: 400 });
    }

    // Fetch recipients with email
    let query = supabaseServer
      .from("registrations")
      .select(`
        id,
        student_id,
        students(id, full_name, email)
      `)
      .eq("class_id", classId)
      .eq("paid", true)
      .not("students.email", "is", null);

    if (studentIds && studentIds.length > 0) {
      query = query.in("student_id", studentIds);
    }

    const { data: registrations, error } = await query;

    if (error) throw error;
    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: "No recipients with email found" });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const results = [];

    for (const reg of registrations) {
      const student = reg.students as any;
      if (!student?.email) continue;

      const personalizedMsg = message.replace(/{name}/g, student.full_name || "Student");

      let status = "failed";
      try {
        if (BREVO_API_KEY) {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
              sender: { name: "Cooking with Chipo", email: "classes@cookingwithchipo.com" },
              to: [{ email: student.email, name: student.full_name }],
              subject,
              htmlContent: `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
                <div style="max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#f97316;">Cooking with Chipo</h2>
                  <p>${personalizedMsg.replace(/\n/g, "<br/>")}</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
                  <p style="font-size:12px;color:#999;">You're receiving this because you're registered for a class with Cooking with Chipo.</p>
                </div>
              </body></html>`,
            }),
          });
          status = res.ok ? "sent" : "failed";
        } else {
          status = "sent";
          console.log(`[DEMO Email] To: ${student.email} | Subject: ${subject}`);
        }
      } catch (e) {
        status = "failed";
      }

      await supabaseServer.from("message_logs").insert({
        class_id: classId,
        student_id: student.id,
        channel: "email",
        message: `${subject}\n${personalizedMsg}`,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      });

      results.push({ email: student.email, status });
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, failed, total: results.length });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
