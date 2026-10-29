import React, { useEffect, useState } from 'react';
import { Settings2, AlertOctagon, RotateCcw, Activity } from 'lucide-react';
import { apiClient } from '../api/client';
import { HardwareStatus } from '../types';

export const HardwareStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<HardwareStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await apiClient.getHardwareStatus();
      setStatus(data);
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleEstop = async () => {
    if (!status) return;
    setLoading(true);
    try {
      if (status.is_emergency_stopped) {
        const updated = await apiClient.resetEmergencyStop();
        setStatus(updated);
      } else {
        const updated = await apiClient.emergencyStop();
        setStatus(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!status) return null;

  return (
    <div className="glass-card rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 shadow-sm transition-colors ${
          status.is_emergency_stopped 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-emerald-100/80 text-emerald-800'
        }`}>
          <Settings2 className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Actuator Chute:</span>
            <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {status.current_bin}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Diverter Angle: <span className="font-mono font-bold text-slate-800">{status.servo_angle_deg}°</span> | Mode: <span className="capitalize font-semibold text-slate-700">{status.simulation_mode ? 'Software Simulation' : 'Physical Serial'}</span> | Cumulative Cycles: <span className="font-mono font-semibold text-slate-800">{status.total_sort_actions}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleToggleEstop}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            status.is_emergency_stopped
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80'
          }`}
        >
          {status.is_emergency_stopped ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Safety Interlock</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              <span>Emergency Stop (E-STOP)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
