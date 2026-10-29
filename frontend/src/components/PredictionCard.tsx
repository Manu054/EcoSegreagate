import React from 'react';
import { 
  CheckCircle2, 
  Layers, 
  Clock, 
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Compass,
  Cpu
} from 'lucide-react';
import { PredictionResponse } from '../types';

interface PredictionCardProps {
  prediction: PredictionResponse;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const isBio = prediction.segregation_category === 'Biodegradable';
  const confidencePct = (prediction.confidence * 100).toFixed(1);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/80 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Autonomous Classification Result
          </span>
          <div className="flex items-center gap-3">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isBio ? 'text-emerald-700' : 'text-blue-700'
            }`}>
              {prediction.segregation_category}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
              isBio 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              Class: {prediction.predicted_class}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/70 px-3.5 py-2 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Latency</span>
            <span className="font-mono text-xs font-bold text-slate-800">{prediction.inference_time_ms} ms</span>
          </div>
        </div>
      </div>

      {/* Uncertainty Warning if Applicable */}
      {prediction.is_uncertain && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-start gap-3.5 text-amber-950 text-xs shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-amber-950 text-sm">Uncertain Prediction (Safety Gated)</h5>
            <p className="leading-relaxed">
              Model confidence score ({confidencePct}%) is below the automated safety threshold (65.0%). 
              The specimen has been diverted to the <strong className="underline">Inspection / Manual Review Bin</strong> to prevent recycling stream contamination.
            </p>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Confidence Gauge */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Model Confidence:</span>
            <span className="font-mono font-extrabold text-slate-900 text-sm">{confidencePct}%</span>
          </div>
          <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                prediction.is_uncertain
                  ? 'bg-amber-500'
                  : isBio
                  ? 'bg-linear-to-r from-emerald-500 to-teal-500'
                  : 'bg-linear-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, prediction.confidence * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 italic flex items-center gap-1.5 pt-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            Softmax output values represent relative activations and are not calibrated real-world probabilities.
          </p>
        </div>

        {/* Physical Sorting Destination */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Physical Actuation Target:
            </span>
            <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{prediction.bin_assigned}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              Diverter Servo Angle:
            </span>
            <span className="font-mono font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
              {prediction.servo_angle_deg}°
            </span>
          </div>
        </div>
      </div>

      {/* Probabilities Breakdown */}
      {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
        <div className="pt-4 border-t border-slate-200/80 space-y-3">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Softmax Class Distribution Breakdown
          </h5>
          <div className="space-y-2.5">
            {Object.entries(prediction.probabilities).map(([cls, prob]) => {
              const p = (prob * 100).toFixed(1);
              const isTop = cls === prediction.predicted_class;
              return (
                <div key={cls} className="flex items-center gap-3 text-xs">
                  <span className={`w-28 capitalize truncate ${isTop ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    {cls}
                  </span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isTop ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <span className="font-mono text-slate-700 font-semibold w-12 text-right">{p}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
