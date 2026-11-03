import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  HeartPulse, 
  Activity, 
  Smile, 
  Frown, 
  ShieldAlert, 
  Moon, 
  Dumbbell, 
  Users 
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchWellbeing } from '../services/api';

const SOCIAL_COLORS = ['#f43f5e', '#3b82f6', '#10b981'];

export default function WellBeingPage({ filters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWellbeing(filters);
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

  if (loading) return <LoadingSpinner message="Evaluating digital well-being markers..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;
  if (!data) return null;

  const depScreening = data.depression_screening || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <HeartPulse className="w-4 h-4" />
          <span>Module 4 • Mental & Physical Well-being</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Digital Well-being Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Examining self-reported stress, anxiety, addiction scales, physical exercise habits, and nocturnal sleep patterns.
        </p>
      </div>

      {/* Grid: Stress Distribution & Anxiety Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Stress Level Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perceived Stress Distribution</h3>
              <p className="text-xs text-slate-500">Student self-ratings on a 1 (lowest) to 10 (highest) scale</p>
            </div>
            <Frown className="w-4 h-4 text-amber-500" />
          </div>

          {data.stress_available !== false && (data.stress_distribution || []).length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stress_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Stress Rating (1-10)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} students (${item.payload.percentage}%)`, 'Count']}
                    labelFormatter={(lvl) => `Stress Level: ${lvl}`}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Frown className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-medium">Perceived stress level variable is not present in this dataset.</p>
            </div>
          )}
        </div>

        {/* 2. Anxiety Level Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perceived Anxiety Distribution</h3>
              <p className="text-xs text-slate-500">Student self-ratings on a 1 (lowest) to 10 (highest) scale</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>

          {data.anxiety_available !== false && (data.anxiety_distribution || []).length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.anxiety_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Anxiety Rating (1-10)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} students (${item.payload.percentage}%)`, 'Count']}
                    labelFormatter={(lvl) => `Anxiety Level: ${lvl}`}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <ShieldAlert className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-medium">Perceived anxiety level variable is not present in this dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Sleep Patterns vs Screen Time & Physical Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Sleep Patterns vs Pre-Bed Screen Time */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sleep Hygiene vs Pre-Bed Screen Exposure</h3>
              <p className="text-xs text-slate-500">Average sleep duration across bedtime screen brackets</p>
            </div>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>

          {data.sleep_screen_available !== false && (data.sleep_screen_relation || []).length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sleep_screen_relation || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="screen_bracket" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[5.0, 7.5]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val, name) => [
                        val !== null && val !== undefined ? val : 'Not available',
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="avg_sleep_hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="Avg Sleep Hours" />
                    <Line type="monotone" dataKey="avg_stress" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Avg Stress (1-10)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Elevated pre-sleep screen exposure correlates with a subtle dip in sleep duration and higher perceived stress.
              </p>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Moon className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-medium">Screen time before sleep or sleep duration variable is not present.</p>
            </div>
          )}
        </div>

        {/* 4. Physical Activity by Gender */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Physical Activity Comparisons</h3>
              <p className="text-xs text-slate-500">Daily exercise hours & emotional indicators grouped by gender</p>
            </div>
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>

          {data.pa_available !== false && (data.physical_activity_gender || []).length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.physical_activity_gender || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="gender" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 6]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name) => [
                      val !== null && val !== undefined ? val : 'Not available',
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="avg_physical_activity" fill="#10b981" radius={[6, 6, 0, 0]} name="Exercise (hrs/day)" />
                  <Bar dataKey="avg_stress" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Stress (1-10)" />
                  <Bar dataKey="avg_anxiety" fill="#ef4444" radius={[6, 6, 0, 0]} name="Anxiety (1-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Dumbbell className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-medium">Physical activity variable is not present in this dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Additional Indicators (Addiction Scale, Social Interaction, Depression Marker Context) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Addiction Level */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Device Addiction Scale</h3>
          <p className="text-xs text-slate-500 mb-4">Self-reported rating (1 = mild, 10 = severe)</p>
          {data.addiction_available !== false && (data.addiction_distribution || []).length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.addiction_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="level" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} students (${item.payload.percentage}%)`, 'Count']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <HeartPulse className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs font-medium">Device addiction scale is not present in this dataset.</p>
            </div>
          )}
        </div>

        {/* In-Person Social Interaction */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">In-Person Social Interaction</h3>
          <p className="text-xs text-slate-500 mb-4">Self-reported peer engagement levels</p>
          {data.social_available !== false && (data.social_interaction || []).length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.social_interaction || []}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={({ level, percentage }) => `${level} (${percentage}%)`}
                    labelLine={false}
                  >
                    {(data.social_interaction || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SOCIAL_COLORS[index % SOCIAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [
                      val !== null && val !== undefined ? val : 'Not available',
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Users className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs font-medium">Social interaction metric is not present in this dataset.</p>
            </div>
          )}
        </div>

        {/* Ethical Aggregate Health Notice */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Ethical Analytical Context</span>
            </div>
            {depScreening.available !== false ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                Survey response screening marker prevalence: 
                <strong className="text-slate-900 block mt-1 font-mono text-sm">
                  {depScreening.flagged_count || 0} flagged responses ({depScreening.rate_percent !== null && depScreening.rate_percent !== undefined ? `${depScreening.rate_percent}%` : 'Not available'})
                </strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Depression screening marker column is not present in this dataset.
              </p>
            )}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              {depScreening.ethical_note || "This binary indicator reflects aggregate statistical screening markers from survey responses and does not represent clinical medical diagnosis."}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
            Adheres to academic standards: strictly non-diagnostic cohort analytics.
          </div>
        </div>
      </div>
    </div>
  );
}

