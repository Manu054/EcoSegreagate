import React, { useEffect, useState } from 'react';
import { 
  Recycle, 
  Cpu, 
  BarChart3, 
  Clock, 
  Info, 
  ShieldCheck, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../api/client';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isEstop, setIsEstop] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await apiClient.getHealth();
        setIsOnline(health.status === 'healthy');
        setIsEstop(health.emergency_stop);
      } catch {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Recycle },
    { id: 'classify', label: 'Segregation Studio', icon: Layers },
    { id: 'analytics', label: 'Live Telemetry', icon: BarChart3 },
    { id: 'comparison', label: 'Benchmarks', icon: Cpu },
    { id: 'history', label: 'Audit Log', icon: Clock },
    { id: 'about', label: 'Methodology & Docs', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl border border-slate-200/80 shadow-md shadow-slate-900/5 px-4 sm:px-6 h-16 flex items-center justify-between transition-all">
          
          {/* Brand Logo & Title */}
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-300">
              <Recycle className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  EcoSegregate
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                  Vision AI
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Automated Waste Segregation System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-sm shadow-slate-900/5 font-bold border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Telemetry Status Indicator */}
          <div className="flex items-center gap-3">
            {isEstop ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-500 text-white shadow-sm shadow-red-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                E-STOP ACTIVE
              </span>
            ) : isOnline ? (
              <div className="flex items-center gap-2 bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px]">System Online</span>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Connecting...
              </span>
            )}
          </div>
        </div>

        {/* Mobile Navigation Scroll */}
        <div className="md:hidden flex items-center gap-1 mt-2 pb-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white/90 text-slate-700 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
