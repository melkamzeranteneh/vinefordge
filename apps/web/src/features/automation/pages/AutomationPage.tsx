import React from 'react';
import WorkflowCanvas from '../components/WorkflowCanvas';

const AutomationPage: React.FC = () => {
  return (
    <section className="w-full h-full flex flex-col min-h-0">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold text-slate-100">Automation</h1>
        <p className="text-slate-400 text-sm">APP / VISUAL WORKFLOW BUILDER</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button className="px-4 py-2 rounded-md border border-slate-600 text-slate-100 text-sm">Save</button>
        <button className="px-4 py-2 rounded-md border border-slate-600 text-slate-100 text-sm">Save</button>
        <button className="px-4 py-2 rounded-md border border-slate-600 text-slate-100 text-sm">Test Workflow</button>
      </div>

      <div className="flex-1 min-h-0">
        <WorkflowCanvas />
      </div>
    </section>
  );
};

export default AutomationPage;
