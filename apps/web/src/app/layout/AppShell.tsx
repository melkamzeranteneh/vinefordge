import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppRoutes from './AppRoutes';

const AppShell: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col">
        <Topbar />
        <div className="flex-1 min-h-0 p-6 bg-slate-900">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
