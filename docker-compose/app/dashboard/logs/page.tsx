"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Phone, Loader2, PlayCircle } from "lucide-react";

export default function ClientCallLogs() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalls() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("calls")
          .select("*")
          .eq("user_id", user.id) 
          .order("created_at", { ascending: false });
        if (data) setCalls(data);
      }
      setLoading(false);
    }
    fetchCalls();
  }, []);

  const handlePlayRecording = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("No recording available for this call.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12 border-b border-zinc-900 pb-8">
          <div>
            <Link href="/dashboard" className="flex items-center text-zinc-500 hover:text-emerald-400 transition-all group mb-2 text-sm">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Call History
            </h1>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/40 text-zinc-400 text-[11px] font-black uppercase tracking-[0.3em] border-b border-zinc-800">
                  <th className="px-10 py-7">Status</th>
                  <th className="px-10 py-7">Date</th>
                  <th className="px-10 py-7">Duration</th>
                  <th className="px-10 py-7">Provider</th>
                  <th className="px-10 py-7 text-right">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {calls.length > 0 ? (
                  calls.map((call) => (
                    <tr key={call.id} className="hover:bg-emerald-500/[0.03] transition-all group">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                             <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                          </div>
                          <span className="font-black italic uppercase text-sm tracking-tighter text-emerald-500">
                             {call.status || "Completed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-zinc-300 font-medium">
                        {new Date(call.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-10 py-7 text-sm font-bold text-zinc-400">
                        {call.duration || 0} SEC
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-[10px] font-black uppercase text-zinc-600 bg-zinc-800/30 px-2 py-1 rounded italic">
                          {call.provider_type || "Vapi AI"}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button 
                          onClick={() => handlePlayRecording(call.recording_url)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black p-3 rounded-2xl transition-all transform group-hover:scale-110 shadow-lg shadow-emerald-500/20"
                        >
                          <PlayCircle size={22} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <Phone className="mb-4 text-zinc-500" size={64} strokeWidth={1} />
                        <p className="text-xl font-black italic uppercase tracking-widest text-zinc-500">
                          No Call Logs Found
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}