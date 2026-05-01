"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function AgentsPage() {
  const [org, setOrg] = useState<any>(null);
  const [provider, setProvider] = useState("vapi");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from("organizations").select("*").single();
        if (error) throw error;
        if (data) {
          setOrg(data);
          setProvider(data.ai_provider || "vapi");
          setApiKey(data.ai_api_key || "");
          setPrompt(data.system_prompt || ""); 
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const brandColor = org?.brand_color || "#2563eb";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          ai_provider: provider,
          ai_api_key: apiKey,
          system_prompt: prompt,
        })
        .eq("id", org.id);

      if (error) throw error;
      alert("✅ Configuration saved successfully!");
    } catch (error: any) {
      alert("Error saving: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-zinc-700" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/dashboard"
            className="flex items-center text-zinc-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
             <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }}></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Agent Status: Active</span>
          </div>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Configure AI Agent</h1>
          <p className="text-zinc-500 font-medium text-sm">Update your interchangeable AI voice provider and system instructions.</p>
        </header>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          
          {/* Provider Selection */}
          <div className="mb-12">
            <label className="block text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-[0.3em]">
              Step 1: Choose AI Engine
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setProvider("vapi")}
                className={`p-8 rounded-[1.5rem] border-2 transition-all flex flex-col items-start gap-4 ${provider === 'vapi' ? 'bg-zinc-900/80 border-blue-500' : 'bg-transparent border-zinc-800 opacity-40 hover:opacity-100'}`}
                style={provider === 'vapi' ? { borderColor: brandColor } : {}}
              >
                <Zap size={24} style={{ color: provider === 'vapi' ? brandColor : '#52525b' }} />
                <div className="text-left">
                  <p className="font-bold text-lg">Vapi AI</p>
                  <p className="text-xs text-zinc-500">Fast voice orchestration</p>
                </div>
              </button>

              <button 
                onClick={() => setProvider("retell")}
                className={`p-8 rounded-[1.5rem] border-2 transition-all flex flex-col items-start gap-4 ${provider === 'retell' ? 'bg-zinc-900/80 border-blue-500' : 'bg-transparent border-zinc-800 opacity-40 hover:opacity-100'}`}
                style={provider === 'retell' ? { borderColor: brandColor } : {}}
              >
                <Sparkles size={24} style={{ color: provider === 'retell' ? brandColor : '#52525b' }} />
                <div className="text-left">
                  <p className="font-bold text-lg">Retell AI</p>
                  <p className="text-xs text-zinc-400">Natural conversation engine</p>
                </div>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="mb-12">
            <label className="block text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-[0.3em]">
              Step 2: {provider.toUpperCase()} Auth Key
            </label>
            <div className="relative">
              <input 
                type="password"
                placeholder={`sk_...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-6 bg-black/50 border border-zinc-800 rounded-2xl focus:outline-none focus:border-zinc-500 transition-all font-mono text-sm"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="mb-12">
            <label className="block text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-[0.3em]">
              Step 3: System Instructions
            </label>
            <textarea 
              rows={5}
              placeholder="Describe how the AI should behave..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-6 bg-black/50 border border-zinc-800 rounded-2xl focus:outline-none focus:border-zinc-500 transition-all text-sm leading-relaxed resize-none"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-6 rounded-2xl text-black font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Save Changes</>}
          </button>

        </div>
      </div>
    </div>
  );
}