"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Copy, Share2, Users, DollarSign, Award, Loader2, CheckCircle } from "lucide-react";

export default function AffiliatePage() {
  const [user, setUser] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClientBrowser();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth?redirect=/affiliate";
      return;
    }
    setUser(user);
    await fetchAffiliateData(user.id);
  }

  async function fetchAffiliateData(userId: string) {
    // Check if already an affiliate
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("student_id", userId)
      .single();

    if (aff) {
      setAffiliate(aff);
      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select("*, referred:students(full_name)")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });
      setReferrals(refs || []);
    }

    setLoading(false);
  }

  async function joinAffiliate() {
    if (!user) return;

    const referralCode = "CHIPO" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        student_id: user.id,
        referral_code: referralCode,
        commission_rate: 10.00,
      })
      .select()
      .single();

    if (!error && data) {
      setAffiliate(data);
    }
  }

  function copyLink() {
    if (!affiliate) return;
    const link = `${window.location.origin}/auth?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Program</h1>
        <p className="text-gray-600 mb-8">Invite friends to Cooking with Chipo and earn 10% commission on their first purchase.</p>

        {!affiliate ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Award className="w-16 h-16 text-brand-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Become an Affiliate</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Share your unique referral link with friends. When they sign up and buy a class or spice, you earn 10% commission.
            </p>
            <button
              onClick={joinAffiliate}
              className="px-8 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Join Now — It&apos;s Free
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Referral Link Card */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 sm:p-8 text-white">
              <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
              <div className="flex gap-3">
                <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-sm font-mono truncate">
                  {typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${affiliate.referral_code}` : "Loading..."}
                </div>
                <button
                  onClick={copyLink}
                  className="px-4 py-3 bg-white text-brand-600 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex gap-4 mt-6">
                <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{affiliate.total_referrals}</div>
                  <div className="text-sm text-brand-100">Referrals</div>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${affiliate.total_earnings.toFixed(2)}</div>
                  <div className="text-sm text-brand-100">Earned</div>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
                  <Award className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{affiliate.commission_rate}%</div>
                  <div className="text-sm text-brand-100">Commission</div>
                </div>
              </div>
            </div>

            {/* Referrals Table */}
            {referrals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Your Referrals</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{ref.referred?.full_name || "Anonymous"}</div>
                        <div className="text-sm text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ref.status === "paid" ? "bg-green-100 text-green-700" :
                        ref.status === "approved" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {ref.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Share Your Link</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["WhatsApp", "Facebook", "Twitter", "Copy Link"].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => {
                      if (platform === "Copy Link") copyLink();
                      else alert(`Share to ${platform} — integrate with share API`);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
