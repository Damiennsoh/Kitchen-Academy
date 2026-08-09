"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChefHat, Clock, Loader2 } from "lucide-react";
import { createClientBrowser } from "@/lib/supabase";
import { Class } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function PreviousClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientBrowser();

  useEffect(() => {
    supabase.from("classes").select("*").or("archived_at.not.is.null,is_published.eq.false").order("class_date", { ascending: false }).then(({ data }) => {
      setClasses(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/classes" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"><ArrowLeft className="size-4" /> Upcoming classes</Link>
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">The archive</p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Previous classes</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Explore the masterclasses we have already cooked together and keep your learning journey going.</p>
        </header>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-brand-500" /></div> : classes.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center"><ChefHat className="mx-auto mb-4 size-12 text-gray-300" /><p className="font-semibold text-gray-900">No previous classes yet</p></div> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{classes.map((cls) => <article key={cls.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-6xl">🍳</div><div className="flex flex-col gap-4 p-6"><div><p className="text-sm font-semibold text-brand-600">{formatDate(cls.class_date)}</p><h2 className="mt-1 text-xl font-bold text-gray-900">{cls.title}</h2></div><p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{cls.description}</p><div className="flex flex-col gap-2 text-sm text-gray-500"><span className="flex items-center gap-2"><Calendar className="size-4 text-brand-500" /> {formatDate(cls.class_date)}</span><span className="flex items-center gap-2"><Clock className="size-4 text-brand-500" /> {cls.duration_minutes} minutes</span></div><span className="text-sm font-semibold text-gray-500">Class fee: {formatCurrency(cls.price, cls.currency)}</span></div></article>)}</div>}
      </div>
    </main>
  );
}
