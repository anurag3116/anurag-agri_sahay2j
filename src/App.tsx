import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import CropRecommendations from './pages/CropRecommendations';
import Weather from './pages/Weather';
import DiseaseDiagnostic from './pages/DiseaseDiagnostic';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PageLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const { isSidebarCollapsed } = useApp();
  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {(!isAuthPage && user) && <Sidebar />}
      <main className={cn(
        "flex-1 w-full transition-[padding] duration-300",
        (isAuthPage || !user) ? "" : (isSidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]"),
        (!isAuthPage && user) ? "pt-16 lg:pt-0" : "" // Add top padding on mobile for header
      )}>
        <div className={cn(
          "w-full",
          isAuthPage || !user ? "" : "max-w-7xl mx-auto p-4 md:p-8"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <PageLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/ai-chat" 
                element={<ProtectedRoute><AIChat /></ProtectedRoute>} 
              />
              <Route 
                path="/crops" 
                element={<ProtectedRoute><CropRecommendations /></ProtectedRoute>} 
              />
              <Route 
                path="/weather" 
                element={<ProtectedRoute><Weather /></ProtectedRoute>} 
              />
              <Route 
                path="/diagnostic" 
                element={<ProtectedRoute><DiseaseDiagnostic /></ProtectedRoute>} 
              />
              <Route 
                path="/settings" 
                element={<ProtectedRoute><Settings /></ProtectedRoute>} 
              />
              {/* Fallback for unknown routes, including potential redirect paths from auth providers */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageLayout>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
