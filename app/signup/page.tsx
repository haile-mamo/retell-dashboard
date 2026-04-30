"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Sparkles, Mic, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        const user = authData.user;

        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert([
            { 
              name: `${fullName}'s Workspace`,
              slug: fullName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000),
              brand_color: "#10b981"
            }
          ])
          .select()
          .single();

        if (orgError) throw orgError;

        if (newOrg) {
          const { error: linkError } = await supabase
            .from("organization_users")
            .insert([
              {
                org_id: newOrg.id,
                user_id: user.id,
                email: user.email,
                role: 'admin'
              }
            ]);

          if (linkError) throw linkError;
          router.push(`/dashboard/${newOrg.id}`);
        }
      }
    } catch (error: any) {
      alert(error.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#050505] text-white font-sans">
      
      {/* Left Side: Marketing/Value Proposition */}
      <div className="lg:w-1/2 p-12 flex flex-col justify-center bg-zinc-900/10 border-r border-zinc-800/50">
        <div className="max-w-md space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} /> The Future of Communication
          </div>

          <h1 className="text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.9]">
            Human-like <span className="text-emerald-500">AI Voice</span> Solutions
          </h1>
          
          <p className="text-zinc-400 text-lg font-medium leading-relaxed">
            Deploy ultra-realistic AI agents that follow your custom instructions. From recording to high-level execution.
          </p>

          <div className="grid gap-6 py-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                <Mic size={20} className="text-emerald-500" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Ultra-Realistic Voice</h4>
                <p className="text-xs text-zinc-500">Natural cadence and emotion-aware AI speech technology.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                <Clock size={20} className="text-emerald-500" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Save Hours Daily</h4>
                <p className="text-xs text-zinc-500">Automate call-handling and data logging instantly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Scale Your Business</h4>
                <p className="text-xs text-zinc-500">Grow exponentially with 24/7 automated intelligence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Sign Up Form */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-12">
        <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-5 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Create <span className="text-emerald-500">Account</span></h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Begin your AI journey in seconds</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <input 
                required
                type="text" 
                placeholder="FULL NAME" 
                className="p-5 rounded-2xl bg-zinc-900/50 w-full border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all text-xs font-bold tracking-widest placeholder:text-zinc-700"
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <input 
              required
              type="email" 
              placeholder="EMAIL ADDRESS" 
              className="p-5 rounded-2xl bg-zinc-900/50 w-full border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all text-xs font-bold tracking-widest placeholder:text-zinc-700"
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <input 
              required
              type="password" 
              placeholder="PASSWORD" 
              className="p-5 rounded-2xl bg-zinc-900/50 w-full border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all text-xs font-bold tracking-widest placeholder:text-zinc-700"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {loading ? "Initializing..." : "Get Started Now"}
          </button>

          <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-6">
            Already registered? <a href="/login" className="text-white hover:text-emerald-500 transition-colors">Login Here</a>
          </p>
        </form>
      </div>
    </div>
  );
}