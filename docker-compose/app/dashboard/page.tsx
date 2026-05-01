"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Phone, Users, Calculator, 
  Wallet, Clock, TrendingUp, User, Trash2,
  BarChart3, LayoutDashboard, Settings, Save
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [calls, setCalls] = useState<any[]>([]);
  const [clientStats, setClientStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [brandName, setBrandName] = useState("Stephen");
  const [accentColor, setAccentColor] = useState("#7db710");
  const [adminOrgId, setAdminOrgId] = useState<string | null>(null);

  const chartData = [
    { day: 'Mon', profit: 45 },
    { day: 'Tue', profit: 52 },
    { day: 'Wed', profit: 38 },
    { day: 'Thu', profit: 65 },
    { day: 'Fri', profit: 48 },
    { day: 'Sat', profit: 70 },
    { day: 'Sun', profit: 85 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: orgs } = await supabase.from("organizations").select("*");
      
      if (orgs && orgs.length > 0) {
        // Priority: Find the organization specifically named "Stephen"
        const adminSettings = orgs.find(o => o.name === "Stephen") || orgs[0];
        
        // Force display name to Stephen regardless of DB row order
        setBrandName("Stephen");
        setAccentColor(adminSettings.brand_color || "#7db710");
        setAdminOrgId(adminSettings.id);
      }

      const { data: allCalls } = await supabase
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (allCalls && orgs) {
        const callsWithNames = allCalls.map(call => {
          const matchingOrg = orgs.find(o => String(o.id) === String(call.org_id));
          return {
            ...call,
            clientName: matchingOrg ? matchingOrg.name : "Unknown Client"
          };
        });
        setCalls(callsWithNames);

        const result = orgs.map(org => {
          const orgCalls = allCalls.filter(c => String(c.org_id) === String(org.id));
          const totalSecs = orgCalls.reduce((sum, c) => sum + (Number(c.duration) || 0), 0);
          const totalMinutes = totalSecs / 60;
          const rate = org.rate_per_min || 0.20; 
          const totalCost = totalMinutes * rate;
          const remainingBalance = (Number(org.balance) || 0) - totalCost;

          return {
            ...org,
            totalMinutes: totalMinutes.toFixed(2),
            totalCost: totalCost.toFixed(2),
            remainingBalance: remainingBalance.toFixed(2),
            callCount: orgCalls.length
          };
        });
        setClientStats(result);
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranding = async () => {
    if (!adminOrgId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ 
          name: brandName, 
          brand_color: accentColor 
        })
        .eq("id", adminOrgId);

      if (error) throw error;
      alert("Settings updated successfully!");
      fetchData(); 
    } catch (err) {
      console.error("Update Error:", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client: ${name}?`)) return;
    try {
      await supabase.from("organizations").delete().eq("id", id);
      fetchData();
    } catch (err) {
      alert("Error deleting client");
    }
  };

  const deleteCall = async (id: string) => {
    if (!confirm("Are you sure you want to delete this call log?")) return;
    try {
      await supabase.from("calls").delete().eq("id", id);
      fetchData();
    } catch (err) {
      alert("Error deleting call");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <div className="w-72 border-r border-zinc-800 p-8 flex flex-col gap-10">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: accentColor }}>
            {brandName} <span className="text-white">AI</span>
          </h1>
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">Infrastructure Admin</p>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'logs', label: 'Call Logs', icon: Phone },
            { id: 'services', label: 'Client Services', icon: Users },
            { id: 'analytics', label: 'Profit Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === item.id 
                ? 'text-black' 
                : 'text-zinc-500 hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
              }`}
              style={activeTab === item.id ? { backgroundColor: accentColor } : {}}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">System <span style={{ color: accentColor }}>Overview</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Total System Calls</p>
                <h3 className="text-5xl font-black italic">{calls.length}</h3>
              </div>
              <div className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Active Organizations</p>
                <h3 className="text-5xl font-black italic">{clientStats.length}</h3>
              </div>
              <div className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Weekly Revenue</p>
                <h3 className="text-5xl font-black italic" style={{ color: accentColor }}>$403.00</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">Control <span style={{ color: accentColor }}>Panel</span></h2>
            <div className="max-w-2xl space-y-8">
              <div className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-[2.5rem] space-y-8">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Brand Identity</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Accent Theme Color</label>
                  <div className="flex gap-4">
                    <input 
                      type="color" 
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-12 w-24 bg-transparent border-none cursor-pointer"
                    />
                    <span className="font-mono text-zinc-400 flex items-center uppercase">{accentColor}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleUpdateBranding}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Branding Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">Call <span style={{ color: accentColor }}>Journal</span></h2>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50">
                    <th className="p-8">Client Name</th>
                    <th className="p-8">Status</th>
                    <th className="p-8">Duration</th>
                    <th className="p-8">Date</th>
                    <th className="p-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-8 font-black text-sm uppercase tracking-tight italic">{call.clientName}</td>
                      <td className="p-8 italic text-zinc-400">{call.status || "completed"}</td>
                      <td className="p-8 text-sm font-mono text-zinc-400">{call.duration}s</td>
                      <td className="p-8 text-zinc-500 text-xs font-bold">{new Date(call.created_at).toLocaleDateString()}</td>
                      <td className="p-8 text-right">
                        <button onClick={() => deleteCall(call.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "services" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">Billing <span style={{ color: accentColor }}>Aggregation</span></h2>
             <div className="grid grid-cols-1 gap-4">
               {clientStats.map((client) => (
                 <div key={client.id} className="relative bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] hover:bg-zinc-900/50 transition-all group">
                   <button onClick={() => deleteClient(client.id, client.name)} className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                     <Trash2 size={16} />
                   </button>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mr-10">
                     <div className="flex items-center gap-5 min-w-[200px]">
                       <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center"><User size={24} className="text-zinc-500" /></div>
                       <div>
                         <h3 className="text-xl font-black tracking-tight">{client.name}</h3>
                         <span className="text-[9px] font-black text-zinc-600 uppercase">{client.id.slice(0,12)}...</span>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                       <div><p className="text-[9px] font-black text-zinc-500 uppercase"><Clock size={12} className="inline mr-1" /> Airtime</p><h4 className="text-xl font-black italic">{client.totalMinutes} MIN</h4></div>
                       <div><p className="text-[9px] font-black text-zinc-500 uppercase"><TrendingUp size={12} className="inline mr-1" /> Calls</p><h4 className="text-xl font-black italic">{client.callCount}</h4></div>
                       <div><p className="text-[9px] font-black text-zinc-500 uppercase"><Calculator size={12} className="inline mr-1" /> Cost</p><h4 className="text-xl font-black italic text-zinc-400">${client.totalCost}</h4></div>
                       <div><p className="text-[9px] font-black uppercase" style={{ color: accentColor }}><Wallet size={12} className="inline mr-1" /> Balance</p><h4 className={`text-2xl font-black italic ${Number(client.remainingBalance) < 5 ? 'text-red-500' : ''}`} style={Number(client.remainingBalance) >= 5 ? {color: accentColor} : {}}>${client.remainingBalance}</h4></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === "analytics" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">Profit <span style={{ color: accentColor }}>Analytics</span></h2>
             <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[2.5rem]">
               <div className="h-[400px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                     <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                     <Tooltip cursor={{fill: '#18181b'}} contentStyle={{backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px'}} itemStyle={{color: accentColor, fontWeight: 'bold'}} />
                     <Bar dataKey="profit" fill={accentColor} radius={[6, 6, 0, 0]} barSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}