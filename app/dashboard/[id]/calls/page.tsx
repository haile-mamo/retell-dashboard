"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Phone, Plus, Loader2, X, PlayCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentThemeColor = "#10b981"; 

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setAgents(data);
    }
    setLoading(false);
  };

  const handleDeleteAgent = async (agentId: string, vapiId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const res = await fetch("/api/vapi/delete-agent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, vapiId }),
      });

      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== agentId));
      } else {
        const errorData = await res.json();
        alert("Error: " + errorData.error);
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">AI Staffing</h1>
          <button className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all">
            <Plus size={18} /> Create New Agent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className="relative bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl border-t-2 group" 
              style={{ borderColor: currentThemeColor }}
            >
              <button 
                onClick={() => handleDeleteAgent(agent.id, agent.vapi_id)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors p-1 z-10"
              >
                <X size={18} />
              </button>

              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  <Phone size={20} />
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest mr-6">
                  Active
                </span>
              </div>

              <h4 className="font-bold text-lg mb-1">{agent.name}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 italic">Assistant</p>
              
              <p className="text-zinc-400 text-sm line-clamp-3 mb-6 min-h-[60px]">
                "{agent.prompt}"
              </p>

              <button className="w-full bg-zinc-800/50 hover:bg-zinc-800 text-white py-3 rounded-2xl font-bold text-sm transition-all border border-zinc-700/50">
                Edit Configuration
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}