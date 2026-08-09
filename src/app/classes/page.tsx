"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Class } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Clock, Users, ArrowRight, Loader2, ChefHat } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientBrowser();

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("is_published", true)
      .is("archived_at", null)
      .order("class_date", { ascending: true });
    setClasses(data || []);
    setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Upcoming Classes</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Book your spot in Chipo&apos;s live masterclasses. Learn authentic Zimbabwean dishes 
            and earn your cooking certificate.
          </p>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes scheduled yet</h3>
            <p className="text-gray-500">Check back soon for new masterclasses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-brand-100 via-brand-200 to-chef-purple/20 flex items-center justify-center relative overflow-hidden">
                  <div className="text-7xl opacity-80">🍳</div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      cls.status === "upcoming"
                        ? "bg-green-100 text-green-700"
                        : cls.status === "live"
                        ? "bg-red-100 text-red-700 animate-pulse"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors leading-tight">
                      {cls.title}
                    </h3>
                    <span className="text-xl font-bold text-brand-600 shrink-0">
                      {formatCurrency(cls.price, cls.currency)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {cls.description}
                  </p>

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      <span>{formatDate(cls.class_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 text-brand-500" />
                      <span>{cls.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-brand-500" />
                      <span>Max {cls.max_students} students</span>
                    </div>
                  </div>

                  {cls.join_enabled ? (
                    <Link
                      href={cls.share_slug ? `/class/${cls.share_slug}` : `/register?class=${cls.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-brand-500 transition-colors"
                    >
                      Join class
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="flex cursor-not-allowed items-center justify-center gap-2 w-full rounded-xl bg-gray-100 py-3.5 font-semibold text-gray-400">Registration opening soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
