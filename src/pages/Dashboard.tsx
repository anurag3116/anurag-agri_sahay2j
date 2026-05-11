import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  CloudSun, Droplets, Thermometer, Wind, TrendingUp, Calendar, 
  AlertCircle, Plus, Leaf, Loader2, RefreshCw, X, History, 
  Trash2, Bell, Zap, BarChart3, ChevronRight, Sparkles, 
  Sprout, Waves, Gauge, Info, Filter, MoreVertical, LayoutGrid,
  Droplet, ShieldAlert
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { cn } from '@/lib/utils';
import { getWeatherData, WeatherData } from '@/services/weather';

type LedgerItem = {
  id: string;
  note: string;
  category: 'Observation' | 'Harvest' | 'Planting' | 'Alert';
  created_at: string;
};

type Notification = {
  id: string;
  type: 'alert' | 'success' | 'info';
  message: string;
  time: string;
};

export default function Dashboard() {
  const { settings, crops } = useApp();
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<LedgerItem['category']>('Observation');
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'calendar'>('overview');

  const notifications: Notification[] = [
    { id: '1', type: 'alert', message: 'Soil moisture low in Sector 4B', time: '10m ago' },
    { id: '2', type: 'success', message: 'Atmospheric harvest successful', time: '2h ago' },
    { id: '3', type: 'info', message: 'New satellite scan available', time: '4h ago' },
  ];

  const productivityData = [
    { name: 'Mon', usage: 450, yield: 85 },
    { name: 'Tue', usage: 380, yield: 88 },
    { name: 'Wed', usage: 520, yield: 82 },
    { name: 'Thu', usage: 480, yield: 90 },
    { name: 'Fri', usage: 610, yield: 87 },
    { name: 'Sat', usage: 550, yield: 92 },
    { name: 'Sun', usage: 420, yield: 95 },
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const weatherData = await getWeatherData(settings.location);
        setWeather(weatherData);

        if (user && supabase) {
          const { data } = await supabase
            .from('ledger')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (data) setLedger(data);
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [settings.location, user]);

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !user || !supabase) return;
    setSavingNote(true);
    try {
      const { data } = await supabase
        .from('ledger')
        .insert({ user_id: user.id, note: noteContent, category: noteCategory })
        .select()
        .single();
      if (data) {
        setLedger([data, ...ledger]);
        setNoteContent('');
        setIsNoteModalOpen(false);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const chartData = weather ? weather.forecast.slice(0, 8).map(f => ({
    name: new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }),
    temp: Math.round(f.temp)
  })) : [
    { name: '08 AM', temp: 24 }, { name: '10 AM', temp: 26 }, { name: '12 PM', temp: 28 },
    { name: '02 PM', temp: 30 }, { name: '04 PM', temp: 29 }, { name: '06 PM', temp: 27 },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Top Protocol Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary dark:bg-primary-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Core Protocol v4.0
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-200">Live</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
              {weather?.name || settings.location} • Atmospheric Sync {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              activeTab === 'overview' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
            )}
          >
            Mission Overview
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              activeTab === 'analytics' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
            )}
          >
            Deep Analytics
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <Link 
            to="/diagnostic"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-900/10"
          >
            <ShieldAlert className="w-4 h-4" />
            DIAGNOSTIC
          </Link>
          <button 
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
          >
            <Plus className="w-4 h-4" />
            COMMIT DATA
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<Droplets className="w-4 h-4" />}
              label="Moisture Core" 
              value={weather ? `${weather.current.humidity}%` : "64%"} 
              trend="+2.4% vs last scan"
              color="blue"
              sub="Sector Average"
            />
            <StatCard 
              icon={<Zap className="w-4 h-4" />}
              label="Energy Output" 
              value="1.2 MW" 
              trend="Optimal Efficiency"
              color="amber"
              sub="Arrays Delta"
            />
            <StatCard 
              icon={<Sprout className="w-4 h-4" />}
              label="Bio-Synthesis" 
              value="94%" 
              trend="+12% Productivity"
              color="emerald"
              sub="Carbon Flux"
            />
            <StatCard 
              icon={<AlertCircle className="w-4 h-4" />}
              label="Risk Vector" 
              value={weather?.current.humidity && weather.current.humidity > 70 ? "Elevated" : "Low"} 
              trend="Pest migration - 2km"
              color="rose"
              sub="Defense Active"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Visual Station */}
            <div className="lg:col-span-2 space-y-6">
              {/* Productivity Analytics */}
              <div className="card p-0 overflow-hidden flex flex-col bg-white border border-slate-200 h-[400px]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Productivity Cycle</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Yield</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/30" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Usage</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 700 }} />
                      <Bar dataKey="yield" fill="#064e3b" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="usage" fill="#064e3b33" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Crop Health Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    Active Biologicals
                  </h3>
                  <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Expand Roster <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {crops.slice(0, 3).map((crop, i) => (
                    <CropHealthCard key={i} crop={crop} />
                  ))}
                  {crops.length < 3 && (
                    <div className="card border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-6 grayscale opacity-60">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                        <Plus className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Empty Sector</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Modules */}
            <div className="space-y-6">
              {/* AI Insights Panel */}
              <div className="card space-y-4 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Synthetic Intelligence</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium leading-relaxed italic border-l-2 border-accent/30 pl-3">
                      "Projected precipitation at 04:00 AM suggests delaying irrigation protocol 4. Thermal stress expected in Zone B by 12:00 PM."
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="px-2 py-1 bg-white/10 rounded text-[9px] font-bold uppercase">Confidence: 98%</div>
                      <div className="px-2 py-1 bg-white/10 rounded text-[9px] font-bold uppercase">Agent Alpha</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Center */}
              <div className="card flex flex-col h-[300px] p-0 bg-white border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" />
                    Protocol Alerts
                  </h3>
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        n.type === 'alert' ? "bg-rose-50 text-rose-600" : n.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {n.type === 'alert' ? <AlertCircle className="w-4 h-4" /> : n.type === 'success' ? <RefreshCw className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 leading-tight mb-1">{n.message}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-t border-slate-100 hover:text-primary transition-colors">
                  View Full Logs
                </button>
              </div>

              {/* Water Usage Station */}
              <div className="card bg-slate-900 border-none text-white overflow-hidden p-6 relative">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Water Reservoir</h3>
                     <p className="text-2xl font-bold tracking-tight text-white">4,280 L</p>
                   </div>
                   <Waves className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: '74%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                 </div>
                 <div className="mt-2 flex justify-between">
                   <span className="text-[10px] font-bold text-white/30 uppercase">Capacity: 6,000L</span>
                   <span className="text-[10px] font-bold text-blue-400 uppercase">74% Reserve</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed animate-in zoom-in-95 duration-300">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
             <BarChart3 className="w-8 h-8 text-slate-400" />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Section Under Maintenance</h3>
           <p className="text-sm text-slate-500 mt-2 max-w-sm">Deep Analytics and Satellite Calendar modules are currently undergoing calibration for the new season cycle.</p>
           <button onClick={() => setActiveTab('overview')} className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-slate-800 transition-all">Back to Overview</button>
        </div>
      )}

      {/* Persistence Modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Append Ledger Entry
                </h3>
                <button onClick={() => setIsNoteModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  {(['Observation', 'Planting', 'Harvest', 'Alert'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNoteCategory(cat)}
                      className={cn(
                        "flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all",
                        noteCategory === cat ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Describe sector dynamics, crop status, or sensor anomalies..."
                  className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-hidden focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none"
                />
                <button 
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteContent.trim()}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                >
                  {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Finalize Entry <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, trend, color, icon, sub }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50/50',
    amber: 'text-amber-500 bg-amber-50/50',
    emerald: 'text-emerald-600 bg-emerald-50/50',
    rose: 'text-rose-600 bg-rose-50/50',
  };

  return (
    <div className="card group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colors[color])}>
           {icon}
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
        </div>
      </div>
      <div>
        <p className="col-header mb-1">{label}</p>
        <p className={cn("text-2xl font-bold tracking-tight data-value")}>{value}</p>
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>
          <p className="text-[10px] font-bold text-slate-700">{trend}</p>
        </div>
      </div>
    </div>
  );
}

function CropHealthCard({ crop }: { crop: any }) {
  const health = useMemo(() => Math.floor(Math.random() * 20) + 80, []); // Random health 80-100 for visual demo
  
  return (
    <div className="card p-5 group hover:border-emerald-200 transition-all flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100 relative">
          <Leaf className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-900 leading-tight mb-0.5 tracking-tight">{crop.name}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{crop.type}</p>
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
           <span className="text-slate-400">Biological Health</span>
           <span className="text-emerald-600">{health}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
           <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100 text-[8px] font-bold uppercase text-slate-500 text-center">
             Vigor: High
           </div>
           <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100 text-[8px] font-bold uppercase text-slate-500 text-center">
             Growth: Opt
           </div>
        </div>
      </div>
    </div>
  );
}
