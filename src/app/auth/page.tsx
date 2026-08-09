"use client";

import { useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Phone, Mail, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userExists, setUserExists] = useState(false);

  const supabase = createClientBrowser();

  const formatPhone = (input: string) => {
    let cleaned = input.replace(/\s/g, "").replace(/-/g, "");
    if (cleaned.startsWith("0")) cleaned = "+263" + cleaned.slice(1);
    if (!cleaned.startsWith("+") && cleaned.length > 0) cleaned = "+263" + cleaned;
    return cleaned;
  };

  const sendOTP = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "phone") {
        const formattedPhone = formatPhone(phone);
        if (!formattedPhone || formattedPhone.length < 10) {
          setMessage("Please enter a valid phone number");
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
        if (error) throw error;
        setOtpSent(true);
        setMessage("OTP sent! Check your WhatsApp/SMS.");
      } else {
        if (!email || !email.includes("@")) {
          setMessage("Please enter a valid email");
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setOtpSent(true);
        setMessage("Magic link sent! Check your email inbox.");
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "phone") {
        const formattedPhone = formatPhone(phone);
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: "sms",
        });
        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Authentication could not be completed");

        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existing) {
          setUserExists(false);
          setMessage("OTP verified. Complete your profile below.");
        } else {
          setUserExists(true);
          setMessage("Welcome back! Redirecting...");
          window.location.href = "/classes";
        }
      }
    } catch (err: any) {
      setMessage(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.from("students").upsert({
        id: user.id,
        full_name: fullName,
        phone: formattedPhone,
        email: user.email || email || null,
        whatsapp_opt_in: true,
      }, { onConflict: "id" });

      if (error) throw error;
      setMessage("Profile created! Redirecting...");
      window.location.href = "/classes";
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Chipo&apos;s Kitchen</h1>
          <p className="text-gray-600">Sign in to register for classes and track your progress.</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 flex mb-6">
          <button
            onClick={() => { setMode("phone"); setOtpSent(false); setMessage(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              mode === "phone" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Phone className="w-4 h-4" /> Phone
          </button>
          <button
            onClick={() => { setMode("email"); setOtpSent(false); setMessage(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              mode === "email" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {!otpSent ? (
            <div className="space-y-5">
              {mode === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0771 234 567"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Enter your Zimbabwe number. We&apos;ll send an OTP via WhatsApp/SMS.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">We&apos;ll send you a magic link to sign in instantly.</p>
                </div>
              )}

              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {mode === "phone" ? "Send OTP" : "Send Magic Link"}
              </button>
            </div>
          ) : mode === "phone" ? (
            <div className="space-y-5">
              {!userExists && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tariro Moyo"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-[0.5em] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                onClick={userExists ? verifyOTP : async () => {
                  await verifyOTP();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user && fullName) await createProfile();
                }}
                disabled={loading || (!userExists && !fullName) || !otp}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {userExists ? "Verify & Sign In" : "Create Account"}
              </button>

              <button
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-brand-600"
              >
                Didn&apos;t receive it? Send again
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
              <p className="text-gray-600">We&apos;ve sent a magic link to {email}. Click it to sign in instantly.</p>
              <button
                onClick={() => setOtpSent(false)}
                className="mt-6 text-brand-600 font-medium hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.includes("sent") || message.includes("created") || message.includes("Welcome")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {message}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to receive class reminders via WhatsApp.{" "}
          <Link href="#" className="text-brand-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
