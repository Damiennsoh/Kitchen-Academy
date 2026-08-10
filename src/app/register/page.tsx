"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClientBrowser } from "@/lib/supabase";
import { Class } from "@/types";
import { formatDate, formatCurrency, formatPhoneNumber } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Clock, Users, CheckCircle, Loader2, ArrowLeft, Phone, Mail, User, CreditCard } from "lucide-react";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("class");
  const supabase = createClientBrowser();

  const [cls, setCls] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    experience: "beginner",
    dietaryNotes: "",
  });

  useEffect(() => {
    if (classId) fetchClass();
    else setLoading(false);
  }, [classId]);

  async function fetchClass() {
    const { data } = await supabase.from("classes").select("*").eq("id", classId).single();
    setCls(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setAuthRequired(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setAuthRequired(true);
        setMessage("Please sign in before registering for a class.");
        return;
      }
      if (!classId) throw new Error("This class link is missing a class ID.");

      const formattedPhone = formatPhoneNumber(formData.phone);
      const userId = authData.user.id;

      // Students are owned by the authenticated Supabase user. This matches
      // the students_self_insert policy (students.id = auth.uid()).
      const { data: existingStudent, error: lookupError } = await supabase
        .from("students")
        .select("id, phone")
        .eq("id", userId)
        .maybeSingle();
      if (lookupError) throw lookupError;

      let studentId = userId;
      if (existingStudent) {
        const { error: updateError } = await supabase.from("students").update({
          full_name: formData.fullName,
          phone: formattedPhone,
          email: formData.email || null,
        }).eq("id", userId);
        if (updateError) throw updateError;
      } else {
        const { error: studentError } = await supabase.from("students").insert({
          id: userId,
          full_name: formData.fullName,
          phone: formattedPhone,
          email: formData.email || null,
        });
        if (studentError) {
          if (studentError.code === "23505") throw new Error("This phone number is already linked to another account.");
          throw studentError;
        }
      }

      const { error: regError } = await supabase.from("registrations").insert({
        student_id: studentId,
        class_id: classId,
        paid: false,
      });

      if (regError) {
        if (regError.code === "23505" || regError.message.toLowerCase().includes("duplicate")) {
          setMessage("You are already registered for this class!");
          return;
        }
        if (regError.code === "42501") throw new Error("Your session has expired. Please sign in again and retry.");
        throw regError;
      }

      setSubmitted(true);
    } catch (err: any) {
      setMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Not Found</h2>
          <p className="text-gray-600 mb-6">The class you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/classes" className="inline-flex items-center gap-2 text-brand-600 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Browse All Classes
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              You&apos;re registered for <strong>{cls.title}</strong>. 
              Please complete your payment to secure your spot.
            </p>
            <div className="bg-brand-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-1"><strong>Class:</strong> {cls.title}</p>
              <p className="text-sm text-gray-700 mb-1"><strong>Date:</strong> {formatDate(cls.class_date)}</p>
              <p className="text-sm text-gray-700 mb-1"><strong>Amount:</strong> {formatCurrency(cls.price, cls.currency)}</p>
              <p className="text-sm text-gray-700"><strong>Phone:</strong> {formatPhoneNumber(formData.phone)}</p>
            </div>
            <div className="space-y-3">
              <button className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors">
                Pay with EcoCash
              </button>
              <button className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Pay with Card (USD)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              You&apos;ll receive a WhatsApp confirmation once payment is verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link href="/classes" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </Link>

        {/* Class Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{cls.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{cls.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-4 h-4 text-brand-500" /> {formatDate(cls.class_date)}
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-4 h-4 text-brand-500" /> {cls.duration_minutes} min
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <Users className="w-4 h-4 text-brand-500" /> Max {cls.max_students}
            </span>
            <span className="font-bold text-brand-600">{formatCurrency(cls.price, cls.currency)}</span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Register for This Class</h3>
          <p className="text-gray-500 text-sm mb-6">Fill in your details. Payment is required to confirm your spot.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" /> Full Name
              </label>
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Tariro Moyo"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" /> Phone Number (WhatsApp)
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0771 234 567"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-500 mt-1">We&apos;ll send class reminders to this number.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cooking Experience</label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="beginner">Beginner — I burn water</option>
                <option value="intermediate">Intermediate — I can follow a recipe</option>
                <option value="advanced">Advanced — I cook for others</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions / Notes</label>
              <textarea
                value={formData.dietaryNotes}
                onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
                placeholder="Any allergies, dietary needs, or questions for Chipo?"
                rows={3}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              Complete Registration
            </button>

            {message && (
              <div className={`rounded-lg p-3 text-sm font-medium ${
                message.includes("already") || message.includes("failed") || authRequired || message.includes("expired") || message.includes("another account")
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}>
                <p>{message}</p>
                {authRequired && <Link href={`/auth?redirect=${encodeURIComponent(`/register?class=${classId}`)}`} className="mt-2 inline-block font-semibold underline">Sign in to continue</Link>}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
