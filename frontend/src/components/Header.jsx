import React from 'react';
import { Database, Sparkles, Filter, RefreshCw, UploadCloud, Layers } from 'lucide-react';

export default function Header({ 
  totalRecords = 0, 
  filteredRecords = 0, 
  onResetFilters,
  isFiltered = false,
  datasetsList = [],
  activeDatasetId = 'original',
  onSwitchDataset,
  onOpenUpload,
  academicScale
}) {
  const hasUploaded = datasetsList.some(d => d.id === 'uploaded');
  const activeDataset = datasetsList.find(d => d.id === activeDatasetId) || datasetsList[0];

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm sticky top-0 z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              DAV Universal Analytics Platform
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Student Performance & Well-being</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Interactive Well-being Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical investigation of digital habits, sleep patterns, study hours, and academic achievement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dataset Switcher Pill */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => onSwitchDataset('original')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeDatasetId === 'original'
                  ? 'bg-white text-indigo-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Use original 1,200-student sample dataset"
            >
              Original Sample (1.2k)
            </button>

            {hasUploaded ? (
              <button
                onClick={() => onSwitchDataset('uploaded')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeDatasetId === 'uploaded'
                    ? 'bg-white text-emerald-700 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to teacher uploaded dataset"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Uploaded Dataset
              </button>
            ) : (
              <button
                onClick={onOpenUpload}
                className="px-2.5 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium transition-all flex items-center gap-1"
                title="Upload a new student dataset"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>+ Upload</span>
              </button>
            )}
          </div>

          {/* Academic Scoring Scale Badge */}
          {academicScale && (
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs text-indigo-800 flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{academicScale.name || '4.00 GPA'}</span>
            </div>
          )}

          {/* Active sample badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Database className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-medium">Filtered Cohort</span>
              <span className="font-bold text-slate-800 font-mono text-xs">
                {filteredRecords.toLocaleString()}
              </span>
              <span className="text-slate-400 text-[10px] ml-1">/ {totalRecords.toLocaleString()}</span>
            </div>
          </div>

          {/* Reset Filter Button if active */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-sm"
              title="Reset all filters to full dataset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
