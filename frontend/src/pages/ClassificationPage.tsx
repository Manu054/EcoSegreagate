import React, { useState } from 'react';
import { 
  Camera, 
  Cpu, 
  Layers, 
  Sparkles, 
  RotateCcw, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Info,
  ArrowRight,
  Flame,
  Apple,
  Package,
  Milk
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { CameraCapture } from '../components/CameraCapture';
import { PredictionCard } from '../components/PredictionCard';
import { ComparisonCard } from '../components/ComparisonCard';
import { HardwareStatusBadge } from '../components/HardwareStatusBadge';
import { apiClient } from '../api/client';
import { PredictionResponse, ModelComparisonResponse } from '../types';

export const ClassificationPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('mobilenet_v2');
  const [compareAll, setCompareAll] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [singleResult, setSingleResult] = useState<PredictionResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ModelComparisonResponse | null>(null);

  // Quick Demo Specimen Generator
  const handleQuickDemoSpecimen = (type: 'organic' | 'recyclable') => {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'organic') {
      // Earthy compost green/brown with leafy organic forms
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 0, 224, 224);
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(112, 112, 60, 40, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(108, 60, 8, 25);
    } else {
      // Metallic cyan/blue with bottle cylinder geometry
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 224, 224);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(80, 50, 64, 120, [15, 15, 4, 4]);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(96, 30, 32, 20);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob], 
          `demo_specimen_${type}.jpg`, 
          { type: 'image/jpeg' }
        );
        setSelectedFile(file);
        setErrorMsg(null);
        setSingleResult(null);
        setComparisonResult(null);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setErrorMsg('Please upload a waste image or capture one using your camera first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSingleResult(null);
    setComparisonResult(null);

    try {
      if (compareAll) {
        const comp = await apiClient.classifyImageCompare(selectedFile);
        setComparisonResult(comp);
      } else {
        const pred = await apiClient.classifyImage(selectedFile, selectedModel);
        setSingleResult(pred);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Classification request failed. Ensure backend server is operational.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSingleResult(null);
    setComparisonResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Interactive Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            Waste Segregation Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Feed digital imagery or camera captures into convolutional classifiers and trigger physical sorting chutes.
          </p>
        </div>

        <button
          onClick={() => setShowCamera(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-slate-900/10 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Launch Camera Feed</span>
        </button>
      </div>

      {/* Hardware Telemetry Bar */}
      <HardwareStatusBadge />

      {/* Quick Specimen Presets Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Quick Demo Specimen Presets:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuickDemoSpecimen('organic')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition cursor-pointer"
          >
            <span>🍎 Organic Compost Specimen</span>
          </button>
          <button
            onClick={() => handleQuickDemoSpecimen('recyclable')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium transition cursor-pointer"
          >
            <span>🧴 Recyclable Polymer Bottle</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Ingestion & Model Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>Step 1: Specimen Ingestion</span>
              {selectedFile && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready to Classify
                </span>
              )}
            </h3>

            <ImageUploader
              selectedFile={selectedFile}
              onImageSelected={(file) => {
                setSelectedFile(file);
                setErrorMsg(null);
              }}
              onClear={handleReset}
            />

            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Step 2: Architecture Configuration
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Convolutional Classifier:
                </label>
                <select
                  value={selectedModel}
                  disabled={compareAll || loading}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition cursor-pointer"
                >
                  <option value="mobilenet_v2">MobileNetV2 (Recommended - 28ms latency, 22MB)</option>
                  <option value="resnet50">ResNet50 (Deep 50-Layer Residual Network, 210MB)</option>
                  <option value="efficientnet_b0">EfficientNetB0 (Compound Scaled Architecture, 26MB)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={compareAll}
                    onChange={(e) => setCompareAll(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Compare All Three Models (Ensemble Consensus)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6 mt-0.5">
                  Executes MobileNetV2, ResNet50, and EfficientNetB0 in parallel with agreement metrics.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleClassify}
                disabled={!selectedFile || loading}
                className="flex-1 py-3.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Neural Forward Pass...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Automated Segregation</span>
                  </>
                )}
              </button>

              {(singleResult || comparisonResult) && (
                <button
                  onClick={handleReset}
                  className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Reset workspace"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Outcomes & Actuation Directive */}
        <div className="lg:col-span-7 space-y-6">
          {singleResult && (
            <PredictionCard prediction={singleResult} />
          )}

          {comparisonResult && (
            <ComparisonCard comparison={comparisonResult} />
          )}

          {!singleResult && !comparisonResult && !loading && (
            <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
                <Cpu className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-1">
                Awaiting Specimen Ingestion
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Upload or capture a waste item to execute CNN inference. The classification results, 
                confidence distribution, and physical sorting servo angles will render here.
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-left w-full max-w-md text-[11px] text-slate-600 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Green Bin (45°): Organic Waste</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Blue Bin (75°): Clean Paper / Fiber</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Yellow Bin (120°): Rigid Plastics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0"></span>
                  <span>Grey Bin (150°): Metals & Cans</span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                <Cpu className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">
                  Analyzing Optical Specimen...
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Extracting deep convolutional feature tensors, evaluating softmax activations, and safety-checking chute interlocks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onImageCaptured={(file) => {
            setSelectedFile(file);
            setShowCamera(false);
            setErrorMsg(null);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
