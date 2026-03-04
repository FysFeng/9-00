import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FeedView from './components/FeedView';
import WorkbenchView from './components/WorkbenchView';
import { useIntelligenceStore } from './src/store/useIntelligenceStore';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 ml-64 relative min-h-screen transition-all">
        {children}
      </main>
    </div>
  );
}

function App() {
  const { fetchData, isLoading, rawIntelligence } = useIntelligenceStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && rawIntelligence.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 text-xs">Changan Insight Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feed" element={<FeedView />} />
          <Route path="/workbench" element={<WorkbenchView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
