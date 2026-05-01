"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Settings, Palette, Building2, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrg() {
      const { data } = await supabase.from("organizations").select("*").single();
      if (data) {
        setOrg(data);
        setName(data.name);
        setColor(data.brand_color || "#2563eb");
      }
      setLoading(false);
    }
    fetchOrg();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ name, brand_color: color })
      .eq("id", org.id);

    if (!error) alert("Settings updated!");
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-zinc-700" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="flex items-center text-zinc-500 hover:text-white mb-12 group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-all" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-10 flex items-center gap-3">
          <Settings /> General Settings
        </h1>

        <div className="space-y-8 bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Organization Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Brand Color</label>
            <div className="flex gap-4 items-center">
              <input 
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-16 bg-transparent border-none cursor-pointer"
              />
              <input 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-black/50 border border-zinc-800 p-4 rounded-2xl font-mono"
              />
            </div>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={saving}
            style={{ backgroundColor: color }}
            className="w-full py-5 rounded-2xl text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}