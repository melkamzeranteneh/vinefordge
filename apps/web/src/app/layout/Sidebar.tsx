import React from 'react';

type NavSection = {
  label: string;
  children?: string[];
};

const navSections: NavSection[] = [
  { label: 'Dashboard' },
  { label: 'Customer' },
  { label: 'Project' },
  { label: 'Task' },
  { label: 'Leads' },
  { label: 'Sales' },
  { label: 'Pos' },
  { label: 'Automation', children: ['Visual Workflow Builder', 'Template', 'Audit & Runs'] },
  { label: 'AI Studio' },
  { label: 'AI Voice Call Center' },
  { label: 'Proposals' },
  { label: 'Contact' },
  { label: 'Support' },
  { label: 'Team' },
  { label: 'Report' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-950 text-slate-300 h-full overflow-y-auto">
      <div className="h-16 px-6 border-b border-slate-800 flex items-center text-xl font-semibold tracking-wide">
        RYVEN
      </div>
      <nav className="px-3 py-4 space-y-1">
        {navSections.map((section) => {
          const isAutomation = section.label === 'Automation';

          return (
            <div key={section.label}>
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                  isAutomation ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-900'
                }`}
              >
                <span>{section.label}</span>
                {section.children ? <span>⌄</span> : <span>›</span>}
              </button>

              {section.children && (
                <div className="mt-1 ml-3 border-l border-slate-800 pl-3 space-y-1">
                  {section.children.map((child) => {
                    const isActiveChild = child === 'Visual Workflow Builder';
                    return (
                      <div
                        key={child}
                        className={`px-2 py-1.5 rounded text-sm ${
                          isActiveChild ? 'text-slate-100' : 'text-slate-500'
                        }`}
                      >
                        {child}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
