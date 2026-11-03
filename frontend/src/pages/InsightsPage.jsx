import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  Lightbulb, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Table, 
  FileSearch,
  Scale,
  Sparkles
} from 'lucide-react';
import { fetchInsights } from '../services/api';

export default function InsightsPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInsights(filters);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  if (loading) return <LoadingSpinner message="Synthesizing empirical statistical insights..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!data) return null;

  const synthesis = data.research_synthesis || {};
  const stats = data.descriptive_stats || [];
  const gpaCorrs = data.academic_correlations || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Lightbulb className="w-4 h-4" />
          <span>Module 5 • Statistical Synthesis & Methodology</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Data Insights & Statistical Synthesis</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Empirical evaluation of the central research question, Pearson correlation coefficients, limitations, and ethical boundaries.
        </p>
      </div>

      {/* Main Research Question Finding Banner */}
      <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200/90 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Research Question Investigation
            </span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-1">
              "{synthesis.question}"
            </h3>
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed">
              <strong className="text-indigo-900 font-semibold block mb-1">
                Empirical Research Verdict:
              </strong>
              {synthesis.primary_verdict}
            </div>
          </div>
        </div>

        {/* Statistical Evidence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {(synthesis.statistical_evidence || []).map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 truncate">{item.factor}</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  item.pearson_r === null || item.pearson_r === undefined
                    ? 'bg-slate-100 text-slate-500'
                    : Math.abs(item.pearson_r) < 0.05 
                      ? 'bg-slate-200 text-slate-800' 
                      : item.pearson_r < 0 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.pearson_r !== null && item.pearson_r !== undefined 
                    ? `r = ${item.pearson_r > 0 ? `+${item.pearson_r}` : item.pearson_r}` 
                    : 'Not available'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Correlation vs Causation & Limitations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation vs Causation Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span>Correlation vs. Causation Principle</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {synthesis.correlation_vs_causation}
          </p>
          <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>Key DAV Takeaway:</strong> A near-zero correlation ($r \approx 0.013$) indicates that screen time alone cannot be used as an independent predictor of GPA without controlling for latent variables like independent study habits, attention span, and socio-economic support.
          </div>
        </div>

        {/* Dataset Limitations Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-3">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Dataset Limitations & Missing Information</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {(synthesis.dataset_limitations || []).map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Descriptive Statistics Table (Calculated using Pandas) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pandas Descriptive Statistics Table</h3>
            <p className="text-xs text-slate-500">Exhaustive univariate parametric metrics across all numerical columns</p>
          </div>
          <Table className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Feature Variable</th>
                <th className="py-2.5 px-3">Count</th>
                <th className="py-2.5 px-3">Mean</th>
                <th className="py-2.5 px-3">Std Dev</th>
                <th className="py-2.5 px-3">Min</th>
                <th className="py-2.5 px-3">25% (Q1)</th>
                <th className="py-2.5 px-3">Median (50%)</th>
                <th className="py-2.5 px-3">75% (Q3)</th>
                <th className="py-2.5 px-3">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {stats.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">{row.feature}</td>
                  <td className="py-2 px-3 text-slate-600">{row.count}</td>
                  <td className="py-2 px-3 text-indigo-700 font-semibold">{row.mean !== null ? row.mean : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.std !== null ? row.std : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.min !== null ? row.min : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.q25 !== null ? row.q25 : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-900 font-semibold">{row.median !== null ? row.median : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.q75 !== null ? row.q75 : 'Not available'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.max !== null ? row.max : 'Not available'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ethical Statement */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span><strong>Academic Ethics Compliance:</strong> {synthesis.ethical_guidelines}</span>
        <span className="text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          Non-Diagnostic Population Analytics
        </span>
      </div>
    </div>
  );
}

