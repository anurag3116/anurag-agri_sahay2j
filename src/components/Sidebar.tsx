import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, MessageSquare, Sprout, CloudSun, Settings, Menu, X, Leaf, LogOut, User as UserIcon, ShieldAlert, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ai-chat', icon: MessageSquare, label: 'AI Advisor' },
    { to: '/crops', icon: Sprout, label: 'Crops' },
    { to: '/weather', icon: CloudSun, label: 'Weather' },
    { to: '/diagnostic', icon: ShieldAlert, label: 'Diagnostics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0),
          width: isSidebarCollapsed ? 80 : 260
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 h-screen bg-emerald-900 border-r border-emerald-800 z-50 flex flex-col lg:translate-x-0"
        )}
      >
        {/* Desktop Sidebar Toggle */}
        <div className="hidden lg:block absolute -right-3 top-20 z-50">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-6 h-6 bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md border border-emerald-600 hover:bg-emerald-600 transition-colors"
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform duration-300", !isSidebarCollapsed && "rotate-180")} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed || isMobileOpen ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-white font-bold text-xl px-2"
            >
              <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center text-emerald-900">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="tracking-tight">KrishiSahay</span>
            </motion.div>
          ) : (
            <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center text-emerald-900 mx-auto group cursor-pointer" onClick={() => setIsSidebarCollapsed(false)}>
              <Leaf className="w-6 h-6" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm",
                isActive 
                  ? "bg-emerald-800 text-emerald-100 shadow-lg shadow-black/10" 
                  : "text-emerald-300/70 hover:bg-emerald-800/50 hover:text-emerald-100"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", (isSidebarCollapsed && !isMobileOpen) ? "mx-auto" : "")} />
              {(!isSidebarCollapsed || isMobileOpen) && <span>{item.label}</span>}
              {(isSidebarCollapsed && !isMobileOpen) && (
                <div className="fixed left-20 bg-emerald-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-emerald-700 z-[100] shadow-xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-800 space-y-2">
          <div className={cn(
            "bg-emerald-800/40 p-3 rounded-2xl flex items-center gap-3",
            (isSidebarCollapsed && !isMobileOpen) && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0 ring-2 ring-emerald-800">
              {userInitial}
            </div>
            {(!isSidebarCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-100 truncate uppercase tracking-wider">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-emerald-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-emerald-400 hover:bg-rose-900/30 hover:text-rose-400 transition-all group",
              (isSidebarCollapsed && !isMobileOpen) && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {(!isSidebarCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-emerald-900 font-bold">
           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Leaf className="w-5 h-5" />
           </div>
           <span className="tracking-tight">KrishiSahay</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}
