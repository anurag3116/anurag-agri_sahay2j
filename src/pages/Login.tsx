import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, LogIn, Mail, Lock, Chrome, Loader2, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase configuration is missing. Visit Settings.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Security keys do not match.');
        }
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setSuccess('Protocol initiated. Please check your registry email for confirmation.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden lg:flex bg-emerald-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full -ml-48 -mb-48 blur-3xl" />
        
        <div className="relative z-10 space-y-8 text-center max-w-lg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-400/20"
          >
            <Leaf className="w-12 h-12 text-emerald-900" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tighter">KrishiSahay AI</h1>
            <p className="text-emerald-100/60 text-lg font-medium leading-relaxed">
              Empowering farmers with satellite-guided intelligence and real-time agricultural synthesis.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-700/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">18%</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Average Yield Increase</p>
            </div>
            <div className="p-4 bg-emerald-800/40 rounded-2xl border border-emerald-700/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Satellite Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden text-center mb-8">
             <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">KrishiSahay AI</h2>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-4 border-b border-slate-200">
              <button 
                onClick={() => setIsLogin(true)}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${isLogin ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Access Hub
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${!isLogin ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                New Registry
              </button>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {isLogin ? 'Link your credentials to the agriculture nexus.' : 'Initiate a new agricultural management protocol.'}
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm group"
            >
              <Chrome className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
              Sign in with Google
            </button>

            <div className="relative py-4 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or utilize mail link</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registry Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm outline-hidden focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-medium"
                    placeholder="farmer@sector4.org"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm outline-hidden focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Security Key</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                      <input 
                        type="password"
                        required={!isLogin}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm outline-hidden focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  {success}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {isLogin ? (
                        <>Uplink Metadata <LogIn className="w-4 h-4" /></>
                      ) : (
                        <>Initialize Protocol <UserPlus className="w-4 h-4" /></>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center pt-8">
            <Link to="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">
              Return to public interface
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
