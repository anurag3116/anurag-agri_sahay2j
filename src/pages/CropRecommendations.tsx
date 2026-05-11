import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Search, Sparkles, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { getCropRecommendation } from '@/services/gemini';
import Markdown from 'react-markdown';
import { useApp } from '@/context/AppContext';

export default function CropRecommendations() {
  const { addCrop, settings } = useApp();
  const [formData, setFormData] = useState({
    soilType: 'Loamy',
    season: 'Kharif',
    temperature: '',
    rainfall: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);
    const result = await getCropRecommendation(formData, settings.language);
    setRecommendation(result);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Crop Optimization System</h1>
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em] mt-1">AI-Driven Agricultural Planning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="card space-y-6 sticky top-8 border border-slate-200 shadow-sm bg-white">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Soil Architecture</label>
                <select 
                  value={formData.soilType}
                  onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                >
                  <option>Loamy</option>
                  <option>Sandy</option>
                  <option>Clayey</option>
                  <option>Black Soil</option>
                  <option>Red Soil</option>
                  <option>Laterite Soil</option>
                  <option>Alluvial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Cycle / Season</label>
                <select 
                  value={formData.season}
                  onChange={(e) => setFormData({...formData, season: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                >
                  <option>Kharif (Monsoon)</option>
                  <option>Rabi (Winter)</option>
                  <option>Zaid (Summer)</option>
                  <option>Perennial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Avg Temp (°C)</label>
                  <input 
                    required
                    type="number"
                    placeholder="e.g. 28"
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rainfall (mm)</label>
                  <input 
                    required
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.rainfall}
                    onChange={(e) => setFormData({...formData, rainfall: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">State / Sector Location</label>
                <input 
                  required
                  placeholder="e.g. Maharashtra, India"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium placeholder:italic"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-md group disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
                  Generate Protocol
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!recommendation && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card flex flex-col items-center justify-center text-center py-24 bg-white border border-dashed border-slate-300"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Input Required</h3>
                <p className="text-xs text-slate-500 max-w-sm italic">"Awaiting land parameters to begin agricultural simulation..."</p>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card flex flex-col items-center justify-center text-center py-24 bg-white border border-slate-200"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sprout className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mt-8 mb-2">Cross-Referencing Databases</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter italic">"Consulting historical yield data for Punjab Sector..."</p>
              </motion.div>
            )}

            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card bg-emerald-50 border-emerald-100 p-4 flex items-start gap-4">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-emerald-800 leading-relaxed italic">
                    AI Analysis Complete. The following recommendations optimized for maximum caloric yield and moisture retention.
                  </p>
                </div>

                <div className="card prose prose-sm prose-emerald max-w-none bg-white p-8 border border-slate-200">
                  <Markdown>{recommendation}</Markdown>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button className="px-6 py-2.5 bg-emerald-900 border border-emerald-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Apply to Active Planning
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
