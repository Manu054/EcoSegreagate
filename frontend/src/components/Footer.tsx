import React from 'react';
import { ShieldCheck, GitFork, BookOpen, FileSpreadsheet } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
              Smart Waste Management System
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Automated solid waste segregation platform driven by deep convolutional neural networks.
              Integrates transfer learning with MobileNetV2, ResNet50, and EfficientNetB0 alongside
              safety-gated physical diverter actuation.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
              System Modules
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li className="text-slate-500">FastAPI REST Services</li>
              <li className="text-slate-500">TorchVision Pretrained CNNs</li>
              <li className="text-slate-500">Simulated Servo Diverter</li>
              <li className="text-slate-500">SQLite Audit Telemetry</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Deliverables & Verification
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="/api/reports/Smart_Waste_Management_Project_Report.md" target="_blank" className="hover:text-emerald-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Project Report (.md)
                </a>
              </li>
              <li>
                <a href="/api/reports/model_comparison.csv" target="_blank" className="hover:text-emerald-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Benchmark CSV
                </a>
              </li>
              <li>
                <a href="/api/docs" target="_blank" className="hover:text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> OpenAPI Swagger
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 Academic Final Year Project | Department of Computer Science & Engineering</p>
          <p className="flex items-center gap-1">
            <span>Primary Dataset:</span>
            <span className="font-medium text-slate-600">Kaggle Waste Classification</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
