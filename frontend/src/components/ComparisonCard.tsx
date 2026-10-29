import React from 'react';
import { Zap, Award, Layers, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ModelComparisonResponse } from '../types';

interface ComparisonCardProps {
  comparison: ModelComparisonResponse;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ comparison }) => {
  const modelEntries = Object.entries(comparison.predictions);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/80 space-y-6">
      {/* Consensus Header Banner */}
      <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Ensemble Consensus
            </span>
            <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              {comparison.agreement_percentage}% Agreement
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white mt-1">
            {comparison.consensus_category}
          </h3>
          <p className="text-xs text-slate-300 font-light">
            {comparison.recommended_action}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl self-start sm:self-auto shrink-0">
          <span className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider block">Fastest Inference</span>
          <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5 font-mono">
            <Zap className="w-4 h-4 text-amber-400" />
            {comparison.fastest_model}
          </span>
        </div>
      </div>

      {/* 3 Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modelEntries.map(([key, item]) => {
          const isBio = item.segregation_category === 'Biodegradable';
          const conf = (item.confidence * 100).toFixed(1);
          const isFastest = comparison.fastest_model.toLowerCase().includes(key.replace('_', ''));

          return (
            <div
              key={key}
              className={`p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
                isFastest
                  ? 'border-emerald-400/80 bg-emerald-50/40 shadow-md shadow-emerald-500/5'
                  : 'border-slate-200/80 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm capitalize">
                  {key.replace('_', ' ')}
                </h4>
                {isFastest ? (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <Zap className="w-3 h-3 text-amber-600" /> Fastest
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">CNN</span>
                )}
              </div>

              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide border ${
                  isBio 
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' 
                    : 'bg-blue-100/80 text-blue-800 border-blue-200'
                }`}>
                  {item.segregation_category}
                </span>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                  Class: <strong className="text-slate-800 capitalize">{item.predicted_class}</strong>
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Confidence:</span>
                  <span className="font-mono font-extrabold text-slate-900">{conf}%</span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBio ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${conf}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Latency:
                </span>
                <span className="font-mono font-bold text-slate-800">{item.inference_time_ms} ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
