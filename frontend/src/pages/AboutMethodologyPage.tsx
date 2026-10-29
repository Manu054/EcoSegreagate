import React, { useEffect, useState } from 'react';
import { 
  Info, 
  BookOpen, 
  FileText, 
  FileSpreadsheet, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ReportFile } from '../types';

export const AboutMethodologyPage: React.FC = () => {
  const [reports, setReports] = useState<ReportFile[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const list = await apiClient.getReports();
        setReports(list);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className="space-y-12 py-4 max-w-5xl mx-auto text-slate-700">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Info className="w-6 h-6 text-emerald-600" />
          System Methodology & Technical Documentation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theoretical foundation, transfer learning pipeline, hardware abstraction, and deliverable reports for academic review.
        </p>
      </div>

      {/* Downloadable Project Deliverables */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Project Reports & Verification Artifacts</h3>
            <p className="text-xs text-slate-500">Official generated deliverables for B.Tech final-year project evaluation.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            {reports.length} Artifacts Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {reports.map((doc) => (
            <div key={doc.filename} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 hover:border-emerald-300 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                    {doc.file_type}
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs truncate max-w-xs">{doc.filename}</h5>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{doc.description}</p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Size: {(doc.size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <a
                href={doc.download_url}
                target="_blank"
                download
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition shrink-0 shadow-xs"
                title="Download artifact"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology Section */}
      <section className="space-y-8">
        {/* Problem Statement & Objectives */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Problem Statement & Objectives
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Rapid urbanization produces millions of tons of unsegregated solid municipal waste annually. 
            Traditional manual sorting is hazardous, slow, and economically inefficient, while bulk dumping 
            leads to massive methane emissions from decomposing organic matter in unlined landfills.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 text-xs block mb-1">1. Optical Classification</span>
              <p className="text-[11px] text-slate-500">Autonomous categorization of waste specimens into Biodegradable and Non-Biodegradable streams.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 text-xs block mb-1">2. Multi-Model Consensus</span>
              <p className="text-[11px] text-slate-500">Fair comparison and real-time ensemble agreement between MobileNetV2, ResNet50, and EfficientNetB0.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 text-xs block mb-1">3. Safety-Gated Actuation</span>
              <p className="text-[11px] text-slate-500">Confidence thresholding ensuring uncalibrated or uncertain predictions route to manual inspection.</p>
            </div>
          </div>
        </div>

        {/* Transfer Learning & CNN Architectures */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            Transfer Learning Methodology
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Training deep convolutional networks from scratch on specialized waste domains frequently suffers from overfitting due to limited annotated imagery. 
            Transfer learning exploits rich visual representations learned on the 1.28-million image ImageNet dataset:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li><strong>Feature Extractor Freezing:</strong> Base convolutional backbones are initially frozen to preserve low-level Gabor filters and edge discriminators.</li>
            <li><strong>Custom Classification Head:</strong> The original 1,000-class linear projection is replaced with Dropout, BatchNorm1d, and Dense layers tuned to waste classes.</li>
            <li><strong>Stratified Split Isolation:</strong> 70% Train, 15% Validation, 15% Test splits ensure zero data leakage across evaluation.</li>
            <li><strong>Class Weighting:</strong> Cross-entropy loss is weighted by inverse class frequencies to eliminate class imbalance bias.</li>
          </ul>
        </div>

        {/* Hardware Integration Architecture */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Hardware Sorting Abstraction
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The platform provides a modular abstraction decoupling ML software inference from mechanical hardware. 
            The system executes seamlessly in pure software simulation, while maintaining full protocol compatibility with:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">Arduino Microcontroller (USB Serial)</span>
              <p className="text-[11px] text-slate-500">Transmits structured servo angular commands (e.g., <code>SERVO:45\n</code>) over serial baud 9600 to trigger pneumatic diverter gates.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">Raspberry Pi / PCA9685 I2C</span>
              <p className="text-[11px] text-slate-500">Direct PWM duty cycle generation on GPIO pin 18 or 16-channel PCA9685 driver with integrated emergency stop latching.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
