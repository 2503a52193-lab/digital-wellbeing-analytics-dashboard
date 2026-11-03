import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  GraduationCap, 
  Moon, 
  AlertTriangle, 
  Info, 
  BarChart3, 
  ScatterChart as ScatterIcon,
  BookOpen,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line
} from 'recharts';
import { fetchAcademic } from '../services/api';

export default function AcademicPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAcademic(filters);
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

  if (loading) return <LoadingSpinner message="Calculating academic achievement correlations..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!data) return null;

  const studyHoursInfo = data.study_hours_info || {};
  const academicScale = data.academic_scale || { name: '4.00 GPA Scale', label: '/ 4.00 GPA', max: 4.0 };
  const scaleLabel = academicScale.label || '/ 4.00';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>Module 3 • Academic Achievement</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Academic Performance Analytics</h2>
          <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
            Scale: {academicScale.name} ({scaleLabel})
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluating academic scores, score distributions, and relationships with study hours, sleep habits, and digital consumption.
        </p>
      </div>

      {/* Study Hours Notice / Banner */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
        studyHoursInfo.exists 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}>
        {studyHoursInfo.exists ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-xs">
          <span className="font-bold uppercase tracking-wide">
            {studyHoursInfo.exists ? "Active Variable: Study Hours Detected" : "Dataset Variable Notice: Study Hours Status"}
          </span>
          <p className="mt-1 leading-relaxed">
            {studyHoursInfo.note}
          </p>
        </div>
      </div>

      {/* Grid: Academic Score Distribution & Sleep Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Academic Performance Score Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Score Distribution</h3>
              <p className="text-xs text-slate-500">Student count across performance tiers on {academicScale.name}</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.score_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="bracket" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  tickFormatter={(val) => val.split(' ')[0]}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val, name, item) => [`${val} students (${item.payload.percentage}%)`, 'Count']}
                  labelFormatter={(lbl) => `Bracket: ${lbl}`}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Calibrated for {academicScale.name} ({scaleLabel}).
          </p>
        </div>

        {/* 2. GPA vs Sleep Duration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Score vs Sleep Duration</h3>
              <p className="text-xs text-slate-500">Average score across sleep duration tiers (4 to 9 hours nightly)</p>
            </div>
            <Moon className="w-4 h-4 text-slate-400" />
          </div>

          {data.sleep_available ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gpa_by_sleep_duration || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sleep_bracket" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [
                      val !== null && val !== undefined ? `${val} ${scaleLabel} (${item.payload.count} students)` : `Not available (${item.payload.count} students)`, 
                      'Average Score'
                    ]}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_gpa" fill="#10b981" radius={[6, 6, 0, 0]} name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Moon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Sleep duration is not included in the active dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* Conditionally Render Study Hours Analytics if Study Hours Exist */}
      {studyHoursInfo.exists && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100">
          {/* Study Hours Tiers */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Academic Score vs Independent Study Hours
                </h4>
                <p className="text-xs text-slate-500">Average academic performance by daily study brackets</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gpa_by_study_hours || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="study_bracket" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [
                      val !== null && val !== undefined ? `${val} ${scaleLabel} (${item.payload.count} students)` : `Not available (${item.payload.count} students)`,
                      'Average Score'
                    ]}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_gpa" fill="#6366f1" radius={[6, 6, 0, 0]} name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Study Hours Scatter */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ScatterIcon className="w-4 h-4 text-indigo-600" />
                  Study Duration vs Academic Score (Scatter)
                </h4>
                <p className="text-xs text-slate-500">Individual student data points of study hours vs performance</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    dataKey="study_hours" 
                    name="Study Hours" 
                    unit="h"
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="academic_performance" 
                    name="Academic Score" 
                    domain={[0, academicScale.max || 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                  />
                  <ZAxis range={[25, 25]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(val, name) => [val, name === 'study_hours' ? 'Study Hours' : 'Academic Score']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Scatter 
                    name="Students" 
                    data={data.study_scatter || []} 
                    fill="#6366f1" 
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Pre-Bed Screen Time & Scatter Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. GPA vs Screen Time Before Sleep */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Score vs Pre-Sleep Screen Time</h3>
              <p className="text-xs text-slate-500">Examining nocturnal digital exposure (0.5 to 3.0 hrs before bed)</p>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          {data.screen_sleep_available ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.gpa_by_screen_before_sleep || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="screen_sleep_bracket" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [
                      val !== null && val !== undefined ? `${val} ${scaleLabel} (${item.payload.count} students)` : `Not available (${item.payload.count} students)`, 
                      'Avg Score'
                    ]}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="avg_gpa" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} name="Average Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <BookOpen className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Pre-bed screen time is not recorded in the active dataset.</p>
            </div>
          )}
        </div>

        {/* 4. Sleep Hours vs GPA Scatter Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sleep Duration vs Academic Score (Scatter)</h3>
              <p className="text-xs text-slate-500">Individual student data points of nightly rest vs academic score</p>
            </div>
            <ScatterIcon className="w-4 h-4 text-slate-400" />
          </div>

          {data.sleep_available ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    dataKey="sleep_hours" 
                    name="Sleep Duration" 
                    unit="h" 
                    domain={[4, 9]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="academic_performance" 
                    name="Academic Score" 
                    domain={[0, academicScale.max || 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <ZAxis range={[25, 25]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name === 'sleep_hours' ? 'Sleep Hours' : 'Academic Score']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Scatter 
                    name="Students" 
                    data={data.sleep_scatter || []} 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <ScatterIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Sleep scatter is not available for this dataset.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
