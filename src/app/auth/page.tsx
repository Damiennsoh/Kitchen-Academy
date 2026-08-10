"use client";

import { FormEvent, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { ArrowRight, CheckCircle, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClientBrowser();

  function getSafeRedirect() {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    return redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/classes";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;

        if (data.session && data.user) {
          await supabase.from("students").upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: null,
          }, { onConflict: "id" });
          window.location.href = getSafeRedirect();
          return;
        }

        setSuccess(true);
        setMessage("Your account is ready. Check your email to confirm your account, then sign in with your password.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("students").upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split("@")[0],
            email: data.user.email,
            phone: null,
          }, { onConflict: "id" });
        }
        window.location.href = "/classes";
      }
    } catch (error: any) {
      const raw = String(error?.message || "");
      setMessage(raw.toLowerCase().includes("confirm") ? "Please confirm your email before signing in." : "Invalid email or password. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome to Chipo&apos;s Kitchen</h1>
          <p className="text-gray-600">Create an account to hear about upcoming classes.</p>
        </header>

        <div className="mb-6 flex rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
          {(["signin", "signup"] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setMode(item); setMessage(""); setSuccess(false); }} className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${mode === item ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {item === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5">
            {mode === "signup" && (
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Full name
                <span className="relative"><UserRound className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" /><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Tariro Moyo" /></span>
              </label>
            )}
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Email address
              <span className="relative"><Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="you@example.com" /></span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Password
              <span className="relative"><LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="At least 6 characters" /></span>
            </label>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-4 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50">
              {loading ? <Loader2 className="size-5 animate-spin" /> : success ? <CheckCircle className="size-5" /> : <ArrowRight className="size-5" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </div>
          {message && <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">Your account is separate from class registration. <Link href="/classes" className="text-brand-600 hover:underline">Browse classes</Link></p>
      </div>
    </main>
  );
}
