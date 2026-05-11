import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Camera, Image as ImageIcon, Loader2, 
  AlertCircle, CheckCircle2, ChevronRight, RefreshCw,
  ShieldCheck, Thermometer, Droplets, Info, X
} from 'lucide-react';
import { analyzeCropDisease, DiseaseAnalysis } from '@/services/gemini';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export default function DiseaseDiagnostic() {
  const { settings } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size too large. Please upload an image under 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
        setMimeType(file.type);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Remove the prefix (data:image/jpeg;base64,) from the base64 string
      const base64Data = selectedImage.split(',')[1];
      const analysis = await analyzeCropDisease(base64Data, mimeType, settings.language);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Vision Diagnostic</h1>
        <p className="text-slate-500 font-medium italic">Autonomous satellite-grade biological scanning protocol.</p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div 
              className={cn(
                "relative aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex flex-col items-center justify-center transition-all group shadow-sm",
                !selectedImage && "hover:border-emerald-500 hover:bg-emerald-50/10 cursor-pointer"
              )}
            onClick={() => !selectedImage && !isAnalyzing && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Crop sample" className="w-full h-full object-cover" />
                {!isAnalyzing && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full backdrop-blur-sm hover:bg-slate-900 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Running Neural Sync...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Load Biological Sample</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Scan a high-resolution image of the affected crop foliage for real-time analysis.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leaf Spot</div>
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rust</div>
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blight</div>
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infestation</div>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {!result && selectedImage && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calibrating Vision Matrix...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  INITIATE SYSTEM SCAN
                </>
              )}
            </motion.button>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex gap-3 italic text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="card bg-white border-slate-200 overflow-hidden p-0">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Diagnostic Report</p>
                      <h2 className="text-xl font-bold text-slate-900">{result.disease}</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-600">{Math.round(result.confidence * 100)}%</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {result.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card bg-emerald-50 border-emerald-100 p-5">
                    <div className="flex items-center gap-2 mb-3 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">Protocol Treatment</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.treatment.map((item, i) => (
                        <li key={i} className="text-xs text-emerald-800 flex gap-2 font-bold leading-tight">
                          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card bg-blue-50 border-blue-100 p-5">
                    <div className="flex items-center gap-2 mb-3 text-blue-700">
                      <ShieldCheck className="w-4 h-4" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">Longterm Defense</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.preventiveMeasures.map((item, i) => (
                        <li key={i} className="text-xs text-blue-800 flex gap-2 font-bold leading-tight">
                          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={reset}
                  className="w-full py-4 text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Diagnostic Module
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Output Pending</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Data matrix will populate once the biological sample is analyzed.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Advisory Section */}
      <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Thermometer className="w-5 h-5 text-rose-400" />
             </div>
             <div>
               <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Thermal Integrity</h4>
               <p className="text-sm font-medium">Excessive heat can accelerate spore distribution in affected sectors.</p>
             </div>
           </div>
           <div className="flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5 text-blue-400" />
             </div>
             <div>
               <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Moisture Flux</h4>
               <p className="text-sm font-medium">Humidity levels above 84% increase risk of fungal replication cycles.</p>
             </div>
           </div>
           <div className="flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5 text-emerald-400" />
             </div>
             <div>
               <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Field Advice</h4>
               <p className="text-sm font-medium italic">"Early detection is 90% of the harvest's immunity."</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
