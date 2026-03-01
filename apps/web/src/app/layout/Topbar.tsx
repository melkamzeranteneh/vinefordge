import React from 'react';

const Topbar: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
      <div className="w-full max-w-xl">
        <div className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 flex items-center text-sm text-slate-400">
          Search
        </div>
      </div>
      <div className="text-slate-300 text-xl">◐</div>
    </header>
  );
};

export default Topbar;
