import { useApp } from '@/context/AppContext';
import { Moon, Sun, Monitor, Bell, Globe, Shield, CreditCard, ChevronRight, Database, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_anon_key') || '');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState(settings.location);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const saveSupabaseConfig = () => {
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseKey);
    alert('Infrastructure configuration cached. Reloading system...');
    window.location.reload();
  };

  const handleUpdateLocation = async () => {
    setIsSavingLocation(true);
    try {
      updateSettings({ location: newLocation });
      setIsEditingLocation(false);
    } catch (err) {
      alert('Location verification failed.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Configuration</h1>
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em] mt-1">Version Control & Preference Management</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Supabase Config */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cloud Infrastructure (Supabase)
          </h2>
          <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Supabase URL</label>
                <input 
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Anon Key</label>
                <input 
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbG..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={saveSupabaseConfig}
                className="flex items-center gap-2 bg-emerald-900 text-white px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md shadow-emerald-900/10"
              >
                <Save className="w-3 h-3" />
                Commit Configuration
              </button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Display Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => updateSettings({ theme: 'light' })}
              className={cn(
                "p-6 rounded-xl border text-center transition-all bg-white",
                settings.theme === 'light' ? "border-emerald-600 ring-4 ring-emerald-500/10" : "border-slate-200 hover:bg-slate-50"
              )}
            >
              <Sun className="w-8 h-8 mx-auto mb-3 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Luminous Interface</span>
            </button>
            <button 
              onClick={() => updateSettings({ theme: 'dark' })}
              className={cn(
                "p-6 rounded-xl border text-center transition-all bg-white",
                settings.theme === 'dark' ? "border-emerald-600 ring-4 ring-emerald-500/10" : "border-slate-200 hover:bg-slate-50"
              )}
            >
              <Moon className="w-8 h-8 mx-auto mb-3 text-emerald-900" />
              <span className="text-xs font-bold uppercase tracking-widest">Nocturnal Layer</span>
            </button>
            <div className="p-6 rounded-xl border border-dotted border-slate-200 bg-slate-50/50 text-center opacity-50 flex flex-col items-center justify-center">
              <Monitor className="w-8 h-8 mx-auto mb-3 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Adaptive Detection<br />(Restricted)</span>
            </div>
          </div>
        </section>

        {/* Farm Profile */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Sector Parameters
          </h2>
          <div className="card divide-y divide-slate-100 p-0 overflow-hidden bg-white border border-slate-200">
            <div className="flex flex-col group hover:bg-slate-50/50 transition-colors border-b border-slate-100">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operational Geostation</p>
                  {isEditingLocation ? (
                    <div className="flex gap-2 max-w-sm mt-2">
                      <input 
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs font-bold uppercase transition-all focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                        placeholder="Search Sector..."
                        autoFocus
                      />
                      <button 
                        onClick={handleUpdateLocation}
                        disabled={isSavingLocation}
                        className="bg-emerald-900 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        {isSavingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                      </button>
                      <button 
                        onClick={() => { setIsEditingLocation(false); setNewLocation(settings.location); }}
                        className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{settings.location}</p>
                  )}
                </div>
                {!isEditingLocation && (
                  <button 
                    onClick={() => setIsEditingLocation(true)}
                    className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-600 px-3 py-1 bg-emerald-50 rounded-md border border-emerald-100 transition-all"
                  >
                    Modify
                  </button>
                )}
              </div>
            </div>
            <SettingItem 
              label="Telemetry Units" 
              value={settings.unit === 'metric' ? "Standard (Celsius, kg)" : "Imperial (Fahrenheit, lb)"} 
              onEdit={() => updateSettings({ unit: settings.unit === 'metric' ? 'imperial' : 'metric' })}
            />
            <div className="flex flex-col group hover:bg-slate-50/50 transition-colors border-b border-slate-100">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uplink Language (System Voice)</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['English', 'Hindi', 'Hinglish', 'Punjabi', 'Haryanvi', 'Bhojpuri', 'Marathi', 'Bengali', 'Telugu'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => updateSettings({ language: lang })}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all",
                          settings.language === lang 
                            ? "bg-emerald-900 text-white border-emerald-900 shadow-sm" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <SettingItem label="Temporal Offset" value="UTC +5:30 (IST)" />
          </div>
        </section>

        {/* More Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Bell, title: "Alert Protocols", color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
            { icon: Shield, title: "Data Security", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700" },
            { icon: CreditCard, title: "License Tier", color: "amber", bg: "bg-amber-50", text: "text-amber-600" }
          ].map((item, i) => (
            <div key={i} className="card p-5 flex items-center justify-between cursor-pointer hover:border-emerald-200 transition-all bg-white border-slate-200 shadow-sm group">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", item.bg, item.text)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{item.title}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12 border-t border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">KrishiSahay Intelligence • v1.0.4-PRO</p>
      </div>
    </div>
  );
}

function SettingItem({ label, value, onEdit }: any) {
  return (
    <div className="flex items-center justify-between p-6 group hover:bg-slate-50/50 transition-colors">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
      {onEdit && (
        <button 
          onClick={onEdit}
          className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-600 px-3 py-1 bg-emerald-50 rounded-md border border-emerald-100 transition-all"
        >
          Modify
        </button>
      )}
    </div>
  );
}
