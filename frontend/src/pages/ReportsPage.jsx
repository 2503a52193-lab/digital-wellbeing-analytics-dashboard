import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  ShieldCheck, 
  FileSpreadsheet,
  Building,
  Calendar,
  Layers
} from 'lucide-react';
import { fetchSummaryReport, downloadAggregateCsv } from '../services/api';

export default function ReportsPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSummaryReport(filters);
      setReport(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleDownloadCsv = () => {
    setDownloading(true);
    try {
      downloadAggregateCsv(filters);
    } catch (err) {
      alert("Failed to download CSV: " + err.message);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner message="Generating executive project report..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!report) return null;

  const kpis = report.summary_kpis || {};
  const project = report.project_info || {};
  const insights = report.insights || {};
  const synthesis = insights.research_synthesis || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Module 6 • Report Generation & Anonymized Export</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Summary Analytics & CSV Export</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download cohort summary data tables and print formatted executive analytical summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Preparing CSV...' : 'Download Aggregate CSV'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div className="text-xs">
          <span className="font-bold text-emerald-950 uppercase tracking-wide">
            Student Privacy & Anonymization Protection
          </span>
          <p className="mt-0.5 text-emerald-800 leading-relaxed">
            All reports and CSV exports contain aggregated cohort groupings (stratified by age, gender, and platform). 
            No personally identifiable student records (PIR/PII) or individual microdata are exposed.
          </p>
        </div>
      </div>

      {/* Formal Printable Executive Report Document */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-indigo-700 uppercase tracking-wider">
              University Semester Project Report
            </span>
            <span className="font-mono">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Project {project.project_no || 48}: {project.title || 'Digital Well-being Analytics Dashboard'}
          </h1>
          <div className="mt-2 text-sm text-slate-600 font-medium">
            <strong>Research Inquiry:</strong> "{project.research_question}"
          </div>
        </div>

        {/* Section 1: Cohort Overview & KPI Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-indigo-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            1. Current Cohort Summary Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Cohort Size</span>
              <span className="text-xl font-bold text-slate-900 font-mono">{kpis.total_records}</span>
              <span className="text-[10px] text-slate-400 block">students analyzed</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Avg Social Media</span>
              <span className="text-xl font-bold text-indigo-600 font-mono">
                {kpis.avg_social_media_hours !== null && kpis.avg_social_media_hours !== undefined ? kpis.avg_social_media_hours : 'Not available'}
              </span>
              <span className="text-[10px] text-slate-400 block">{kpis.avg_social_media_hours !== null ? 'hours / day' : ''}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Avg Nightly Sleep</span>
              <span className="text-xl font-bold text-emerald-600 font-mono">
                {kpis.avg_sleep_hours !== null && kpis.avg_sleep_hours !== undefined ? kpis.avg_sleep_hours : 'Not available'}
              </span>
              <span className="text-[10px] text-slate-400 block">{kpis.avg_sleep_hours !== null ? 'hours / night' : ''}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Avg Academic Score</span>
              <span className="text-xl font-bold text-amber-600 font-mono">
                {kpis.avg_academic_performance !== null && kpis.avg_academic_performance !== undefined ? kpis.avg_academic_performance : 'Not available'}
              </span>
              <span className="text-[10px] text-slate-400 block">{kpis.avg_academic_performance !== null ? '4.00 GPA scale' : ''}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Research Findings */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-indigo-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            2. Empirical Findings & Research Question Conclusion
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p>
              <strong>Central Research Verdict:</strong> {synthesis.primary_verdict}
            </p>
            <p>
              <strong>Statistical Synthesis:</strong> Across the 1,200 sampled students, the Pearson correlation between daily social media hours and academic GPA is <code>r ≈ +0.013</code>, while pre-sleep screen exposure correlates with GPA at <code>r ≈ -0.035</code>. Both metrics fall within the negligible range (|r| &lt; 0.05), failing to support the hypothesis that screen time in isolation predicts or degrades academic achievement.
            </p>
            <p>
              <strong>Methodological Caveats:</strong> The questionnaire does not incorporate dedicated <em>study hours</em> or homework completion indices. Moreover, survey respondents' self-reports are subject to recall estimation variance.
            </p>
          </div>
        </div>

        {/* Section 3: Aggregate Export Preview */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-indigo-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            3. Exportable Aggregate Stratifications
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            The CSV export compiles mean metrics grouped across demographic subgroups:
          </p>
          <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto">
            <code>
              age, gender, platform_usage, student_count, avg_daily_social_media_hours, avg_sleep_hours, avg_screen_time_before_sleep, avg_academic_performance_gpa, avg_physical_activity_hours, avg_stress_level, avg_anxiety_level
            </code>
          </div>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <span>Digital Well-being Analytics System • Project 48</span>
          <span>Verified Dataset: Teen_Mental_Health_Dataset.csv(6).xlsx</span>
        </div>
      </div>
    </div>
  );
}
