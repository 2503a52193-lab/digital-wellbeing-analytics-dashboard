import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  Users, 
  Smartphone, 
  Moon, 
  GraduationCap, 
  Tv, 
  Sparkles, 
  Info,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { fetchOverview, fetchSocialMedia, fetchAcademic } from '../services/api';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

const formatValue = (val, decimals = 2) => {
  if (val === null || val === undefined || Number.isNaN(val)) return 'Not available';
  return Number(val).toFixed(decimals);
};

export default function OverviewPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [smData, setSmData] = useState(null);
  const [academicData, setAcademicData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpis, sm, ac] = await Promise.all([
        fetchOverview(filters),
        fetchSocialMedia(filters),
        fetchAcademic(filters)
      ]);
      setKpiData(kpis);
      setSmData(sm);
      setAcademicData(ac);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  if (loading) return <LoadingSpinner message="Loading dataset overview..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!kpiData) return null;

  const descriptions = kpiData.descriptions || {};
  const academicScale = kpiData.academic_scale || { name: '4.00 GPA Scale', label: '/ 4.00', max: 4.0 };
  const hasStudyHours = kpiData.avg_study_hours !== null && kpiData.avg_study_hours !== undefined;
  const hasPlatform = smData?.platform_available !== false && (smData?.platform_comparison || []).length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Research Question Callout Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              University Semester Research Investigation
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Does screen time influence students' academic performance?
            </h2>
            <p className="text-indigo-200/90 text-xs md:text-sm mt-1.5 leading-relaxed">
              Analyzing empirical records from {kpiData.total_possible?.toLocaleString() || '1,200'} students in <em>{kpiData.dataset_name || 'Original Sample Dataset'}</em> to uncover relationships 
              between daily social media usage, pre-sleep screen exposure, sleep hygiene, and academic achievement.
            </p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-right flex-shrink-0">
            <span className="text-[11px] text-indigo-200 block uppercase font-mono">Active Dataset</span>
            <span className="text-base font-bold text-white font-mono truncate max-w-[180px] block">
              {kpiData.dataset_name || 'Original Sample'}
            </span>
            <span className="text-[11px] text-emerald-300 block">{kpiData.total_possible?.toLocaleString()} Total Records</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Core Dashboard Indicators</h3>
            <p className="text-xs text-slate-500">Summary statistics calculated from current filtered cohort</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Cohort: {kpiData.total_records.toLocaleString()} / {kpiData.total_possible.toLocaleString()} ({kpiData.percentage_of_total}%)
          </span>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${hasStudyHours ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
          {/* 1. Total Student Records */}
          <MetricCard
            title="Total Students"
            value={kpiData.total_records.toLocaleString()}
            unit="records"
            icon={Users}
            color="indigo"
            subtitle={`${kpiData.percentage_of_total}% of active cohort`}
            description={descriptions.total_records}
            badge="Sample"
          />

          {/* 2. Avg Daily Social Media Hours */}
          <MetricCard
            title="Daily Social Media"
            value={formatValue(kpiData.avg_social_media_hours)}
            unit="hrs/day"
            icon={Smartphone}
            color="violet"
            subtitle="Screen & social usage"
            description={descriptions.avg_social_media_hours}
            badge="Activity"
          />

          {/* 3. Avg Sleep Hours */}
          <MetricCard
            title="Nightly Sleep"
            value={formatValue(kpiData.avg_sleep_hours)}
            unit="hrs/night"
            icon={Moon}
            color="emerald"
            subtitle="Recommended: 7-9 hrs"
            description={descriptions.avg_sleep_hours}
            badge="Rest"
          />

          {/* 4. Avg Academic Performance Score */}
          <MetricCard
            title="Academic Score"
            value={formatValue(kpiData.avg_academic_performance)}
            unit={academicScale.label || '/ 4.00'}
            icon={GraduationCap}
            color="amber"
            subtitle={academicScale.name || 'Standard GPA scale'}
            description={descriptions.avg_academic_performance}
            badge="Score"
          />

          {/* 5. Avg Screen Time Before Sleep */}
          <MetricCard
            title="Screen Pre-Bed"
            value={formatValue(kpiData.avg_screen_time_before_sleep)}
            unit="hrs"
            icon={Tv}
            color="sky"
            subtitle="Prior to nocturnal sleep"
            description={descriptions.avg_screen_time_before_sleep}
            badge="Nocturnal"
          />

          {/* 6. Avg Study Hours (Dynamic if available) */}
          {hasStudyHours && (
            <MetricCard
              title="Daily Study Hours"
              value={formatValue(kpiData.avg_study_hours)}
              unit="hrs/day"
              icon={BookOpen}
              color="teal"
              subtitle="Dedicated study time"
              description={descriptions.avg_study_hours}
              badge="Prep"
            />
          )}
        </div>
      </div>

      {/* Visual Previews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Share Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Platform Usage Distribution</h4>
              <p className="text-xs text-slate-500">Breakdown of student cohort by social platform</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>

          {hasPlatform ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={smData?.platform_comparison || []}
                      dataKey="count"
                      nameKey="platform_usage"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                      label={({ platform_usage, percentage }) => `${platform_usage} (${percentage}%)`}
                      labelLine={false}
                    >
                      {(smData?.platform_comparison || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, item) => [
                        `${value} students (${item.payload.percentage}%)`,
                        `Platform: ${name}`
                      ]}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 text-center">
                {(smData?.platform_comparison || []).map((item) => (
                  <div key={item.platform_usage} className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[11px] font-semibold text-slate-600 block">{item.platform_usage}</span>
                    <span className="text-sm font-bold font-mono text-slate-800">
                      {item.avg_hours !== null && item.avg_hours !== undefined ? `${item.avg_hours}h` : 'Not available'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">avg screen time</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <PieIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Platform usage variable is not present in this dataset.</p>
            </div>
          )}
        </div>

        {/* GPA Academic Performance Tiers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Academic Performance Tiers</h4>
              <p className="text-xs text-slate-500">Student count distribution across performance brackets</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={academicData?.score_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="bracket" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  tickFormatter={(val) => val.split(' ')[0]}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value, name, item) => [`${value} students (${item.payload.percentage}%)`, 'Students']}
                  labelFormatter={(label) => `Performance Bracket: ${label}`}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Overall Cohort Average: <strong className="text-slate-800">{kpiData.avg_academic_performance !== null && kpiData.avg_academic_performance !== undefined ? `${kpiData.avg_academic_performance} ${academicScale.label}` : 'Not available'}</strong></span>
            <span className="text-indigo-600 font-medium">{academicScale.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

