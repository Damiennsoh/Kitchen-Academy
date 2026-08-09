import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// GET /api/export?type=students|registrations|orders&format=csv|json
export async function GET(req: NextRequest) {
  const { response: authResponse } = await requireAdmin(req);
  if (authResponse.status === 403) return authResponse;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "students";
    const format = searchParams.get("format") || "csv";

    let data: any[] = [];
    let filename = "";
    let headers: string[] = [];

    if (type === "students") {
      const { data: students } = await supabaseServer
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      data = students || [];
      filename = "students_export.csv";
      headers = ["ID", "Full Name", "Phone", "Email", "WhatsApp Opt-In", "Created At"];
    } else if (type === "registrations") {
      const { data: regs } = await supabaseServer
        .from("registrations")
        .select("*, student:students(full_name, phone), class:classes(title)")
        .order("created_at", { ascending: false });
      data = regs || [];
      filename = "registrations_export.csv";
      headers = ["ID", "Student", "Phone", "Class", "Paid", "Attended", "Certificate", "Created At"];
    } else if (type === "orders") {
      const { data: orders } = await supabaseServer
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      data = orders || [];
      filename = "orders_export.csv";
      headers = ["ID", "Status", "Amount", "Currency", "Payment Method", "Created At"];
    }

    if (format === "json") {
      return NextResponse.json({ data, count: data.length });
    }

    // CSV format
    let csv = headers.join(",") + "\n";

    for (const row of data) {
      if (type === "students") {
        csv += `${row.id},"${row.full_name}",${row.phone},${row.email || ""},${row.whatsapp_opt_in},${row.created_at}\n`;
      } else if (type === "registrations") {
        csv += `${row.id},"${row.student?.full_name || ""}",${row.student?.phone || ""},"${row.class?.title || ""}",${row.paid},${row.attended},${row.certificate_issued},${row.created_at}\n`;
      } else if (type === "orders") {
        csv += `${row.id},${row.status},${row.total_amount},${row.currency},${row.payment_method || ""},${row.created_at}\n`;
      }
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
