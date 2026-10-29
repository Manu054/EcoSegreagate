import React from 'react';
import { 
  Recycle, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles,
  Bot,
  Activity,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-8 sm:p-14 shadow-2xl border border-emerald-900/40 glow-emerald">
        {/* Ambient Gradient Highlights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Autonomous Machine Learning & Robotics Chute Sorting</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Automated Waste Segregation
            <span className="block mt-2 bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Using Deep Neural Vision
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal text-balance">
            Real-time optical classification dividing municipal solid waste into 
            <strong className="text-emerald-400 font-semibold"> Biodegradable</strong> and 
            <strong className="text-cyan-400 font-semibold"> Non-Biodegradable</strong> streams. 
            Powered by independently trained <strong>MobileNetV2</strong>, <strong>ResNet50</strong>, and <strong>EfficientNetB0</strong> architectures with safety-gated diverter actuation.
          </p>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 pb-2 max-w-xl border-y border-white/10">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">28 ms</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Inference Latency</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">3 CNNs</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Ensemble Voting</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-teal-300">&gt;65%</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Safety Gating</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('classify')}
              className="px-7 py-3.5 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center gap-2.5 cursor-pointer"
            >
              <span>Launch Segregation Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('comparison')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm rounded-xl backdrop-blur-md hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Explore Benchmarks</span>
            </button>
          </div>
        </div>

        {/* Decorative Floating Emblem */}
        <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none hidden lg:block">
          <Recycle className="w-96 h-96 text-emerald-300 animate-spin-slow" />
        </div>
      </section>

      {/* 4-Step Interactive Workflow */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            End-to-End Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How EcoSegregate Sorts Waste in Milliseconds
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From optical specimen ingestion to physical sorting chute actuation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Optical Ingestion',
              desc: 'High-resolution image input captured via live webcam or user specimen upload.',
              icon: Layers,
              accent: 'from-blue-500 to-cyan-500',
            },
            {
              step: '02',
              title: 'Feature Extraction',
              desc: 'Normalized 224×224 RGB tensor evaluated through ImageNet-pretrained CNN feature extractors.',
              icon: Cpu,
              accent: 'from-emerald-500 to-teal-500',
            },
            {
              step: '03',
              title: 'Safety Interlocks',
              desc: 'Explicit class mapping maps predictions to streams; scores below 65% trigger inspection.',
              icon: ShieldCheck,
              accent: 'from-amber-500 to-orange-500',
            },
            {
              step: '04',
              title: 'Chute Actuation',
              desc: 'Simulated or physical servo arm rotates to target bin (Compost, Paper, Plastics, Metals).',
              icon: Zap,
              accent: 'from-purple-500 to-indigo-500',
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step} 
                className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300"
              >
                <div className={`w-2 h-2 rounded-full bg-linear-to-r ${item.accent} mb-4`}></div>
                <span className="text-4xl font-extrabold text-slate-100 group-hover:text-emerald-50 transition-colors absolute top-4 right-4 select-none font-mono">
                  {item.step}
                </span>
                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Three ML Architectures Compared */}
      <section className="bg-linear-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
              <Bot className="w-4 h-4" />
              <span>Convolutional Backbone Evaluation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trained CNN Architectures Benchmarked
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Three independently trained neural models compared on the identical untouched test set with zero data leakage.
            </p>
          </div>
          <button
            onClick={() => onNavigate('comparison')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <span>View Full Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MobileNetV2 */}
          <div className="glass-card-dark p-6 rounded-2xl border border-emerald-500/40 glow-emerald space-y-4 relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-xs">
              Selected Edge Model
            </span>
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-lg">MobileNetV2</h4>
              <span className="font-mono text-xs font-bold text-emerald-400">28 ms</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inverted residual blocks with depthwise separable convolutions. Offers the lowest inference latency (~28ms) and compact 22MB footprint, ideal for low-cost embedded sorters.
            </p>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Params: ~2.38M</span>
              <span>Size: 22.27 MB</span>
            </div>
          </div>

          {/* ResNet50 */}
          <div className="glass-card-dark p-6 rounded-2xl border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-lg">ResNet50</h4>
              <span className="font-mono text-xs font-bold text-blue-400">68 ms</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              50-layer deep residual architecture utilizing identity skip connections to conquer vanishing gradients. High representational capacity at the cost of larger size (210MB) and latency.
            </p>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Params: ~24.03M</span>
              <span>Size: 210.19 MB</span>
            </div>
          </div>

          {/* EfficientNetB0 */}
          <div className="glass-card-dark p-6 rounded-2xl border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-lg">EfficientNetB0</h4>
              <span className="font-mono text-xs font-bold text-purple-400">65 ms</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Principled compound scaling simultaneously scaling network depth, width, and input resolution. Delivers superior parameter efficiency (4.17M params, 26MB model size).
            </p>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Params: ~4.17M</span>
              <span>Size: 26.09 MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Value & Limitations */}
      <section className="glass-card rounded-3xl p-8 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Environmental Impact & Value
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Municipal solid waste contamination is the primary bottleneck in urban circular economies. By automating the source segregation of organic matter from recyclable polymers and metals:
          </p>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span><strong>Methane Abatement:</strong> Prevents organic compostable matter from decaying anaerobically in landfills.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span><strong>Pure Recyclate Streams:</strong> Reduces moisture contamination on cardboard, paper, and clean rigid plastics.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <span><strong>Occupational Safety:</strong> Minimizes manual contact with biohazardous materials in material recovery facilities.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Scientific Nuance & System Limitations
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Computer vision operates strictly on surface optical reflectance and cannot replace chemical spectroscopy. Crucial caveats:
          </p>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <span><strong>Biodegradability vs Recyclability:</strong> Not all recyclables are non-biodegradable (e.g. clean paper is biodegradable cellulose yet high-value recyclable). Soiled paper must be composted.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <span><strong>Composite Packaging:</strong> Multi-layer tetra packs, metallized chip bags, and wax cartons present mixed visual signatures.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <span><strong>Out-of-Distribution Inputs:</strong> Unseen items falling below the 65% confidence threshold are safely diverted to manual review.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
