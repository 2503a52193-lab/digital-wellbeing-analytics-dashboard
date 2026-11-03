import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Table, 
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { uploadDatasetFile, applyColumnMapping, deleteUploadedDataset, switchActiveDataset } from '../services/api';

const SCALE_PRESETS = [
  { id: '4.0_gpa', name: 'Standard 4.00 GPA Scale', min: 0.0, max: 4.0, unit: 'GPA', label: '/ 4.00 GPA' },
  { id: '10.0_cgpa', name: '10.0 CGPA Scale', min: 0.0, max: 10.0, unit: 'CGPA', label: '/ 10.0 CGPA' },
  { id: '100_percent', name: '100% Marks / Percentage', min: 0.0, max: 100.0, unit: '%', label: '/ 100%' },
  { id: '50_marks', name: '50 Marks Scale', min: 0.0, max: 50.0, unit: 'Marks', label: '/ 50 Marks' },
  { id: 'custom', name: 'Custom Scoring Scale', min: 0.0, max: 100.0, unit: 'Score', label: 'Custom' }
];

export default function UploadPage({ 
  activeDatasetId, 
  datasetsList = [], 
  onDatasetUpdated,
  onNavigateOverview 
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Inspection result from backend
  const [inspection, setInspection] = useState(null);

  // Mapping state: { [canonical_key]: selected_column_name || '' }
  const [mapping, setMapping] = useState({});

  // Academic Scale state
  const [selectedScaleId, setSelectedScaleId] = useState('4.0_gpa');
  const [customScaleMax, setCustomScaleMax] = useState('100');
  const [customScaleMin, setCustomScaleMin] = useState('0');
  const [customScaleUnit, setCustomScaleUnit] = useState('Score');
  const [customDatasetName, setCustomDatasetName] = useState('');

  const [savingMapping, setSavingMapping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasUploaded = datasetsList.some(d => d.id === 'uploaded');

  const handleFileChange = (e) => {
    setError(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validExts = ['.xlsx', '.xls', '.csv'];
      const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        setError(`Invalid file format '${ext}'. Please choose an Excel (.xlsx/.xls) or CSV (.csv) file.`);
        return;
      }
      if (selected.size > 15 * 1024 * 1024) {
        setError("File size exceeds the 15 MB limit. Please upload a smaller dataset.");
        return;
      }
      setFile(selected);
      setCustomDatasetName(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadAndInspect = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await uploadDatasetFile(file);
      setInspection(data);
      // Initialize mappings from suggested
      setMapping(data.suggested_mapping || {});
      // Initialize scale from detected
      if (data.detected_scale && data.detected_scale.type) {
        setSelectedScaleId(data.detected_scale.type);
        if (data.detected_scale.type === 'custom') {
          setCustomScaleMax(String(data.detected_scale.max || 100));
          setCustomScaleMin(String(data.detected_scale.min || 0));
        }
      }
      setSuccessMsg(`File successfully inspected: ${data.total_rows} student records and ${data.columns.length} columns detected.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMappingChange = (canonicalKey, colName) => {
    setMapping(prev => ({
      ...prev,
      [canonicalKey]: colName === '__none__' ? null : colName
    }));
  };

  const handleApplyMapping = async () => {
    if (!inspection) return;
    setError(null);
    setSuccessMsg(null);

    // Validation: academic_performance and daily_social_media_hours are required
    if (!mapping.academic_performance) {
      setError("Please map the 'Academic Performance / GPA' column to continue.");
      return;
    }
    if (!mapping.daily_social_media_hours) {
      setError("Please map the 'Daily Social Media / Screen Time Hours' column to continue.");
      return;
    }

    setSavingMapping(true);
    try {
      let scaleConfig;
      if (selectedScaleId === 'custom') {
        const cMin = parseFloat(customScaleMin) || 0.0;
        const cMax = parseFloat(customScaleMax) || 100.0;
        scaleConfig = {
          type: 'custom',
          name: `Custom Scale (${cMax} Max)`,
          min: cMin,
          max: cMax,
          unit: customScaleUnit || 'Score',
          label: `/ ${cMax} ${customScaleUnit || ''}`.trim()
        };
      } else {
        scaleConfig = SCALE_PRESETS.find(p => p.id === selectedScaleId) || SCALE_PRESETS[0];
      }

      await applyColumnMapping(
        inspection.session_id,
        mapping,
        scaleConfig,
        customDatasetName || inspection.filename
      );

      setSuccessMsg("Dataset successfully configured and activated! All dashboard analytics have been updated.");
      if (onDatasetUpdated) onDatasetUpdated();
      // Redirect to overview after 1.5s
      setTimeout(() => {
        if (onNavigateOverview) onNavigateOverview();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMapping(false);
    }
  };

  const handleDeleteUploaded = async () => {
    if (!confirm("Are you sure you want to delete the uploaded dataset and revert to the sample dataset?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUploadedDataset();
      setInspection(null);
      setFile(null);
      setMapping({});
      setSuccessMsg("Uploaded dataset deleted. Reverted to Original Sample Dataset.");
      if (onDatasetUpdated) onDatasetUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSwitchToOriginal = async () => {
    try {
      await switchActiveDataset('original');
      if (onDatasetUpdated) onDatasetUpdated();
      setSuccessMsg("Switched active dataset to Original Sample Dataset (1,200 records).");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSwitchToUploaded = async () => {
    try {
      await switchActiveDataset('uploaded');
      if (onDatasetUpdated) onDatasetUpdated();
      setSuccessMsg("Switched active dataset to Uploaded Dataset.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <UploadCloud className="w-4 h-4" />
          <span>Universal Dataset Ingestion Engine</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Upload & Analyze Student Datasets</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload custom spreadsheets in Excel (.xlsx, .xls) or CSV (.csv) format. Automatically match column synonyms, calibrate academic scales, and generate real-time analytics.
        </p>
      </div>

      {/* Dataset State Toggle Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block uppercase font-medium">Current Platform Dataset</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-bold text-slate-900">
              {activeDatasetId === 'uploaded' ? 'Uploaded Custom Dataset' : 'Original Sample Dataset (1,200 Records)'}
            </span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold font-mono ${
              activeDatasetId === 'uploaded' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
            }`}>
              {activeDatasetId === 'uploaded' ? 'ACTIVE: UPLOADED' : 'ACTIVE: ORIGINAL'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeDatasetId === 'uploaded' ? (
            <button
              onClick={handleSwitchToOriginal}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Switch to Original Sample
            </button>
          ) : hasUploaded ? (
            <button
              onClick={handleSwitchToUploaded}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors"
            >
              Switch to Uploaded Dataset
            </button>
          ) : null}

          {hasUploaded && (
            <button
              onClick={handleDeleteUploaded}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              title="Delete uploaded dataset from server"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting...' : 'Delete Uploaded Data'}
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step 1: File Upload Dropzone */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="text-sm font-bold text-slate-900">Select Dataset File</h3>
          </div>
          <span className="text-xs text-slate-400">Supported: .xlsx, .xls, .csv (Max 15 MB)</span>
        </div>

        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
          <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">
            {file ? file.name : "Drag & drop your student dataset spreadsheet here"}
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports varied column formats, custom GPA scales, or percentage marks"}
          </p>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-colors">
            <span>Browse Files</span>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Ready for schema inspection: <strong>{file.name}</strong></span>
            </div>
            <button
              onClick={handleUploadAndInspect}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Inspecting Spreadsheet...</span>
                </>
              ) : (
                <>
                  <span>Inspect Columns & Structure</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Step 2 & 3: Inspection, Scale Selection & Column Mapping */}
      {inspection && (
        <div className="space-y-6">
          {/* Inspection Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-bold text-slate-900">Configure Dataset & Academic Scale</h3>
              </div>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold">
                {inspection.total_rows.toLocaleString()} Records Detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dataset Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dataset Display Title
                </label>
                <input
                  type="text"
                  value={customDatasetName}
                  onChange={(e) => setCustomDatasetName(e.target.value)}
                  placeholder="e.g., Grade 10 Spring Cohort"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Academic Scoring System */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Academic Scoring System</span>
                  <span className="text-[10px] text-indigo-600">
                    Auto-detected: {inspection.detected_scale?.name}
                  </span>
                </label>
                <select
                  value={selectedScaleId}
                  onChange={(e) => setSelectedScaleId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium bg-white"
                >
                  {SCALE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.label})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Scale Inputs if selected */}
            {selectedScaleId === 'custom' && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Minimum Score</label>
                  <input
                    type="number"
                    value={customScaleMin}
                    onChange={(e) => setCustomScaleMin(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Maximum Score</label>
                  <input
                    type="number"
                    value={customScaleMax}
                    onChange={(e) => setCustomScaleMax(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Unit / Suffix</label>
                  <input
                    type="text"
                    value={customScaleUnit}
                    onChange={(e) => setCustomScaleUnit(e.target.value)}
                    placeholder="e.g. Points, /100"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column Mapping Matrix */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="text-sm font-bold text-slate-900">Review & Correct Column Mappings</h3>
              </div>
              <span className="text-xs text-slate-500">
                Synonyms matched automatically. Verify or adjust mapping below.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Target Analytics Variable</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Uploaded Spreadsheet Column</th>
                    <th className="py-2.5 px-3">Role / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(inspection.canonical_definitions || {}).map(([key, def]) => {
                    const selectedCol = mapping[key] || '';
                    const isMatched = Boolean(selectedCol);
                    return (
                      <tr key={key} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{def.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{key}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Matched
                            </span>
                          ) : def.required ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Required
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={selectedCol || '__none__'}
                            onChange={(e) => handleMappingChange(key, e.target.value)}
                            className={`w-full max-w-xs px-2.5 py-1.5 text-xs rounded-lg border font-medium ${
                              isMatched 
                                ? 'border-emerald-300 bg-white text-slate-800' 
                                : def.required 
                                  ? 'border-rose-300 bg-rose-50/30 text-rose-900' 
                                  : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            <option value="__none__">— Not present in file —</option>
                            {(inspection.columns || []).map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] leading-relaxed">
                          {def.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Step 4: Raw 5-Row Data Preview */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" />
                Raw Data Preview (First 5 Rows from Upload)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      {(inspection.columns || []).map((c) => (
                        <th key={c} className="py-1.5 px-2.5 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(inspection.sample_preview || []).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {(inspection.columns || []).map((c) => (
                          <td key={c} className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                            {row[c] !== null && row[c] !== undefined ? String(row[c]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Data is isolated to your local session and never transmitted to external services.
              </span>
              <button
                onClick={handleApplyMapping}
                disabled={savingMapping}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {savingMapping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Analytics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Mapping & Launch Analytics</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice Card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-600 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <div>
          <strong className="text-slate-800 block">Confidentiality & Session Protection:</strong>
          Student records uploaded here are processed strictly in-memory and in temporary local workspace storage. Data is never sent to external AI APIs or third-party cloud servers.
        </div>
      </div>
    </div>
  );
}

