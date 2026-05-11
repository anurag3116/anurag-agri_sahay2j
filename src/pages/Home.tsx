import { motion } from 'motion/react';
import { ArrowRight, Leaf, Shield, Zap, TrendingUp, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-emerald-950">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2664&auto=format&fit=crop" 
            alt="Farm"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-r from-emerald-950 via-emerald-950/80 to-transparent" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-800 text-emerald-300 font-bold text-[10px] uppercase tracking-widest mb-6">
              <Leaf className="w-3 h-3" />
              Advanced Agricultural Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white leading-tight">
              Cultivating the<br /> <span className="text-emerald-400">Future of Farming.</span>
            </h1>
            <p className="text-base md:text-lg text-emerald-100/70 max-w-lg mb-8 md:mb-10 leading-relaxed">
              KrishiSahay AI leverages global weather patterns and real-time soil analytics to optimize your yield trajectory.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20 text-sm md:text-base">
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/crops" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold backdrop-blur-md transition-all border border-white/10 text-sm md:text-base">
                  Analyze My Land
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-[#f8faf8]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Ecosystem Monitoring</h2>
              <p className="text-slate-500 text-sm italic">"KrishiSahay's AI prediction engine has increased local sector yields by an average of 18.4% this season."</p>
            </div>
            <div className="hidden md:block h-px flex-1 bg-slate-200 mx-12 mb-4"></div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Active nodes: 1,280</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Sensor Fusion", desc: "Aggregated data from satellite and ground-based soil sensors." },
              { icon: Shield, title: "Risk Mitigation", desc: "Early detection systems for localized pest clusters and mildew." },
              { icon: TrendingUp, title: "Efficiency Mapping", desc: "Resource allocation optimization based on heat mapping." },
              { icon: MessageSquare, title: "Direct Advisor", desc: "Direct uplink to our specialized agricultural LLM interface." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center text-emerald-400 mb-6">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
