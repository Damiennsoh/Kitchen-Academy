"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Class, Registration, Student, MessageLog, VideoAsset, Profile } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Loader2, Send, Mail, MessageSquare, CheckCircle, Users, BookOpen, DollarSign, BarChart3, Search, Filter, ChevronDown, Phone, Check, X, Play, Plus, Pencil, Trash2, Package, Home, ImagePlus } from "lucide-react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { Download } from "lucide-react";

type Tab = "classes" | "products" | "videos" | "registrations" | "students" | "messages" | "analytics";
type Product = { id: string; name: string; description: string; price: number; currency: string; category: string; image_url?: string | null; stock_quantity: number; weight_grams?: number | null; is_active: boolean; created_at: string };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [classes, setClasses] = useState<Class[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classForm, setClassForm] = useState({ title: "", description: "", price: "5", currency: "USD", class_date: "", duration_minutes: "120", max_students: "50", status: "upcoming", image_url: "", zoom_link: "" });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", currency: "USD", category: "spice", stock_quantity: "0", weight_grams: "", image_url: "" });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [registrations, setRegistrations] = useState<(Registration & { student: Student; class: Class })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messageLogs, setMessageLogs] = useState<(MessageLog & { student: Student; class: Class })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerChannel, setComposerChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [composerMessage, setComposerMessage] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientBrowser();

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    const [{ data: cls }, { data: profs }, { data: prods }, { data: vids }, { data: regs }, { data: studs }, { data: logs }] = await Promise.all([
      supabase.from("classes").select("*").order("class_date", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("registrations").select("*, student:students(*), class:classes(*)").order("created_at", { ascending: false }),
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("message_logs").select("*, student:students(*), class:classes(*)").order("created_at", { ascending: false }).limit(100),
    ]);
    setClasses(cls || []);
    setProfiles(profs || []);
    setProducts(prods || []);
    setVideos(vids || []);
    setRegistrations(regs || []);
    setStudents(studs || []);
    setMessageLogs(logs || []);
    setLoading(false);
  }

  // Filter registrations by selected class
  const filteredRegs = selectedClass
    ? registrations.filter((r) => r.class_id === selectedClass)
    : registrations;

  const searchedRegs = searchQuery
    ? filteredRegs.filter(
        (r) =>
          r.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.student.phone || "").includes(searchQuery) ||
          r.class.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredRegs;

  // Toggle selection
  function toggleSelect(studentId: string) {
    const next = new Set(selectedStudents);
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    setSelectedStudents(next);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(searchedRegs.map((r) => r.student_id)));
    }
    setSelectAll(!selectAll);
  }

  async function promoteToStudent(student: Student) {
    await supabase.from("students").update({ is_student: !student.is_student }).eq("id", student.id);
    await fetchAllData();
  }

  async function updateVideo(video: VideoAsset, patch: Partial<VideoAsset>) {
    await supabase.from("videos").update(patch).eq("id", video.id);
    await fetchAllData();
  }

  async function updateProfileRole(profile: Profile, role: Profile["role"]) {
    if (profile.role === "admin" && role === "student" && !window.confirm("Remove this admin role?")) return;
    await supabase.from("profiles").update({ role }).eq("id", profile.id);
    await fetchAllData();
  }

  async function deleteStudentProfile(profile: Profile) {
    if (profile.role !== "student") return;
    if (!window.confirm(`Delete ${profile.full_name || "this student"}?`)) return;
    await supabase.from("profiles").delete().eq("id", profile.id);
    await fetchAllData();
  }

  function startClassEdit(cls?: Class) {
    setEditingClass(cls || null);
    setClassForm(cls ? { title: cls.title, description: cls.description, price: String(cls.price), currency: cls.currency, class_date: cls.class_date.slice(0, 16), duration_minutes: String(cls.duration_minutes), max_students: String(cls.max_students), status: cls.status, image_url: cls.image_url || "", zoom_link: cls.zoom_link || "" } : { title: "", description: "", price: "5", currency: "USD", class_date: "", duration_minutes: "120", max_students: "50", status: "upcoming", image_url: "", zoom_link: "" });
    setShowClassForm(true);
  }

  async function handleClassImageUpload(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Class images must be smaller than 5 MB.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `classes/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("class-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("class-images").getPublicUrl(path);
    setClassForm((current) => ({ ...current, image_url: data.publicUrl }));
  }

  async function saveClass(event: FormEvent) {
    event.preventDefault();
    const payload = { ...classForm, price: Number(classForm.price), duration_minutes: Number(classForm.duration_minutes), max_students: Number(classForm.max_students), class_date: new Date(classForm.class_date).toISOString(), is_published: true, join_enabled: true };
    if (editingClass) await supabase.from("classes").update(payload).eq("id", editingClass.id); else await supabase.from("classes").insert(payload);
    setShowClassForm(false); setEditingClass(null); await fetchAllData();
  }

  async function deleteClass(cls: Class) {
    if (!window.confirm(`Delete ${cls.title}? Registrations linked to it will also be removed.`)) return;
    await supabase.from("classes").delete().eq("id", cls.id); await fetchAllData();
  }

  function startProductEdit(product?: Product) {
    setEditingProduct(product || null);
    setProductForm(product ? { name: product.name, description: product.description, price: String(product.price), currency: product.currency, category: product.category, stock_quantity: String(product.stock_quantity), weight_grams: String(product.weight_grams || ""), image_url: product.image_url || "" } : { name: "", description: "", price: "", currency: "USD", category: "spice", stock_quantity: "0", weight_grams: "", image_url: "" });
    setShowProductForm(true);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const payload = { ...productForm, price: Number(productForm.price), stock_quantity: Number(productForm.stock_quantity), weight_grams: productForm.weight_grams ? Number(productForm.weight_grams) : null };
    if (editingProduct) await supabase.from("products").update(payload).eq("id", editingProduct.id); else await supabase.from("products").insert(payload);
    setShowProductForm(false); setEditingProduct(null); await fetchAllData();
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    await supabase.from("products").delete().eq("id", product.id); await fetchAllData();
  }

  async function toggleProduct(product: Product) { await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id); await fetchAllData(); }

  async function toggleJoinEnabled(cls: Class) {
    await supabase.from("classes").update({ join_enabled: !cls.join_enabled }).eq("id", cls.id);
    await fetchAllData();
  }

  async function copyClassLink(cls: Class) {
    if (!cls.share_slug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/class/${cls.share_slug}`);
    alert("Class link copied");
  }

  async function toggleClassArchive(cls: Class) {
    const archived = Boolean(cls.archived_at);
    await supabase.from("classes").update({
      is_published: archived,
      archived_at: archived ? null : new Date().toISOString(),
      status: archived ? "upcoming" : "completed",
    }).eq("id", cls.id);
    await fetchAllData();
  }

  // Mark attendance
  async function markAttendance(regId: string, attended: boolean) {
    await supabase.from("registrations").update({ attended }).eq("id", regId);
    await fetchAllData();
  }

  // Issue certificate
  async function issueCertificate(reg: any) {
    const { error } = await supabase.from("certificates").insert({
      registration_id: reg.id,
      student_name: reg.student.full_name,
      class_title: reg.class.title,
      class_date: reg.class.class_date,
    });
    if (!error) {
      await supabase.from("registrations").update({ certificate_issued: true }).eq("id", reg.id);
      await fetchAllData();
    }
  }

  // Send bulk WhatsApp
  async function sendBulkWhatsApp() {
    if (!selectedClass || !composerMessage) return;
    setSending(true);
    setSendResult("");
    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          message: composerMessage,
          studentIds: Array.from(selectedStudents),
        }),
      });
      const data = await res.json();
      setSendResult(`Sent: ${data.sent}, Failed: ${data.failed}`);
      await fetchAllData();
    } catch (e: any) {
      setSendResult("Error: " + e.message);
    } finally {
      setSending(false);
    }
  }

  // Send bulk Email
  async function sendBulkEmail() {
    if (!selectedClass || !composerMessage || !composerSubject) return;
    setSending(true);
    setSendResult("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          subject: composerSubject,
          message: composerMessage,
          studentIds: Array.from(selectedStudents),
        }),
      });
      const data = await res.json();
      setSendResult(`Sent: ${data.sent}, Failed: ${data.failed}`);
      await fetchAllData();
    } catch (e: any) {
      setSendResult("Error: " + e.message);
    } finally {
      setSending(false);
    }
  }

  // Stats
  const totalRevenue = registrations.filter((r) => r.paid).reduce((sum, r) => sum + (r.class?.price || 0), 0);
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const attendanceRate = registrations.length > 0
    ? Math.round((registrations.filter((r) => r.attended).length / registrations.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3"><a href="/" aria-label="Return to homepage" title="Return to homepage" className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600"><Home className="size-5" /></a><h1 className="text-xl font-bold text-gray-900">Chipo&apos;s Admin</h1></div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline">{totalStudents} students • {totalClasses} classes</span>
              <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">C</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Students", value: totalStudents, icon: Users, color: "bg-blue-100 text-blue-600" },
            { label: "Total Classes", value: totalClasses, icon: BookOpen, color: "bg-brand-100 text-brand-600" },
            { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
            { label: "Attendance Rate", value: `${attendanceRate}%`, icon: BarChart3, color: "bg-purple-100 text-purple-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <a href="/api/export?type=students&format=csv" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Students (CSV)
          </a>
          <a href="/api/export?type=registrations&format=csv" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Registrations (CSV)
          </a>
          <a href="/api/export?type=orders&format=csv" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Orders (CSV)
          </a>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {([
              { key: "registrations", label: "Registrations", icon: Users },
              { key: "students", label: "Students", icon: Users },
              { key: "classes", label: "Classes", icon: BookOpen },
              { key: "products", label: "Shop products", icon: Package },
              { key: "videos", label: "Videos", icon: Play },
              { key: "messages", label: "Message History", icon: MessageSquare },
              { key: "analytics", label: "Analytics", icon: BarChart3 },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* REGISTRATIONS TAB */}
            {activeTab === "registrations" && (
              <div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudents(new Set()); setSelectAll(false); }}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.title} — {formatDate(c.class_date)}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or class..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedClass && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-brand-50 rounded-xl">
                    <span className="text-sm font-medium text-brand-700">
                      {selectedStudents.size} selected
                    </span>
                    <button
                      onClick={() => { setComposerChannel("whatsapp"); setShowComposer(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> Send WhatsApp
                    </button>
                    <button
                      onClick={() => { setComposerChannel("email"); setShowComposer(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      <Mail className="w-4 h-4" /> Send Email
                    </button>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attended</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Certificate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searchedRegs.map((reg) => (
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(reg.student_id)}
                              onChange={() => toggleSelect(reg.student_id)}
                              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 text-sm">{reg.student.full_name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {reg.student.phone || "No phone added"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{reg.class.title}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              reg.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {reg.paid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {reg.paid ? "Paid" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => markAttendance(reg.id, !reg.attended)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                reg.attended
                                  ? "bg-brand-100 text-brand-700"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {reg.attended ? "Yes" : "Mark"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {reg.certificate_issued ? (
                              <span className="text-xs text-green-600 font-medium">Issued</span>
                            ) : reg.attended ? (
                              <button
                                onClick={() => issueCertificate(reg)}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200"
                              >
                                Issue
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setSelectedClass(reg.class_id); setSelectedStudents(new Set([reg.student_id])); setComposerChannel("whatsapp"); setShowComposer(true); }}
                              className="text-brand-600 hover:text-brand-700 text-xs font-medium"
                            >
                              Message
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === "students" && (
              <div className="space-y-8">
                <section>
                  <div className="mb-4"><h2 className="text-lg font-bold text-gray-900">Account roles</h2><p className="text-sm text-gray-500">Set your own profile&apos;s role to <strong>admin</strong> in the Supabase Table Editor. Admin accounts cannot delete themselves.</p></div>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full min-w-[650px]"><thead><tr className="border-b border-gray-100 bg-gray-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Joined</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{profiles.map((profile) => <tr key={profile.id}><td className="px-4 py-3 text-sm font-medium text-gray-900">{profile.full_name || "Unnamed account"}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${profile.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{profile.role}</span></td><td className="px-4 py-3 text-sm text-gray-500">{formatDate(profile.created_at)}</td><td className="px-4 py-3"><div className="flex gap-2">{profile.role === "student" ? <button onClick={() => updateProfileRole(profile, "admin")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500">Make admin</button> : <button onClick={() => updateProfileRole(profile, "student")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500">Remove admin</button>}{profile.role === "student" && <button onClick={() => deleteStudentProfile(profile)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete student</button>}</div></td></tr>)}</tbody></table>
                  </div>
                </section>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classes</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((s) => {
                      const studentRegs = registrations.filter((r) => r.student_id === s.id);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{s.full_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{s.email || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{studentRegs.length}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                          <td className="px-4 py-3"><button onClick={() => promoteToStudent(s)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-600">{s.is_student ? "Remove from students" : "Add to students"}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* CLASSES TAB */}
            {activeTab === "classes" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Class catalogue</h2><p className="text-sm text-gray-500">Create, edit, publish, archive, and remove classes.</p></div><button onClick={() => startClassEdit()} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"><Plus className="size-4" /> New class</button></div>
                {showClassForm && <form onSubmit={saveClass} className="grid gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 md:grid-cols-2"><input required placeholder="Class title" value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input required type="datetime-local" value={classForm.class_date} onChange={(e) => setClassForm({ ...classForm, class_date: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><textarea required placeholder="Description" value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} className="min-h-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" /><div className="grid grid-cols-3 gap-2"><input required type="number" step="0.01" placeholder="Price" value={classForm.price} onChange={(e) => setClassForm({ ...classForm, price: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input required type="number" placeholder="Duration" value={classForm.duration_minutes} onChange={(e) => setClassForm({ ...classForm, duration_minutes: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input required type="number" placeholder="Max students" value={classForm.max_students} onChange={(e) => setClassForm({ ...classForm, max_students: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-600 md:col-span-2"><ImagePlus className="size-5 text-brand-500" /><span className="flex-1">{classForm.image_url ? "Class image selected" : "Upload class image"}</span><input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { await handleClassImageUpload(file); } catch (error: any) { alert(error.message || "Image upload failed."); } }} /></label>{classForm.image_url && <img src={classForm.image_url} alt="Selected class preview" className="h-32 w-full rounded-lg object-cover md:col-span-2" />}<div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">{editingClass ? "Save changes" : "Create class"}</button><button type="button" onClick={() => setShowClassForm(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button></div></form>}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="contents">
                {classes.map((c) => {
                  const classRegs = registrations.filter((r) => r.class_id === c.id);
                  const paidCount = classRegs.filter((r) => r.paid).length;
                  return (
                    <div key={c.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <h3 className="break-words font-bold text-gray-900">{c.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(c.class_date)}</p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-600">{classRegs.length} registered</span>
                        <span className="text-green-600">{paidCount} paid</span>
  <span className="font-medium">{formatCurrency(c.price, c.currency)}</span>
  </div>
  <div className="flex flex-col gap-3 border-t border-gray-200 pt-3 sm:flex-row sm:items-end sm:justify-between">
    <span className={`text-xs font-semibold ${c.archived_at ? "text-gray-500" : "text-green-600"}`}>{c.archived_at ? "Archived" : "Published on homepage"}</span>
    <div className="flex flex-wrap gap-2">
      <button onClick={() => toggleJoinEnabled(c)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${c.join_enabled ? "bg-brand-500 text-white" : "border border-gray-200 bg-white text-gray-700"}`}>{c.join_enabled ? "Join active" : "Enable Join"}</button>
      <button onClick={() => copyClassLink(c)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-600">Copy link</button>
      <button onClick={() => toggleClassArchive(c)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-600">{c.archived_at ? "Republish" : "Archive class"}</button>
      <button onClick={() => startClassEdit(c)} aria-label={`Edit ${c.title}`} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:border-brand-500"><Pencil className="size-4" /></button>
      <button onClick={() => deleteClass(c)} aria-label={`Delete ${c.title}`} className="rounded-lg border border-red-100 bg-white p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
    </div>
  </div>
  </div>
                  );
                })}
              </div>
              </div>
              </div>
            )}

  {/* PRODUCTS TAB */}
  {activeTab === "products" && (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Shop catalogue</h2><p className="text-sm text-gray-500">Manage products, pricing, inventory, and visibility.</p></div><button onClick={() => startProductEdit()} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"><Plus className="size-4" /> New product</button></div>
      {showProductForm && <form onSubmit={saveProduct} className="grid gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 md:grid-cols-2"><input required placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input required type="number" step="0.01" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><textarea required placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="min-h-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:col-span-2" /><div className="grid grid-cols-3 gap-2"><input required type="number" placeholder="Stock quantity" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><input placeholder="Weight (g)" value={productForm.weight_grams} onChange={(e) => setProductForm({ ...productForm, weight_grams: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></div><input placeholder="Image URL" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /><div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">{editingProduct ? "Save changes" : "Create product"}</button><button type="button" onClick={() => setShowProductForm(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button></div></form>}
      <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[700px]"><thead><tr className="border-b border-gray-100 bg-gray-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Product</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Price</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Stock</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{products.map((product) => <tr key={product.id}><td className="px-4 py-3"><div className="font-semibold text-gray-900">{product.name}</div><div className="text-xs text-gray-500">{product.category}</div></td><td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(product.price, product.currency)}</td><td className="px-4 py-3 text-sm text-gray-700">{product.stock_quantity}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{product.is_active ? "Active" : "Hidden"}</span></td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => toggleProduct(product)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">{product.is_active ? "Hide" : "Activate"}</button><button onClick={() => startProductEdit(product)} aria-label={`Edit ${product.name}`} className="rounded-lg border border-gray-200 p-2 text-gray-700"><Pencil className="size-4" /></button><button onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} className="rounded-lg border border-red-100 p-2 text-red-600"><Trash2 className="size-4" /></button></div></td></tr>)}</tbody></table></div>
    </div>
  )}

  {/* VIDEOS TAB */}
  {activeTab === "videos" && (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold text-gray-900">Video access</h2><p className="text-sm text-gray-500">Configure streaming, downloads, quality, and publishing for each replay.</p></div>
      {videos.map((video) => (
        <div key={video.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h3 className="font-semibold text-gray-900">{video.title}</h3><p className="text-xs text-gray-500">Provider path is kept server-side for protected delivery.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={video.access_mode} onChange={(e) => updateVideo(video, { access_mode: e.target.value as VideoAsset["access_mode"] })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="stream">Stream only</option><option value="download">Download only</option><option value="both">Stream + download</option></select>
              <button onClick={() => updateVideo(video, { is_published: !video.is_published })} className={`rounded-lg px-3 py-2 text-sm font-semibold ${video.is_published ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{video.is_published ? "Published" : "Unpublished"}</button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500"><span>Download limit: {video.download_limit}</span><span>Qualities: {(video.qualities || []).join(", ") || "Not set"}</span></div>
        </div>
      ))}
    </div>
  )}

  {/* ANALYTICS TAB */}
  {activeTab === "analytics" && <AnalyticsDashboard />}

            {/* MESSAGES TAB */}
            {activeTab === "messages" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Channel</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {messageLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.channel === "whatsapp" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {log.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{log.student?.full_name || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{log.class?.title || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === "sent" || log.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : log.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Send {composerChannel === "whatsapp" ? "WhatsApp" : "Email"} to {selectedStudents.size} Student{selectedStudents.size !== 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedClass ? classes.find((c) => c.id === selectedClass)?.title : "All classes"}
              </p>

              {composerChannel === "email" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={composerSubject}
                    onChange={(e) => setComposerSubject(e.target.value)}
                    placeholder="Class Reminder: Grilled Chicken Masterclass"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={composerMessage}
                  onChange={(e) => setComposerMessage(e.target.value)}
                  placeholder={composerChannel === "whatsapp"
                    ? "Hi {name}! Reminder: Your class starts in 2 hours. Get your ingredients ready! 🍳"
                    : "Hi {name},\n\nThis is a reminder about your upcoming class..."
                  }
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Use {'{name}'} to personalize with each student&apos;s name.</p>
              </div>

              {sendResult && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  {sendResult}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowComposer(false); setSendResult(""); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={composerChannel === "whatsapp" ? sendBulkWhatsApp : sendBulkEmail}
                  disabled={sending || !composerMessage || (composerChannel === "email" && !composerSubject)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending..." : "Send Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
