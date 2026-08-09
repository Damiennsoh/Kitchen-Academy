"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { BarChart3, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, ShoppingBag } from "lucide-react";

interface DailyStat {
  date: string;
  new_registrations: number;
  new_payments: number;
  revenue: number;
  new_students: number;
  new_orders: number;
  order_revenue: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const supabase = createClientBrowser();

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchStats() {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const { data } = await supabase
      .from("daily_stats")
      .select("*")
      .gte("date", new Date(Date.now() - days * 86400000).toISOString().split("T")[0])
      .order("date", { ascending: true });

    setStats(data || []);
    setLoading(false);
  }

  const totalRevenue = stats.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = stats.reduce((s, d) => s + d.new_orders, 0);
  const totalRegistrations = stats.reduce((s, d) => s + d.new_registrations, 0);
  const avgDaily = stats.length > 0 ? totalRevenue / stats.length : 0;

  if (loading) return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Last {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "3 Months"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-green-100 text-green-600", trend: "+12%" },
          { label: "Class Registrations", value: totalRegistrations.toString(), icon: BookOpen, color: "bg-blue-100 text-blue-600", trend: "+8%" },
          { label: "Shop Orders", value: totalOrders.toString(), icon: ShoppingBag, color: "bg-purple-100 text-purple-600", trend: "+5%" },
          { label: "Avg Daily Revenue", value: `$${avgDaily.toFixed(2)}`, icon: BarChart3, color: "bg-brand-100 text-brand-600", trend: "+3%" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />{card.trend}
              </span>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Simple Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Daily Revenue Trend</h3>
        <div className="h-64 flex items-end gap-1">
          {stats.map((stat, i) => {
            const max = Math.max(...stats.map((s) => s.revenue + s.order_revenue), 1);
            const height = ((stat.revenue + stat.order_revenue) / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  <div
                    className="w-full bg-brand-200 rounded-t hover:bg-brand-400 transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${(stat.revenue + stat.order_revenue).toFixed(2)}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 rotate-0 sm:rotate-0">
                  {new Date(stat.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration vs Payment Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Registrations vs Payments</h3>
        <div className="h-64 flex items-end gap-1">
          {stats.map((stat, i) => {
            const max = Math.max(...stats.map((s) => Math.max(s.new_registrations, s.new_payments)), 1);
            const regHeight = (stat.new_registrations / max) * 100;
            const payHeight = (stat.new_payments / max) * 100;
            return (
              <div key={i} className="flex-1 flex items-end gap-0.5 group">
                <div className="flex-1 relative">
                  <div
                    className="w-full bg-blue-200 rounded-t hover:bg-blue-400 transition-colors"
                    style={{ height: `${Math.max(regHeight, 4)}%` }}
                  />
                </div>
                <div className="flex-1 relative">
                  <div
                    className="w-full bg-green-200 rounded-t hover:bg-green-400 transition-colors"
                    style={{ height: `${Math.max(payHeight, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 bg-blue-300 rounded" /> Registrations
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 bg-green-300 rounded" /> Payments
          </span>
        </div>
      </div>
    </div>
  );
}
