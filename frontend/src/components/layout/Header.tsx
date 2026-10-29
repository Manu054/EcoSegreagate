import React from 'react';
import { Menu, Activity, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  statusText?: string;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  statusText = 'System Online',
  isOnline = true 
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs px-6 flex items-center justify-between border-b border-slate-200/80">
      {/* Left Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="p-1.5 -ml-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-900">EcoSegregate</span>
          <span>/</span>
          <span className="font-mono text-slate-500">Production Node #01</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Latency Telemetry */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>Latency:</span>
          <span className="text-slate-800 font-semibold">28.4ms</span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* System Status Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[11px] font-medium">{statusText}</span>
        </div>

        {/* Operator Profile */}
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
