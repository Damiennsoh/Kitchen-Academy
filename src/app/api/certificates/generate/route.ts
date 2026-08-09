import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// POST /api/certificates/generate
// Body: { registrationId }
// Generates a certificate and returns a data URL for download
export async function POST(req: NextRequest) {
  const { response: authResponse } = await requireAdmin(req);
  if (authResponse.status === 403) return authResponse;

  try {
    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }

    // Get registration with student and class details
    const { data: reg } = await supabaseServer
      .from("registrations")
      .select(`
        id,
        student:students(full_name),
        class:classes(title, class_date)
      `)
      .eq("id", registrationId)
      .single();

    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Handle Supabase response format (student and class are arrays)
    const studentData = Array.isArray(reg.student) ? reg.student[0] : reg.student;
    const classData = Array.isArray(reg.class) ? reg.class[0] : reg.class;

    if (!studentData || !classData) {
      return NextResponse.json({ error: "Missing student or class data" }, { status: 404 });
    }

    // Generate certificate HTML (client-side will convert to PDF)
    const certificateHtml = generateCertificateHtml({
      studentName: studentData.full_name,
      classTitle: classData.title,
      classDate: new Date(classData.class_date).toLocaleDateString("en-ZW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      certificateId: `CK-${Date.now()}`,
    });

    // Save certificate record
    const { data: cert, error } = await supabaseServer
      .from("certificates")
      .insert({
        registration_id: registrationId,
        student_name: studentData.full_name,
        class_title: classData.title,
        class_date: classData.class_date,
      })
      .select()
      .single();

    if (error) throw error;

    // Mark registration as certificate issued
    await supabaseServer
      .from("registrations")
      .update({ certificate_issued: true })
      .eq("id", registrationId);

    return NextResponse.json({
      success: true,
      certificate: cert,
      html: certificateHtml,
    });
  } catch (err: any) {
    console.error("Certificate generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateCertificateHtml({
  studentName,
  classTitle,
  classDate,
  certificateId,
}: {
  studentName: string;
  classTitle: string;
  classDate: string;
  certificateId: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1123px; height: 794px;
      background: linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fff7ed 100%);
      font-family: 'Inter', sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .border-frame {
      position: absolute; inset: 30px;
      border: 3px solid #f97316;
      border-radius: 8px;
    }
    .border-frame::before {
      content: ''; position: absolute; inset: 8px;
      border: 1px solid #fdba74;
      border-radius: 4px;
    }
    .content {
      text-align: center; z-index: 1; padding: 60px;
    }
    .logo {
      font-size: 24px; font-weight: 700; color: #f97316;
      margin-bottom: 8px; letter-spacing: 2px;
    }
    .subtitle { font-size: 14px; color: #9a3412; margin-bottom: 40px; }
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 52px; color: #1a1a2e; margin-bottom: 16px;
    }
    .presented-to {
      font-size: 16px; color: #666; text-transform: uppercase;
      letter-spacing: 4px; margin-bottom: 16px;
    }
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 42px; color: #c2410c;
      border-bottom: 2px solid #f97316; display: inline-block;
      padding: 0 40px 12px; margin-bottom: 32px;
    }
    .achievement {
      font-size: 18px; color: #444; line-height: 1.6;
      max-width: 600px; margin: 0 auto 40px;
    }
    .class-name { font-weight: 600; color: #1a1a2e; }
    .details {
      display: flex; justify-content: center; gap: 80px;
      margin-bottom: 48px;
    }
    .detail-item { text-align: center; }
    .detail-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px; }
    .detail-value { font-size: 16px; font-weight: 600; color: #333; margin-top: 4px; }
    .signature-line {
      display: inline-block; width: 200px;
      border-top: 1px solid #333; padding-top: 8px;
      font-size: 14px; color: #333;
    }
    .certificate-id {
      position: absolute; bottom: 50px; right: 60px;
      font-size: 11px; color: #999; font-family: monospace;
    }
    .seal {
      position: absolute; bottom: 80px; left: 60px;
      width: 80px; height: 80px;
      background: #f97316; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 32px; transform: rotate(-12deg);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }
  </style>
</head>
<body>
  <div class="border-frame"></div>
  <div class="content">
    <div class="logo">COOKING WITH CHIPO</div>
    <div class="subtitle">Zimbabwe&apos;s Favorite Online Cooking School</div>
    <div class="title">Certificate of Completion</div>
    <div class="presented-to">This is proudly presented to</div>
    <div class="student-name">${studentName}</div>
    <div class="achievement">
      For successfully completing the<br/>
      <span class="class-name">${classTitle}</span><br/>
      demonstrating dedication, skill, and passion for cooking.
    </div>
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Date</div>
        <div class="detail-value">${classDate}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Instructor</div>
        <div class="detail-value">Chipo</div>
      </div>
    </div>
    <div class="signature-line">Chipo — Head Chef & Founder</div>
  </div>
  <div class="seal">👩‍🍳</div>
  <div class="certificate-id">CERT ID: ${certificateId}</div>
</body>
</html>`;
}
