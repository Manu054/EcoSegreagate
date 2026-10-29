import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isTelemetry = location.pathname === '/telemetry';
  const statusText = isTelemetry ? 'Pipeline Active' : 'System Online';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1e293b] flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          statusText={statusText}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
