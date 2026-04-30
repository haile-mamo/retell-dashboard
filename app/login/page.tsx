"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Sparkles } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        const { data: userRoleData, error: roleError } = await supabase
          .from('organization_users')
          .select('org_id')
          .eq('email', authData.user.email)
          .maybeSingle();

        if (roleError) {
          console.error("Fetch error:", roleError);
          router.push("/dashboard");
          return;
        }

        if (userRoleData && userRoleData.org_id) {
          router.push(`/dashboard/${userRoleData.org_id}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Login process error:", err);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 font-sans">
      
      {/* Welcome Message Section */}
      <div className="text-center mb-12 space-y-4 animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={12} /> AI-Powered Solutions
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
          Welcome <span className="text-emerald-500">Back</span>
        </h1>
        
        <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto">
          Welcome back! We are excited to have you return to our AI services.
        </p>
      </div>

      {/* Login Form Section */}
      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-sm space-y-5 bg-zinc-900/20 p-8 rounded-[2.5rem] border border-zinc-800/50 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-500">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="group">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">Email Credentials</label>
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              className="p-5 rounded-2xl bg-black/50 w-full border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all text-xs font-bold tracking-widest placeholder:text-zinc-800"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="group">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">Secure Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••" 
              className="p-5 rounded-2xl bg-black/50 w-full border border-zinc-800 focus:border-emerald-500 focus:outline-none transition-all text-xs font-bold tracking-widest placeholder:text-zinc-800"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95"
        >
          {loading ? (
            <span className="animate-pulse">Authenticating...</span>
          ) : (
            <>
              <LogIn size={16} /> Access Dashboard
            </>
          )}
        </button>

        <div className="pt-4 flex flex-col gap-4 text-center">
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">
            Don't have an account? <a href="/signup" className="text-white hover:text-emerald-500 transition-colors">Join the future</a>
          </p>
        </div>
      </form>

      {/* Footer Decoration */}
      <p className="mt-12 text-zinc-700 text-[10px] font-black uppercase tracking-[0.5em]">
        Infrastructure Secure
      </p>
    </div>
  );
}