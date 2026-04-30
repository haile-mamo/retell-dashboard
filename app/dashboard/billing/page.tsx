"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, ArrowLeft, CheckCircle2, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BillingPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);

  // የድርጅቱን መረጃ (ብራንድ ከለር) ከ Supabase ለማንበብ
  useEffect(() => {
    async function fetchOrg() {
      const { data } = await supabase.from("organizations").select("*").single();
      if (data) setOrgData(data);
      setLoading(false);
    }
    fetchOrg();
  }, []);

  const handlePayment = () => {
    setIsRedirecting(true);
    // ትክክለኛ የ Stripe ሊንክ
    window.location.href = "https://buy.stripe.com/test_00w00c8Py1i601yaDb8g000";
  };

  const brandColor = orgData?.brand_color || "#2563eb";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <Link
            href="/dashboard"
            className="flex items-center text-zinc-500 hover:text-white transition-all group w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="text-left md:text-right">
            <h1 className="text-3xl font-black tracking-tight">Billing & Credits</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your usage and payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Payment Card */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-400">
                <Wallet size={24} />
              </div>
              <h2 className="text-xl font-bold">Available Balance</h2>
            </div>

            <div className="flex items-baseline gap-3 mb-10">
              <span className="text-7xl font-black tracking-tighter">$0.00</span>
              <span className="text-zinc-500 font-bold tracking-widest uppercase text-sm">USD</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 text-zinc-300 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800/50">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Pay-as-you-go</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800/50">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">No Monthly Fees</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isRedirecting}
              style={{ backgroundColor: isRedirecting ? '#18181b' : brandColor }}
              className="w-full bg-blue-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-black font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/10"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  ADD $10.00 CREDITS
                </>
              )}
            </button>
            
            <p className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-6">
              🔒 Secure encrypted payment via Stripe
            </p>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem]">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-blue-500"></span>
                Pricing Details
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Adding <span className="text-white font-bold">$10.00</span> will give you roughly <span className="text-white font-bold">60 minutes</span> of high-quality AI voice interaction.
              </p>
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Questions?</p>
                <p className="text-xs text-zinc-400 mt-2">Contact support for custom enterprise volume pricing.</p>
              </div>
            </div>

            <div className="p-1 rounded-[2rem] bg-gradient-to-br from-zinc-800 to-transparent">
               <div className="bg-black p-8 rounded-[1.9rem]">
                  <p className="text-xs text-zinc-500 font-medium">Credits never expire and are applied instantly to your account after a successful transaction.</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}