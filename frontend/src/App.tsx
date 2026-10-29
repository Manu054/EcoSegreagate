import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { OverviewPage } from './pages/OverviewPage';
import { SegregationStudioPage } from './pages/SegregationStudioPage';
import { LiveTelemetryPage } from './pages/LiveTelemetryPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { AuditLogPage } from './pages/AuditLogPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="segregation" element={<SegregationStudioPage />} />
          <Route path="telemetry" element={<LiveTelemetryPage />} />
          <Route path="benchmarks" element={<BenchmarksPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          {/* Catch-all redirect to Overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
