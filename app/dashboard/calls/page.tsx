"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, Trash2 } from "lucide-react";

// Next.js ገጽ የሚቀበላቸው ትክክለኛ የ Props አይነቶች
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function CallLogsPage({ searchParams }: PageProps) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // 1. የተጠቃሚውን Session እና Admin መሆኑን ማረጋገጥ
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // እዚህ ጋር የአድሚን ኢሜይልህን አስገባ (ለምሳሌ: "admin@example.com")
        // ወይም ደግሞ በ Supabase metadata ውስጥ ካለህ እሱን ተጠቀም
        if (session.user.email === "haile@example.com") {
          setIsAdminUser(true);
        }
      }
    }
    checkUser();
  }, []);

  // 2. ዳታዎችን ከ Supabase መጫን
  useEffect(() => {
    async function fetchCalls() {
      if (!user) return; // ተጠቃሚው ገና ካልታወቀ ምንም አያደርግም

      setLoading(true);
      try {
        let query = supabase.from("calls").select("*");
        
        // አድሚን ካልሆነ የራሱን ብቻ እንዲያይ ማጣራት
        if (!isAdminUser) {
          query = query.eq("user_id", user.id); 
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        if (data) setCalls(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) fetchCalls();
  }, [user, isAdminUser]);

  // መረጃን የመሰረዝ ተግባር
  const handleDelete = async (callId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase
        .from("calls")
        .delete()
        .eq("id", callId);

      if (error) throw error;
      setCalls(calls.filter(call => call.id !== callId));
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // መረጃው እስኪጫን የሚታይ ማሳያ
  if (loading && !user) return (
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
              Call Logs
            </h1>
          </div>
          {isAdminUser && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Admin Access</span>
            </div>
          )}
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/40 text-zinc-400 text-[11px] font-black uppercase tracking-[0.3em] border-b border-zinc-800">
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6">Duration</th>
                  <th className="px-8 py-6">Cost</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {calls.length > 0 ? (
                  calls.map((call) => (
                    <tr key={call.id} className="hover:bg-emerald-500/[0.03] transition-all group">
                      <td className="px-8 py-6 font-bold italic uppercase text-xs text-emerald-500">
                        {call.status || "Completed"}
                      </td>
                      <td className="px-8 py-6 text-zinc-400 text-sm">
                        {new Date(call.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-zinc-800/50 px-2 py-1 rounded text-xs font-mono text-zinc-300">
                          {call.duration || 0}s
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-emerald-400 font-bold font-mono text-sm">
                          ${(call.cost || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {call.recording_url ? (
                            <audio controls className="h-8 w-40 custom-audio">
                              <source src={call.recording_url} type="audio/mpeg" />
                            </audio>
                          ) : <span className="text-xs text-zinc-700 italic">No Audio</span>}
                          <button 
                            onClick={() => handleDelete(call.id)}
                            className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-zinc-600 italic">
                      No call records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-audio::-webkit-media-controls-panel { filter: invert(100%) hue-rotate(90deg); }
      `}</style>
    </div>
  );
}