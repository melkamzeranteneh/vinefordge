import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sileo';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CanvasPage from './pages/CanvasPage';

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="bottom-right" />
      <div className="dark min-h-screen bg-background text-foreground text-slate-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/canvas/:boardId" element={<CanvasPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
