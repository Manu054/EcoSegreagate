import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Camera, 
  Server, 
  Play, 
  Pause, 
  RefreshCw, 
  ArrowUpRight, 
  AlertTriangle, 
  AlertCircle, 
  Zap, 
  Layers, 
  Video, 
  Square, 
  Crosshair 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { apiClient } from '../api/client';
import { TelemetryDataResponse, HistoryItem } from '../types';

type CameraStatus = 'idle' | 'requesting' | 'active' | 'paused' | 'denied' | 'unsupported';

export const LiveTelemetryPage: React.FC = () => {
  const navigate = useNavigate();

  // Telemetry Feed State
  const [data, setData] = useState<TelemetryDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '24h'>('1h');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | '80' | '90' | 'low'>('all');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Live Laptop Camera & Real-Time AI Classification State
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [captureIntervalMs, setCaptureIntervalMs] = useState<number>(2000); // 2 seconds default
  const [selectedModel, setSelectedModel] = useState<string>('mobilenet_v2');
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [latestInferenceOverlay, setLatestInferenceOverlay] = useState<{
    item: string;
    category: string;
    confidence: number;
    latency_ms: number;
    timestamp: string;
  } | null>(null);

  // Active Detection Card (synced immediately when camera infers)
  const [activeDetection, setActiveDetection] = useState<HistoryItem | null>(null);

  // Video & Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInferringRef = useRef<boolean>(false);
  const captureTimerRef = useRef<any>(null);

  // 1. Fetch Telemetry Data from Backend
  const fetchTelemetry = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      let minConf = 0.0;
      if (confidenceFilter === '80') minConf = 0.8;
      else if (confidenceFilter === '90') minConf = 0.9;

      const res = await apiClient.getTelemetryData(timeRange, minConf, 50);

      if (confidenceFilter === 'low') {
        res.recent_activity = res.recent_activity.filter(
          item => item.confidence < 0.70 || item.is_uncertain
        );
      }

      setData(res);
      if (res.latest_detection) {
        setActiveDetection(prev => prev ?? res.latest_detection);
      }
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load live telemetry:', err);
      setError(err.message || 'Telemetry connection error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, confidenceFilter]);

  // 2. Telemetry Polling (Every 2.5 seconds)
  useEffect(() => {
    fetchTelemetry(false);

    if (!isPolling) return;

    const intervalId = setInterval(() => {
      fetchTelemetry(true);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [fetchTelemetry, isPolling]);

  // 3. Frame Capture and Real-Time ML Inference
  const captureAndClassify = useCallback(async () => {
    if (!videoRef.current || isInferringRef.current || cameraStatus !== 'active') return;
    const video = videoRef.current;

    // Ensure video frame data is ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

    isInferringRef.current = true;
    setIsInferring(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current video frame onto canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas frame to JPEG Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (!blob) return;

      const file = new File([blob], `webcam_frame_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Send to existing real ML prediction endpoint: POST /api/predict
      const pred = await apiClient.classifyImage(file, selectedModel);

      // Increment session counter
      setSessionCount(prev => prev + 1);

      // Update in-video HUD overlay
      setLatestInferenceOverlay({
        item: pred.predicted_class,
        category: pred.segregation_category,
        confidence: pred.confidence,
        latency_ms: pred.inference_time_ms,
        timestamp: new Date().toLocaleTimeString()
      });

      // Update Current Detection card immediately
      const newHistoryItem: HistoryItem = {
        id: pred.id || Date.now(),
        timestamp: pred.timestamp || new Date().toISOString(),
        filename: file.name,
        model_name: pred.model_name,
        predicted_class: pred.predicted_class,
        segregation_category: pred.segregation_category,
        confidence: pred.confidence,
        inference_time_ms: pred.inference_time_ms,
        bin_assigned: pred.bin_assigned,
        servo_angle_deg: pred.servo_angle_deg,
        hardware_triggered: pred.hardware_triggered,
        is_uncertain: pred.is_uncertain,
        status: pred.status,
        thumbnail_data: pred.thumbnail_data || canvas.toDataURL('image/jpeg', 0.6)
      };
      setActiveDetection(newHistoryItem);

      // Background telemetry refetch to sync KPI cards, trend chart, and activity table with new SQLite record
      fetchTelemetry(true);
    } catch (err: any) {
      console.warn('Webcam frame classification failed:', err);
    } finally {
      isInferringRef.current = false;
      setIsInferring(false);
    }
  }, [cameraStatus, selectedModel, fetchTelemetry]);

  // 4. Automated Inference Loop when Camera is Active
  useEffect(() => {
    if (cameraStatus !== 'active') {
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
      return;
    }

    // Initial capture once video stream settles
    const initialTimer = setTimeout(() => {
      captureAndClassify();
    }, 700);

    const intervalTimer = setInterval(() => {
      captureAndClassify();
    }, captureIntervalMs);
    captureTimerRef.current = intervalTimer;

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      captureTimerRef.current = null;
    };
  }, [cameraStatus, captureIntervalMs, captureAndClassify]);

  // 5. Start Camera
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      setCameraError('Camera API is not supported in this browser or requires an HTTPS/localhost origin.');
      return;
    }

    try {
      setCameraStatus('requesting');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(e => console.warn('Video play warning:', e));
      }
      setCameraStatus('active');
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraStatus('denied');
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser address bar and try again.'
          : `Camera initialization error: ${err.message || 'Device unavailable'}`
      );
    }
  };

  // 6. Stop Camera & Release Hardware Resources
  const stopCamera = () => {
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
    setCameraError(null);
    setIsInferring(false);
    isInferringRef.current = false;
  };

  // 7. Pause & Resume Monitoring
  const pauseMonitoring = () => {
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    setCameraStatus('paused');
  };

  const resumeMonitoring = () => {
    setCameraStatus('active');
    captureAndClassify();
  };

  // Cleanup on Component Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
      }
    };
  }, []);

  const handleManualRefresh = () => {
    fetchTelemetry(false);
  };

  const togglePolling = () => {
    const nextState = !isPolling;
    setIsPolling(nextState);
    if (nextState) {
      fetchTelemetry(false);
    }
  };

  // Formatting helpers
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });
    } catch {
      return isoString;
    }
  };

  const metrics = data?.metrics;
  const health = data?.system_health;
  const currentItem = activeDetection || data?.latest_detection;
  const isCurrentBio = currentItem?.segregation_category === 'Biodegradable';

  return (
    <div className="space-y-6">
      {/* Top Header & Monitoring Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Live Telemetry
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
              cameraStatus === 'active'
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                : cameraStatus === 'paused'
                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                : 'text-slate-600 bg-slate-100 border border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                cameraStatus === 'active' ? 'bg-emerald-500 animate-pulse' : cameraStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              <span>
                {cameraStatus === 'active' 
                  ? `CAMERA ACTIVE (${(captureIntervalMs / 1000).toFixed(1)}s)` 
                  : cameraStatus === 'paused'
                  ? 'INFERENCE PAUSED' 
                  : 'STANDBY'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time laptop camera vision feed, continuous ML classification, and live industrial telemetry.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Telemetry Polling Toggle */}
          <button
            onClick={togglePolling}
            title={isPolling ? 'Pause background telemetry polling' : 'Resume background telemetry polling'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors shadow-2xs ${
              isPolling
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700'
            }`}
          >
            {isPolling ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause Polling</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Resume Polling</span>
              </>
            )}
          </button>

          {/* Manual Telemetry Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Fetch latest telemetry records immediately"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Time Range Filter */}
          <div className="inline-flex items-center rounded-md bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setTimeRange('15m')}
              className={`px-2.5 py-1 rounded-xs font-medium transition-colors ${
                timeRange === '15m' 
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15m
            </button>
            <button
              onClick={() => setTimeRange('1h')}
              className={`px-2.5 py-1 rounded-xs font-medium transition-colors ${
                timeRange === '1h' 
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1h
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-2.5 py-1 rounded-xs font-medium transition-colors ${
                timeRange === '24h' 
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24h
            </button>
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value as any)}
              className="bg-white text-slate-700 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:border-slate-500 shadow-2xs"
            >
              <option value="all">All Confidences</option>
              <option value="80">≥ 80% Confidence</option>
              <option value="90">≥ 90% Confidence</option>
              <option value="low">Low Confidence (&lt; 70%)</option>
            </select>
          </div>

          {/* View Audit Log Navigation */}
          <button
            onClick={() => navigate('/audit')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs ml-auto lg:ml-0"
          >
            <span>Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span><strong>Connection Alert:</strong> {error}. Retrying automatically.</span>
          </div>
          <button 
            onClick={handleManualRefresh} 
            className="underline font-semibold hover:text-red-900"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Real Functional KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Detections */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Detections</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics?.total_detections ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Window: <span className="font-medium text-slate-700">{timeRange === '15m' ? 'Last 15 minutes' : timeRange === '1h' ? 'Last 1 hour' : 'Last 24 hours'}</span>
          </p>
        </div>

        {/* Biodegradable % */}
        <div className="pro-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Biodegradable</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
              {metrics?.biodegradable_count ?? 0} items
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            {metrics?.biodegradable_pct !== undefined ? `${metrics.biodegradable_pct.toFixed(1)}%` : '0.0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Diverted to Green Bin (45°)
          </p>
        </div>

        {/* Non-Biodegradable % */}
        <div className="pro-card p-4 border-l-4 border-l-red-600">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Non-Biodegradable</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-red-50 text-red-800 border border-red-200">
              {metrics?.non_biodegradable_count ?? 0} items
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-800">
            {metrics?.non_biodegradable_pct !== undefined ? `${metrics.non_biodegradable_pct.toFixed(1)}%` : '0.0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Diverted to Red Bin (135°)
          </p>
        </div>

        {/* Latency & Throughput */}
        <div className="pro-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Latency & Throughput</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {metrics?.avg_latency_ms !== undefined ? `${metrics.avg_latency_ms.toFixed(1)} ms` : '0.0 ms'}
            </span>
            <span className="text-xs font-mono text-slate-500">
              • {metrics?.throughput_per_min !== undefined ? `${metrics.throughput_per_min.toFixed(2)}/min` : '0/min'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Forward inference compute duration
          </p>
        </div>
      </div>

      {/* Main Monitoring Section: Live Camera Feed (5 Cols), Current Detection (4 Cols), System Health (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Live Laptop Camera Feed Panel (5 Cols) */}
        <div className="lg:col-span-5 pro-card overflow-hidden flex flex-col justify-between">
          <div>
            {/* Camera Header Bar */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Laptop Optical Vision Sensor
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono ${
                cameraStatus === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : cameraStatus === 'paused'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cameraStatus === 'active' ? 'bg-emerald-600 animate-pulse' : cameraStatus === 'paused' ? 'bg-amber-600' : 'bg-slate-500'
                }`} />
                <span>
                  {cameraStatus === 'active' ? 'LIVE STREAM' : cameraStatus === 'paused' ? 'PREVIEW PAUSED' : 'OFFLINE'}
                </span>
              </span>
            </div>

            {/* Video Viewport / Standby Display */}
            <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Actual Video Element for Laptop Camera */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraStatus === 'active' || cameraStatus === 'paused' ? 'opacity-100' : 'hidden'
                }`} 
              />

              {/* Standby State (When Camera is Not Active) */}
              {cameraStatus === 'idle' && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Webcam Standby</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Activate your laptop's camera to detect and classify waste specimens (bottles, peels, cans) automatically every 2 seconds.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-md transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Laptop Camera</span>
                  </button>
                </div>
              )}

              {/* Requesting Permission State */}
              {cameraStatus === 'requesting' && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Accessing Laptop Camera...</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Please click <strong>Allow</strong> in your browser's camera permission prompt.
                    </p>
                  </div>
                </div>
              )}

              {/* Permission Denied or Unsupported Error State */}
              {(cameraStatus === 'denied' || cameraStatus === 'unsupported') && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-red-200 space-y-3 bg-red-950/40">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Camera Access Denied</h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      {cameraError || 'Webcam access was denied. Enable camera access in your browser address bar permissions and try again.'}
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera Access</span>
                  </button>
                </div>
              )}

              {/* Active Optical Targeting Reticle Overlay */}
              {(cameraStatus === 'active' || cameraStatus === 'paused') && (
                <>
                  {/* Subtle Corner Brackets HUD */}
                  <div className="absolute inset-6 border border-emerald-500/20 pointer-events-none rounded-sm">
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                  </div>

                  {/* Top-Left Live Sensor Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-bold font-mono tracking-wider shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>WEBCAM LIVE</span>
                  </div>

                  {/* Top-Right Architecture Indicator */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-slate-900/90 text-slate-300 text-[10px] font-mono border border-slate-700">
                    {selectedModel.toUpperCase()}
                  </div>

                  {/* Dynamic Inference Banner Overlay */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    {isInferring ? (
                      <div className="px-2.5 py-1 rounded-sm bg-slate-900/90 text-emerald-300 text-[11px] font-mono border border-emerald-500/40 flex items-center gap-2 shadow-md">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Processing Frame...</span>
                      </div>
                    ) : latestInferenceOverlay ? (
                      <div className={`px-2.5 py-1 rounded-sm text-[11px] font-mono border backdrop-blur-xs flex items-center gap-2 shadow-md ${
                        latestInferenceOverlay.category === 'Biodegradable'
                          ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900/90 text-red-300 border-red-500/50'
                      }`}>
                        <span className="font-bold">{latestInferenceOverlay.item}</span>
                        <span>•</span>
                        <span>{latestInferenceOverlay.category}</span>
                        <span>•</span>
                        <span>{(latestInferenceOverlay.confidence * 100).toFixed(1)}%</span>
                        <span>•</span>
                        <span>{latestInferenceOverlay.latency_ms.toFixed(1)}ms</span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded-sm bg-slate-900/80 text-slate-400 text-[10px] font-mono border border-slate-700">
                        {cameraStatus === 'paused' ? 'Inference Paused' : 'Awaiting Frame Ingestion'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Camera Operational Controls Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {cameraStatus === 'active' ? (
                <>
                  <button
                    onClick={pauseMonitoring}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={captureAndClassify}
                    disabled={isInferring}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs disabled:opacity-60"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Capture Now</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                  >
                    <Square className="w-3 h-3 text-red-600" />
                    <span>Stop Camera</span>
                  </button>
                </>
              ) : cameraStatus === 'paused' ? (
                <>
                  <button
                    onClick={resumeMonitoring}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Monitoring</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                  >
                    <Square className="w-3 h-3 text-red-600" />
                    <span>Stop Camera</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              )}
            </div>

            {/* Model & Interval Selectors */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white text-slate-700 border border-slate-300 rounded-md px-2 py-1 text-xs font-sans font-medium focus:outline-hidden"
              >
                <option value="mobilenet_v2">MobileNetV2 (Edge)</option>
                <option value="resnet50">ResNet50 (Deep)</option>
                <option value="efficientnet_b0">EfficientNetB0 (Compound)</option>
              </select>

              <select
                value={captureIntervalMs}
                onChange={(e) => setCaptureIntervalMs(Number(e.target.value))}
                className="bg-white text-slate-700 border border-slate-300 rounded-md px-2 py-1 text-xs font-sans font-medium focus:outline-hidden"
              >
                <option value={1000}>1.0s Interval</option>
                <option value={2000}>2.0s Interval (Default)</option>
                <option value={3000}>3.0s Interval</option>
                <option value={5000}>5.0s Interval</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Detection Card (4 Cols) */}
        <div className="lg:col-span-4 pro-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Current Detection
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                {currentItem ? `RECORD #${currentItem.id}` : 'STANDBY'}
              </span>
            </div>

            {currentItem ? (
              <div className="mt-4">
                <div className="flex items-center gap-3.5">
                  {currentItem.thumbnail_data ? (
                    <img 
                      src={currentItem.thumbnail_data} 
                      alt={currentItem.predicted_class} 
                      className="w-14 h-14 rounded-md object-cover border border-slate-200 shadow-2xs" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-mono font-bold">
                      {currentItem.predicted_class.substring(0, 3).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-slate-900 truncate">
                      {currentItem.predicted_class}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                        isCurrentBio 
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                          : 'text-red-800 bg-red-50 border-red-200'
                      }`}>
                        {currentItem.segregation_category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {currentItem.model_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-4 pt-1">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-500">Confidence Score</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {(currentItem.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrentBio ? 'bg-emerald-600' : 'bg-red-600'
                      }`} 
                      style={{ width: `${Math.min(100, Math.max(0, currentItem.confidence * 100))}%` }} 
                    />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Inference Latency</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentItem.inference_time_ms.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Servo Position</span>
                    <span className="font-mono font-medium text-slate-800">
                      {currentItem.servo_angle_deg}° Diverter Angle
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Bin</span>
                    <span className="font-mono font-medium text-slate-800">
                      {currentItem.bin_assigned}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Timestamp</span>
                    <span className="font-mono text-slate-600">
                      {formatDateTime(currentItem.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No detections recorded in this database yet.</p>
                <button
                  onClick={startCamera}
                  className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  Start camera to begin real-time classification
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Session Ingested: {sessionCount} frames</span>
            <span>Status: {currentItem?.status || 'Ready'}</span>
          </div>
        </div>

        {/* System Status Card (3 Cols) */}
        <div className="lg:col-span-3 pro-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  System Health
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-sm ${
                error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {error ? 'DEGRADED' : 'HEALTHY'}
              </span>
            </div>

            <div className="mt-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Laptop Camera</span>
                <span className={`font-mono text-xs font-semibold flex items-center gap-1.5 ${
                  cameraStatus === 'active' ? 'text-emerald-700' : cameraStatus === 'paused' ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    cameraStatus === 'active' ? 'bg-emerald-500 animate-pulse' : cameraStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  {cameraStatus === 'active' ? 'Active Stream' : cameraStatus === 'paused' ? 'Paused' : 'Standby'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Backend API</span>
                <span className="font-mono text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {health?.api_status || (error ? 'Unavailable' : 'Operational')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Inference Core</span>
                <span className="font-mono text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {health?.models_ready || '3 / 3 Active'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Telemetry Stream</span>
                <span className={`font-mono text-xs font-semibold flex items-center gap-1.5 ${
                  isPolling ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isPolling ? 'Active Polling' : 'Stream Paused'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600">Recent Faults</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {health?.recent_errors_count ?? 0} errors
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Last Inference:</span>
              <span className="font-mono text-slate-700 font-semibold">
                {formatTime(currentItem?.timestamp || health?.last_inference_timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Client Ping:</span>
              <span className="font-mono">{lastUpdated ? lastUpdated.toLocaleTimeString() : 'syncing...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-time Ingestion Activity Table & Classification Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Ingestion Activity Table (7 Cols) */}
        <div className="lg:col-span-7 pro-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Real-time Ingestion Activity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Streaming feed of recent edge classification records
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                {data?.recent_activity.length || 0} Records In View
              </span>
              <button
                onClick={() => navigate('/audit')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5"
              >
                <span>View Full Audit</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Specimen</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Target Bin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {data?.recent_activity && data.recent_activity.length > 0 ? (
                  data.recent_activity.slice(0, 10).map((act) => {
                    const isActBio = act.segregation_category === 'Biodegradable';
                    return (
                      <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 text-slate-400">#{act.id}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {formatTime(act.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 flex items-center gap-2">
                          {act.thumbnail_data && (
                            <img 
                              src={act.thumbnail_data} 
                              alt={act.predicted_class} 
                              className="w-5 h-5 rounded-xs object-cover border border-slate-200 shrink-0" 
                            />
                          )}
                          <span className="truncate max-w-[120px]">{act.predicted_class}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-sans font-semibold border ${
                            isActBio 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                              : 'text-red-800 bg-red-50 border-red-200'
                          }`}>
                            {act.segregation_category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {(act.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {act.inference_time_ms.toFixed(1)} ms
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans text-xs">
                          {act.bin_assigned.replace(' Bin', '')} ({act.servo_angle_deg}°)
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      {loading ? 'Connecting to telemetry service...' : 'No activity records match the selected filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classification Trend Line Chart (5 Cols) */}
        <div className="lg:col-span-5 pro-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Classification Trend
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Detections over time in selected window
                </p>
              </div>

              {/* Time Range Selector dropdown inside chart */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-sm px-2 py-1 focus:outline-hidden font-medium"
              >
                <option value="15m">Last 15-mins</option>
                <option value="1h">Last 1-hour</option>
                <option value="24h">Last 24-hours</option>
              </select>
            </div>

            <div className="mt-4 h-56 w-full">
              {data?.trend_chart && data.trend_chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend_chart} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '6px', 
                        borderColor: '#e2e8f0', 
                        fontSize: '11px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="biodegradable" 
                      name="Biodegradable"
                      stroke="#10593b" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#10593b' }} 
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="non_biodegradable" 
                      name="Non-Biodegradable"
                      stroke="#dc2626" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#dc2626' }} 
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {loading ? 'Loading trend data...' : 'No historical data points in this window.'}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Throughput: {metrics?.throughput_per_min !== undefined ? `${metrics.throughput_per_min.toFixed(2)} items/min` : '0 items/min'}</span>
            <span className="text-slate-400">Total in Range: {metrics?.total_detections ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
