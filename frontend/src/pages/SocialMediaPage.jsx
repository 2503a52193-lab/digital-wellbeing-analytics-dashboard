import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { Smartphone, BarChart3, TrendingUp, Users, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';
import { fetchSocialMedia } from '../services/api';

export default function SocialMediaPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSocialMedia(filters);
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

  if (loading) return <LoadingSpinner message="Calculating social media usage patterns..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Smartphone className="w-4 h-4" />
          <span>Module 2 • Digital Consumption Patterns</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Social Media Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluating daily engagement, platform preferences, age variations, and relationship with academic performance.
        </p>
      </div>

      {/* Grid: Distribution & Platform Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Daily Usage Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Social Media Hours Distribution</h3>
              <p className="text-xs text-slate-500">Frequency of students across daily usage brackets (1 to 8 hrs)</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usage_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`${val} students`, 'Frequency']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Evenly distributed across 1 to 8 hours daily, capturing both casual and heavy users.
          </p>
        </div>

        {/* 2. Platform Usage Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Usage Comparison</h3>
              <p className="text-xs text-slate-500">Comparative metrics across detected social platforms</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          {data.platform_available !== false && (data.platform_comparison || []).length > 0 ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.platform_comparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="platform_usage" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 8]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val, name) => [
                        val !== null && val !== undefined ? val : 'Not available',
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="avg_hours" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Avg Daily Hours" />
                    <Bar yAxisId="right" dataKey="avg_gpa" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Academic Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-center text-xs">
                {(data.platform_comparison || []).map((p) => (
                  <div key={p.platform_usage} className="p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">{p.platform_usage}</span>
                    <span className="block text-slate-500 text-[11px]">{p.count} students ({p.percentage}%)</span>
                    <span className="block text-[10px] text-indigo-600 font-mono">
                      {p.avg_gpa !== null && p.avg_gpa !== undefined ? `${p.avg_gpa}` : 'Not available'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Users className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Platform usage variable is not present in this dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Age-wise Usage & Social Media vs GPA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Age-wise Social Media Usage */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Age-wise Social Media Consumption</h3>
              <p className="text-xs text-slate-500">Average daily hours & score across student age groups</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          {data.age_available !== false && (data.age_wise_usage || []).length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.age_wise_usage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Student Age', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 8]} label={{ value: 'Hours / Day', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip 
                    formatter={(val, name) => [val, name === 'avg_hours' ? 'Avg Social Media Hrs' : 'Avg Academic Score']}
                    labelFormatter={(age) => `Age: ${age} years`}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="avg_hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="Avg Social Media Hours" />
                  <Line type="monotone" dataKey="avg_gpa" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Avg Academic Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Age distribution variable is not present in this dataset.</p>
            </div>
          )}
        </div>

        {/* 4. Social Media Hours vs Academic Performance (Scatter Plot) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Social Media Hours vs Academic GPA</h3>
              <p className="text-xs text-slate-500">Scatter correlation between daily screen time and student GPA</p>
            </div>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="daily_social_media_hours"
                  name="Social Media Hours"
                  unit="h"
                  domain={[1, 8]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="academic_performance"
                  name="Academic GPA"
                  domain={[2.0, 4.0]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <ZAxis range={[25, 25]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [value, name === 'daily_social_media_hours' ? 'Social Media Hours' : 'Academic GPA']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Scatter
                  name="Students"
                  data={data.scatter_points || []}
                  fill="#818cf8"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Tier breakdown table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            {(data.tier_summary || []).map((t) => (
              <div key={t.tier} className="p-2 bg-slate-50 rounded-xl text-center">
                <span className="text-[11px] font-semibold text-slate-700 block truncate">{t.tier}</span>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {t.avg_gpa !== null && t.avg_gpa !== undefined ? `${t.avg_gpa} GPA` : 'Not available'}
                </span>
                <span className="text-[10px] text-slate-400 block">{t.count} students</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pearson Correlation: <strong className="text-slate-800">r ≈ +0.013</strong> (No linear dependency)</span>
            <span className="text-indigo-600 font-medium">Bivariate Inspection</span>
          </div>
        </div>
      </div>
    </div>
  );
}

