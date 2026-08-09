import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST /api/reminders/schedule
// Schedule automated reminders for a class
// Body: { classId, reminders: [{ hoursBefore: number, message: string, channel: "whatsapp"|"email" }] }
export async function POST(req: NextRequest) {
  try {
    const { classId, reminders } = await req.json();

    if (!classId || !reminders || !Array.isArray(reminders)) {
      return NextResponse.json({ error: "classId and reminders array required" }, { status: 400 });
    }

    // Get class details
    const { data: cls } = await supabaseServer
      .from("classes")
      .select("class_date, title")
      .eq("id", classId)
      .single();

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Store scheduled reminders
    const scheduledReminders = reminders.map((r: any) => ({
      class_id: classId,
      hours_before: r.hoursBefore,
      message: r.message,
      channel: r.channel,
      scheduled_for: new Date(new Date(cls.class_date).getTime() - r.hoursBefore * 3600000).toISOString(),
      status: "pending",
    }));

    const { error } = await supabaseServer
      .from("scheduled_reminders")
      .insert(scheduledReminders);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      scheduled: scheduledReminders.length,
      classDate: cls.class_date,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/reminders/trigger
// Called by cron job (e.g., Vercel Cron or Supabase Edge Function scheduler)
// Sends reminders that are due
export async function GET(req: NextRequest) {
  try {
    // Find pending reminders that are due
    const { data: dueReminders } = await supabaseServer
      .from("scheduled_reminders")
      .select(`
        *,
        class:classes(id, title, class_date),
        registrations:class_id(id, student_id, paid, student:students(phone, email, full_name))
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString());

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ sent: 0, message: "No reminders due" });
    }

    const results = [];

    for (const reminder of dueReminders as any[]) {
      const paidStudents = (reminder.registrations || []).filter((r: any) => r.paid);

      for (const reg of paidStudents) {
        const student = reg.student;
        if (!student) continue;

        const personalizedMsg = reminder.message.replace(/{name}/g, student.full_name);

        if (reminder.channel === "whatsapp" && student.phone) {
          // Send WhatsApp (same logic as bulk API)
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-whatsapp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classId: reminder.class_id,
              message: personalizedMsg,
              studentIds: [student.id],
            }),
          });
        } else if (reminder.channel === "email" && student.email) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classId: reminder.class_id,
              subject: `Reminder: ${reminder.class.title}`,
              message: personalizedMsg,
              studentIds: [student.id],
            }),
          });
        }
      }

      // Mark reminder as sent
      await supabaseServer
        .from("scheduled_reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      results.push({ reminderId: reminder.id, recipients: paidStudents.length });
    }

    return NextResponse.json({ sent: results.length, details: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
