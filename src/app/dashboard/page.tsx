"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Registration, Class, Certificate, PDFGuide, VideoAsset } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, Download, Award, BookOpen, Loader2, ArrowLeft, CreditCard, FileText, Play } from "lucide-react";

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<(Registration & { class: Class })[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pdfs, setPdfs] = useState<PDFGuide[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoMessage, setVideoMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const supabase = createClientBrowser();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setUser(user);
    await fetchData(user.id);
  }

  async function fetchData(userId: string) {
    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("id", userId)
      .single();

    if (!student) {
      setLoading(false);
      return;
    }

    // Fetch registrations with class details
    const { data: regs } = await supabase
      .from("registrations")
      .select(`*, class:classes(*)`)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    setRegistrations(regs || []);

    const paidClassIds = (regs || []).filter((r: any) => r.paid).map((r: any) => r.class_id);
    if (paidClassIds.length > 0) {
      const { data: classVideos } = await supabase.from("videos").select("*").in("class_id", paidClassIds).eq("is_published", true);
      setVideos(classVideos || []);
    }

    // Fetch certificates
    const { data: certs } = await supabase
      .from("certificates")
      .select("*")
      .eq("registration_id", regs?.map((r: any) => r.id) || [])
      .order("issued_at", { ascending: false });

    setCertificates(certs || []);

    // Fetch available PDFs for completed classes
    const completedClassIds = regs?.filter((r: any) => r.attended).map((r: any) => r.class_id) || [];
    if (completedClassIds.length > 0) {
      const { data: guides } = await supabase
        .from("pdf_guides")
        .select("*")
        .in("class_id", completedClassIds);
      setPdfs(guides || []);
    }

    setLoading(false);
  }

  async function openVideo(video: VideoAsset, intent: "stream" | "download") {
    setVideoMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/videos/access?videoId=${video.id}&intent=${intent}&quality=720p`, { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
    const data = await response.json();
    if (!response.ok) {
      setVideoMessage(data.error || "Unable to open this video");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function handlePaynowPayment(regId: string) {
    const res = await fetch("/api/paynow/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, phone: user?.phone || "", method: "ecocash" }),
    });
    const data = await res.json();
    if (data.demo) {
      alert("[DEMO] Payment simulated! Refresh to see updated status.");
      window.location.reload();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Kitchen</h1>
          <p className="text-gray-600">Track your classes, certificates, and recipe downloads.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Classes Registered", value: registrations.length, icon: BookOpen, color: "bg-blue-100 text-blue-600" },
            { label: "Paid", value: registrations.filter((r) => r.paid).length, icon: CreditCard, color: "bg-green-100 text-green-600" },
            { label: "Attended", value: registrations.filter((r) => r.attended).length, icon: CheckCircle, color: "bg-brand-100 text-brand-600" },
            { label: "Certificates", value: certificates.length, icon: Award, color: "bg-purple-100 text-purple-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">My Classes</h2>
            <Link href="/classes" className="text-sm text-brand-600 font-medium hover:underline">Browse More</Link>
          </div>

          {registrations.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You haven&apos;t registered for any classes yet.</p>
              <Link href="/classes" className="inline-block mt-3 text-brand-600 font-medium">Find a Class →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {registrations.map((reg) => (
                <div key={reg.id} className="px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{reg.class.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(reg.class.class_date)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {reg.class.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Status Badges */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        reg.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {reg.paid ? "Paid" : "Payment Pending"}
                      </span>
                      {reg.attended && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                          Attended
                        </span>
                      )}

                      {/* Actions */}
                      {!reg.paid && (
                        <button
                          onClick={() => handlePaynowPayment(reg.id)}
                          className="px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          Pay {formatCurrency(reg.class.price, reg.class.currency)}
                        </button>
                      )}
                      {reg.paid && reg.class.video_url && (
                        <a href={reg.class.video_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                          <Play className="w-3 h-3" /> Watch
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Library */}
        {videos.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-gray-900">My Class Videos</h2>
              <p className="mt-1 text-sm text-gray-500">Watch your replays or download them when the instructor allows it.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {videos.map((video) => (
                <div key={video.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">{video.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{video.access_mode === "both" ? "Streaming and downloads" : video.access_mode === "download" ? "Download access" : "Streaming access"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["stream", "both"].includes(video.access_mode) && <button onClick={() => openVideo(video, "stream")} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"><Play className="size-4" /> Watch</button>}
                    {["download", "both"].includes(video.access_mode) && <button onClick={() => openVideo(video, "download")} className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"><Download className="size-4" /> Download</button>}
                  </div>
                </div>
              ))}
            </div>
            {videoMessage && <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{videoMessage}</p>}
          </div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">My Certificates</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {certificates.map((cert) => (
                <div key={cert.id} className="px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cert.class_title}</h3>
                    <p className="text-sm text-gray-500">Issued {formatDate(cert.issued_at)}</p>
                  </div>
                  <a
                    href={cert.download_url || "#"}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Guides */}
        {pdfs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recipe PDF Guides</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{pdf.title}</h3>
                      <p className="text-xs text-gray-500">{(pdf.file_size / 1024).toFixed(1)} KB • {pdf.download_count} downloads</p>
                    </div>
                  </div>
                  <a
                    href={pdf.file_url}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
