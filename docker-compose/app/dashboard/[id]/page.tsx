"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  Phone, History, CreditCard, Settings, 
  LayoutDashboard, Loader2, PhoneIncoming,
  Save, X, PhoneCall, Trash2, Link2, Activity, TrendingUp, RefreshCw, Smartphone, PlayCircle, FileText
} from "lucide-react";

function DirectCallSection({ assistantId, provider }: { assistantId: string, provider: string }) {
  const [testNumber, setTestNumber] = useState("");
  const [callLoading, setCallLoading] = useState(false);

  const makeCall = async () => {
    if (!testNumber || !assistantId) {
      alert("Please enter a phone number and ensure an agent is selected.");
      return;
    }
    setCallLoading(true);
    try {
      const endpoint = provider === "retell" ? "/api/retell/make-call" : "/api/vapi/make-call";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: testNumber, assistantId }),
      });
      const result = await res.json();
      if (result.success) alert("Call initiated successfully via " + provider.toUpperCase());
      else alert("Call Error: " + result.error);
    } catch (err) {
      alert("Connection lost.");
    } finally {
      setCallLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mt-8">
      <h3 className="text-sm font-bold mb-4 uppercase flex items-center gap-2 text-emerald-500">
        <PhoneCall size={16} /> Direct Test Call ({provider.toUpperCase()})
      </h3>
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          value={testNumber} 
          onChange={(e) => setTestNumber(e.target.value)} 
          placeholder="+251..." 
          className="flex-1 bg-black border border-zinc-800 px-4 py-4 rounded-2xl text-sm outline-none focus:border-white transition-all text-white" 
        />
        <button 
          onClick={makeCall} 
          disabled={callLoading} 
          className="bg-white text-black px-8 py-4 rounded-2xl text-xs font-black uppercase hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
        >
          {callLoading ? <Loader2 size={16} className="animate-spin" /> : "Start Call"}
        </button>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [provider, setProvider] = useState<"vapi" | "retell">("vapi");

  const [totalCalls, setTotalCalls] = useState(0);
  const [calls, setCalls] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [assistantsList, setAssistantsList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const [showAgentModal, setShowAgentModal] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({ 
    name: "", role: "", prompt: "", firstMessage: "", voice: "Emma" 
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      if (!switchingProvider) setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (orgData) {
        setOrg(orgData);
        setLogoUrl(orgData.logo_url || "");
        setBrandColor(orgData.brand_color || "#10b981");
        if (orgData.preferred_provider) setProvider(orgData.preferred_provider as "vapi" | "retell");
      }

      const [callsCount, callsLogs, agentsList, voiceAssistants] = await Promise.all([
        supabase.from('calls').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from("calls").select("*").eq("org_id", id).order("created_at", { ascending: false }),
        supabase.from("agents").select("*").eq("org_id", id),
        fetch(provider === "vapi" ? "/api/vapi/get-assistants" : "/api/retell/get-assistants").then(res => res.json()).catch(() => [])
      ]);

      setTotalCalls(callsCount.count || 0);
      if (callsLogs.data) {
          setCalls(callsLogs.data);
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const counts: any = {};
          days.forEach(d => counts[d] = 0);
          callsLogs.data.forEach((c: any) => {
              const d = days[new Date(c.created_at).getDay()];
              counts[d]++;
          });
          setChartData(days.map(d => ({ name: d, calls: counts[d] })));
      }
      if (agentsList.data) setAgents(agentsList.data);
      if (Array.isArray(voiceAssistants)) setAssistantsList(voiceAssistants);

      setLoading(false);
      setSwitchingProvider(false);
    }
    fetchData();
  }, [id, router, provider]);

  const handleProviderSwitch = async (newProvider: "vapi" | "retell") => {
    if (newProvider === provider) return;
    setSwitchingProvider(true);
    
    const { error } = await supabase
      .from("organizations")
      .update({ preferred_provider: newProvider })
      .eq("id", id);

    if (!error) {
      setProvider(newProvider);
    } else {
      alert("Error updating provider: " + error.message);
      setSwitchingProvider(false);
    }
  };

  const currentThemeColor = brandColor || "#10b981";

  const handleAddCredits = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: id, amount: 10, orgName: org?.name }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url; 
    } catch (err) { alert("Error connecting to payment."); } finally { setPaymentLoading(false); }
  };

  const handleUpdateSettings = async () => {
    setUpdateLoading(true);
    const { error } = await supabase
      .from("organizations")
      .update({ 
        logo_url: logoUrl, 
        brand_color: brandColor, 
        preferred_provider: provider 
      })
      .eq("id", id);
      
    if (!error) {
      setOrg((prev: any) => ({ ...prev, logo_url: logoUrl, brand_color: brandColor }));
      alert("Settings Saved!");
    } else {
      alert("Error: " + error.message);
    }
    setUpdateLoading(false);
  };

  const handleLinkAssistant = async (assistantId: string) => {
    const phoneId = org?.voice_phone_id || org?.vapi_phone_number_id || org?.phone_number_id;
    if (!assistantId || !phoneId) {
      alert("Missing Assistant ID or Phone ID");
      return;
    }

    setUpdateLoading(true);
    const endpoint = provider === "vapi" ? "/api/vapi/link-assistant" : "/api/retell/link-assistant";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: id, assistantId, phoneId }),
      });

      if (res.ok) {
        setOrg({ ...org, voice_assistant_id: assistantId });
        alert("Agent linked successfully!");
      } else {
        const errorData = await res.json();
        alert("Error: " + errorData.error);
      }
    } catch (err) {
      alert("Connection error occurred.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    setIsCreatingAgent(true);
    const endpoint = provider === "vapi" ? "/api/vapi/create-agent" : "/api/retell/create-agent";
    
    const payload = provider === "vapi" 
      ? { ...newAgent, systemPrompt: newAgent.prompt, voiceId: newAgent.voice, orgId: id }
      : { 
          agent_name: newAgent.name,
          role: newAgent.role,
          voice_id: newAgent.voice,
          prompt: newAgent.prompt,
          first_message: newAgent.firstMessage,
          orgId: id 
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAgentModal(false);
        window.location.reload();
      } else {
        alert("Failed to deploy agent.");
      }
    } catch (err) {
      alert("Error creating agent.");
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Delete this agent?")) return;
    await supabase.from("agents").delete().eq("id", agentId);
    setAgents(agents.filter(a => a.id !== agentId));
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8 hidden md:flex bg-black/50">
        <div className="flex items-center gap-3 px-2">
          {logoUrl ? (
            <img src={logoUrl} className="w-8 h-8 rounded-md object-contain" alt="Logo" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm" style={{backgroundColor: currentThemeColor}}>
              {org?.name ? org.name[0].toUpperCase() : "A"}
            </div>
          )}
          <span className="font-black text-sm uppercase tracking-tighter">{org?.name}</span>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "agents", label: "AI Agents", icon: PhoneIncoming },
            { id: "calls", label: "Call Logs", icon: History },
            { id: "billing", label: "Billing", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? "bg-zinc-900 text-white shadow-lg shadow-black" : "text-zinc-500 hover:text-white"}`}>
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? "" : "text-zinc-600"}`} style={{color: activeTab === item.id ? currentThemeColor : ''}} />
              <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            {activeTab} <span className="text-zinc-600 not-italic font-light text-sm ml-2">Control Center</span>
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: currentThemeColor}}></div>
            <span className="text-[10px] font-black uppercase text-zinc-400">System Live</span>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
                <CreditCard className="w-5 h-5 mb-4 text-zinc-500" />
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Balance</p>
                <p className="text-2xl font-black">${org?.balance || '0.00'}</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
                <Activity className="w-5 h-5 mb-4 text-zinc-500" />
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Total Calls</p>
                <p className="text-2xl font-black">{totalCalls}</p>
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
                <Smartphone className="w-5 h-5 mb-4 text-zinc-500" />
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Business Line</p>
                <p className="text-lg font-black tracking-tighter truncate">
                  {org?.phone_number || "No Number"}
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
                <RefreshCw className={`w-5 h-5 mb-4 text-zinc-500 ${switchingProvider ? 'animate-spin' : ''}`} />
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Provider Switch</p>
                <div className="relative flex bg-black rounded-xl p-1 border border-zinc-800 h-10 items-center">
                  <div 
                    className={`absolute h-8 w-[calc(50%-4px)] transition-all duration-300 ease-in-out shadow-lg rounded-lg ${
                      provider === "retell" ? "translate-x-[calc(100%+0px)]" : "translate-x-0"
                    }`}
                    style={{ backgroundColor: currentThemeColor }}
                  />
                  <button 
                    onClick={() => handleProviderSwitch("vapi")} 
                    disabled={switchingProvider} 
                    className={`relative z-10 flex-1 text-[10px] font-black py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${provider === "vapi" ? "text-black" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {switchingProvider && provider === "vapi" ? <Loader2 size={10} className="animate-spin" /> : "VAPI"}
                  </button>
                  <button 
                    onClick={() => handleProviderSwitch("retell")} 
                    disabled={switchingProvider} 
                    className={`relative z-10 flex-1 text-[10px] font-black py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${provider === "retell" ? "text-black" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {switchingProvider && provider === "retell" ? <Loader2 size={10} className="animate-spin" /> : "RETELL"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] h-[350px]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                        <TrendingUp size={14} /> Weekly Activity
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} />
                            <Line type="monotone" dataKey="calls" stroke={currentThemeColor} strokeWidth={4} dot={{ r: 4, fill: currentThemeColor }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
                    <Link2 className="w-5 h-5 mb-4 text-zinc-500" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Linked Agent</p>
                    <div className="space-y-4">
                        <select 
                          value={org?.voice_assistant_id || ""} 
                          onChange={(e) => handleLinkAssistant(e.target.value)} 
                          className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-[10px] font-bold outline-none uppercase text-white appearance-none cursor-pointer focus:border-emerald-500 transition-colors"
                        >
                          <option value="">-- No Agent --</option>
                          {assistantsList.map((va) => (
                            <option key={va.id || va.assistant_id} value={va.id || va.assistant_id}>
                              {va.name || va.assistant_name || "Unnamed Agent"}
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-zinc-500 uppercase leading-relaxed">
                          Selecting an agent here will connect it to your live business line for inbound calls.
                        </p>
                        {updateLoading && <Loader2 size={16} className="animate-spin text-emerald-500 mx-auto" />}
                    </div>
                </div>
            </div>
            
            <DirectCallSection assistantId={org?.voice_assistant_id || ""} provider={provider} />
          </div>
        )}

        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">AI Workforce ({provider.toUpperCase()})</h3>
              <button onClick={() => { setNewAgent({ name: "", role: "", prompt: "", firstMessage: "", voice: "Emma" }); setShowAgentModal(true); }}
                className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-zinc-200 transition-all">+ New Agent</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl group relative overflow-hidden transition-all hover:border-zinc-700">
                  <div className="absolute top-0 right-0 p-4">
                      <button onClick={() => handleDeleteAgent(agent.id)} className="text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800" style={{color: currentThemeColor}}><PhoneIncoming size={24} /></div>
                  <h4 className="font-black text-lg uppercase tracking-tight">{agent.name}</h4>
                  <p className="text-zinc-600 text-[10px] font-black uppercase mb-6">{agent.role || "VOICE AGENT"}</p>
                  
                  <div className="flex gap-2">
                    <button onClick={() => { setNewAgent({ name: agent.name, role: agent.role || "", prompt: agent.system_prompt || "", firstMessage: agent.first_message || "", voice: agent.voice_id || "Emma" }); setShowAgentModal(true); }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">Configure</button>
                    <button 
                      onClick={() => handleLinkAssistant(agent.vapi_assistant_id || agent.retell_assistant_id)}
                      className={`p-3 rounded-xl border border-zinc-800 transition-all ${org?.voice_assistant_id === (agent.vapi_assistant_id || agent.retell_assistant_id) ? "bg-emerald-500 text-black" : "bg-zinc-900 text-zinc-500 hover:text-emerald-500"}`}
                    >
                      <Link2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calls" && (
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Date</th>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Summary</th>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Duration</th>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Cost</th>
                            <th className="p-6 text-[10px] font-black uppercase text-zinc-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {calls.map((call) => (
                            <tr key={call.id} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        call.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                    }`}>
                                        {call.status}
                                    </span>
                                </td>
                                <td className="p-6 text-[10px] font-bold text-zinc-300">
                                    {new Date(call.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-6 text-[10px] text-zinc-400 max-w-xs truncate font-medium">
                                    <div className="flex items-center gap-2">
                                        <FileText size={12} className="text-zinc-600" />
                                        {call.summary || "No summary available"}
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-zinc-400 font-mono">{call.duration || "0"}s</td>
                                <td className="p-6 text-sm font-black text-white">
                                    ${call.cost ? Number(call.cost).toFixed(2) : "0.00"}
                                </td>
                                <td className="p-6">
                                    {call.recording_url ? (
                                        <a href={call.recording_url} target="_blank" className="flex items-center gap-2 text-emerald-500 hover:text-white transition-colors text-[10px] font-black uppercase">
                                            <PlayCircle size={16} /> Listen
                                        </a>
                                    ) : (
                                        <span className="text-zinc-600 text-[10px] font-black uppercase">No Audio</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {calls.length === 0 && <div className="p-20 text-center text-zinc-600 uppercase text-xs font-black italic">No records found</div>}
            </div>
        )}

        {activeTab === "billing" && (
            <div className="max-w-2xl space-y-8">
                <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={100} /></div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Available Credits</p>
                    <h3 className="text-5xl font-black italic tracking-tighter mb-8">${org?.balance || '0.00'}</h3>
                    <button onClick={handleAddCredits} disabled={paymentLoading} className="bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase hover:scale-105 transition-all">
                        {paymentLoading ? "Processing..." : "Add $10 Credit"}
                    </button>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem]">
                    <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2"><Phone size={16} /> Business Number</h4>
                    {org?.phone_number && (
                        <div className="flex items-center gap-4 bg-black/50 border border-zinc-800 p-4 rounded-2xl mb-6">
                            <Smartphone className="text-emerald-500" size={20} />
                            <p className="text-lg font-black tracking-widest">{org.phone_number}</p>
                        </div>
                    )}
                    <button onClick={handleAddCredits} className="w-full bg-zinc-900 border border-zinc-800 py-4 rounded-2xl text-[10px] font-black uppercase hover:border-white transition-all">
                        {org?.phone_number ? "Upgrade Line" : "Buy Phone Number ($5/mo)"}
                    </button>
                </div>
            </div>
        )}

        {activeTab === "settings" && (
            <div className="max-w-xl space-y-8 animate-in slide-in-from-bottom-4">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Brand Logo URL</label>
                    <input 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="https://..."
                      className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-white transition-all" 
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Dashboard Accent Color</label>
                    <div className="flex gap-4 items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                        <input 
                          type="color" 
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)} 
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" 
                        />
                        <span className="text-xs font-mono uppercase text-zinc-400">{brandColor}</span>
                    </div>
                </div>
                <button 
                  onClick={handleUpdateSettings} 
                  disabled={updateLoading} 
                  className="w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    {updateLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
                </button>
            </div>
        )}
      </main>

      {showAgentModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor: currentThemeColor}}></div>
            <button onClick={() => setShowAgentModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
            <h3 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Node <span style={{color: currentThemeColor}}>Config</span> ({provider.toUpperCase()})</h3>
            <div className="space-y-5">
              <input value={newAgent.name} placeholder="AGENT NAME" className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-xs font-bold outline-none focus:border-white" onChange={(e) => setNewAgent({...newAgent, name: e.target.value})} />
              <input value={newAgent.role} placeholder="ROLE / TITLE" className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-xs font-bold outline-none focus:border-white" onChange={(e) => setNewAgent({...newAgent, role: e.target.value})} />
              <textarea value={newAgent.prompt} placeholder="BEHAVIORAL INSTRUCTIONS..." className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl h-32 text-xs font-bold outline-none focus:border-white resize-none" onChange={(e) => setNewAgent({...newAgent, prompt: e.target.value})} />
              <input value={newAgent.firstMessage} placeholder="FIRST MESSAGE (GREETING)" className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-xs font-bold outline-none focus:border-white" onChange={(e) => setNewAgent({...newAgent, firstMessage: e.target.value})} />
              <div className="pt-6 flex gap-4">
                <button onClick={() => setShowAgentModal(false)} className="flex-1 bg-zinc-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all">Cancel</button>
                <button onClick={handleCreateAgent} disabled={isCreatingAgent} className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all">
                  {isCreatingAgent ? <Loader2 className="animate-spin mx-auto" /> : "Deploy Agent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
}