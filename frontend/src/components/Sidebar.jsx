import React from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  GraduationCap, 
  HeartPulse, 
  Lightbulb, 
  FileText,
  UploadCloud,
  Sparkles,
  BookOpen,
  Database
} from 'lucide-react';

const analyticsItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, subtitle: 'Key metrics & summary' },
  { id: 'social_media', label: 'Digital Habits', icon: Smartphone, subtitle: 'Social media & platform usage' },
  { id: 'academic', label: 'Academic Analytics', icon: GraduationCap, subtitle: 'GPA, sleep & study hours' },
  { id: 'wellbeing', label: 'Digital Well-being', icon: HeartPulse, subtitle: 'Stress, anxiety & sleep patterns' },
  { id: 'insights', label: 'Data Insights', icon: Lightbulb, subtitle: 'Correlations & research synthesis' },
  { id: 'reports', label: 'Reports & Export', icon: FileText, subtitle: 'Summary report & CSV download' },
];

export default function Sidebar({ activeTab, setActiveTab, activeDatasetInfo }) {
  const isUploaded = activeDatasetInfo?.id === 'uploaded';

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-800 shadow-xl select-none">
      {/* Brand & Project Banner */}
      <div className="p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-850 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <HeartPulse className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                Project 48
              </span>
              <span className="text-[11px] text-slate-400 font-mono">DAV 2026</span>
            </div>
            <h1 className="text-sm font-semibold text-white tracking-tight mt-1">
              Well-being Analytics
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Universal Ingestion Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Dataset Platform
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-medium border border-indigo-400/30'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-slate-750/50 bg-slate-850/40'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${
              activeTab === 'upload' 
                ? 'bg-white/20 text-white' 
                : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60'
            }`}>
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate flex items-center gap-1.5">
                <span>Upload & Analyze</span>
                {isUploaded && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Custom dataset active" />
                )}
              </div>
              <div className={`text-[11px] truncate ${activeTab === 'upload' ? 'text-indigo-200' : 'text-slate-400'}`}>
                Excel / CSV universal ingestion
              </div>
            </div>
          </button>
        </div>

        {/* Dashboard Analytics Modules */}
        <div className="space-y-1.5">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Analytics Modules
          </div>
          {analyticsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-500/40 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-700/60'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium tracking-tight truncate">{item.label}</div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {item.subtitle}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dataset Info Card */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/60 border border-slate-750/70 text-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Active Dataset</span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
            isUploaded 
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
          }`}>
            {isUploaded ? 'Custom' : 'Original'}
          </span>
        </div>
        <p className="text-white font-medium text-[11px] truncate mt-1">
          {activeDatasetInfo?.name || 'Original Sample Dataset'}
        </p>
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
          <span>{activeDatasetInfo?.records ? `${activeDatasetInfo.records.toLocaleString()} Students` : '1,200 Students'}</span>
          <span className="text-indigo-300 font-mono">
            {activeDatasetInfo?.scale?.name || '4.00 GPA'}
          </span>
        </div>
      </div>
    </aside>
  );
}
