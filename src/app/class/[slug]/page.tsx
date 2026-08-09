"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle, Clock, Loader2, Users } from "lucide-react";
import { createClientBrowser } from "@/lib/supabase";
import { Class } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SharedClassPage({ params }: { params: { slug: string } }) {
  const [classItem, setClassItem] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const supabase = createClientBrowser();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("classes").select("*").eq("share_slug", params.slug).maybeSingle();
      if (!data) setMissing(true);
      setClassItem(data);
      setLoading(false);
      if (data) await supabase.from("class_link_events").insert({ class_id: data.id, event_type: "click" });
    }
    load();
  }, [params.slug]);

  if (loading) return <main className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-brand-500" /></main>;
  if (missing || !classItem) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"><h1 className="text-3xl font-bold text-gray-900">This class link is no longer available</h1><p className="text-gray-600">The class may have been archived or the link may be incorrect.</p><Link href="/classes" className="font-semibold text-brand-600">Browse upcoming classes</Link></main>;

  return <main className="min-h-screen bg-gray-50 py-10 sm:py-16"><div className="mx-auto max-w-4xl px-4 sm:px-6"><div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"><div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-brand-100 via-brand-200 to-brand-300 text-8xl">🍳</div><div className="flex flex-col gap-8 p-6 sm:p-10"><div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Chipo&apos;s Kitchen live masterclass</p><h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">{classItem.title}</h1><p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">{classItem.description}</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-gray-50 p-4"><Calendar className="mb-2 size-5 text-brand-500" /><p className="text-xs font-semibold uppercase text-gray-500">Date</p><p className="mt-1 font-semibold text-gray-900">{formatDate(classItem.class_date)}</p></div><div className="rounded-2xl bg-gray-50 p-4"><Clock className="mb-2 size-5 text-brand-500" /><p className="text-xs font-semibold uppercase text-gray-500">Duration</p><p className="mt-1 font-semibold text-gray-900">{classItem.duration_minutes} minutes</p></div><div className="rounded-2xl bg-gray-50 p-4"><Users className="mb-2 size-5 text-brand-500" /><p className="text-xs font-semibold uppercase text-gray-500">Availability</p><p className="mt-1 font-semibold text-gray-900">{classItem.max_students} places</p></div></div><div className="flex flex-col items-start justify-between gap-5 border-t border-gray-100 pt-6 sm:flex-row sm:items-center"><div><p className="text-sm text-gray-500">Class investment</p><p className="text-3xl font-bold text-brand-600">{formatCurrency(classItem.price, classItem.currency)}</p></div><Link href={`/register?class=${classItem.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-4 font-semibold text-white hover:bg-brand-600 sm:w-auto">Register for this class <ArrowRight className="size-5" /></Link></div><div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm text-green-800"><CheckCircle className="mt-0.5 size-5 shrink-0" /><p>Create or sign in to your account during registration so your booking and class updates stay connected to you.</p></div></div></div></div></main>;
}
