import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  Scan,
  Activity, 
  BarChart2, 
  ClipboardList, 
  Cpu, 
  Database,
  Leaf,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const mainNavItems = [
    { to: '/', label: 'Overview', icon: Home },
    { to: '/segregation', label: 'Segregation Studio', icon: Scan },
    { to: '/telemetry', label: 'Live Telemetry', icon: Activity },
    { to: '/benchmarks', label: 'Benchmarks', icon: BarChart2 },
    { to: '/audit', label: 'Audit Log', icon: ClipboardList },
  ];

  const systemNavItems = [
    { to: '/benchmarks', label: 'Model Status', icon: Cpu },
    { to: '/telemetry', label: 'Data Pipeline', icon: Database },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c2219] text-slate-300 flex flex-col justify-between
        border-r border-[#143527] transition-transform duration-200 ease-in-out select-none overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Section: Brand & Navigation */}
        <div className="relative z-10 flex flex-col">
          {/* Top Branding matching reference */}
          <div className="p-5 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#183c2c] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <Leaf className="w-5 h-5 fill-emerald-400/20 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-white font-sans">
                  EcoSegregate
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#163829] text-emerald-300 font-semibold border border-emerald-500/40 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/50 font-normal leading-tight mt-0.5 truncate">
                Automated Waste Classification
              </p>
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="h-px bg-white/5 w-full" />
          </div>

          {/* MAIN Navigation Links */}
          <div className="px-3 py-2">
            <p className="px-3 pb-2 text-[10px] font-bold text-emerald-300/40 uppercase tracking-wider">
              MAIN
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) => `
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150
                      ${isActive 
                        ? 'bg-[#183c28]/95 text-white border border-emerald-500/40 shadow-sm font-semibold' 
                        : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30 font-medium'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-300' : 'text-emerald-300/70 group-hover:text-emerald-300'
                        }`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 ml-auto text-emerald-300/80 shrink-0" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* SYSTEM Navigation Links */}
          <div className="px-3 pt-2">
            <p className="px-3 pb-2 text-[10px] font-bold text-emerald-300/40 uppercase tracking-wider">
              SYSTEM
            </p>
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => `
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150
                      ${isActive 
                        ? 'text-white hover:bg-emerald-900/30 font-medium' 
                        : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30 font-medium'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-emerald-300/70 group-hover:text-emerald-300 transition-colors" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Lower Botanical Foliage Layer & Environmental Card */}
        <div className="relative z-10 px-3 pb-4 pt-6">
          {/* Frosted Glass Environmental Message Card */}
          <div className="bg-[#102d20]/80 hover:bg-[#133526]/90 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between shadow-lg transition-all group cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#183c2c] border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Leaf className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white tracking-tight truncate">
                  Creating a Cleaner Tomorrow
                </p>
                <p className="text-[10px] text-emerald-200/60 font-normal truncate">
                  AI for a Sustainable Planet
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300/60 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </div>

          {/* System Version Footnote */}
          <div className="mt-3 px-2 flex items-center justify-between text-[10px] font-mono text-emerald-200/50">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-emerald-400/60" />
              <span>MobileNet / ResNet</span>
            </div>
            <span>v2.4</span>
          </div>
        </div>

        {/* Background Botanical Leaves Foliage Graphic in Lower Left Corner */}
        <div className="absolute -bottom-4 -left-6 w-80 h-96 pointer-events-none z-0 overflow-hidden select-none">
          <img 
            src="/images/sidebar_foliage_corner.jpg" 
            alt="Botanical Texture" 
            className="w-full h-full object-cover object-bottom-left opacity-70 mix-blend-screen"
          />
          {/* Subtle vignette gradient to integrate seamlessly into dark forest green */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#0c2219]/20 to-[#0c2219]" />
        </div>
      </aside>
    </>
  );
};
