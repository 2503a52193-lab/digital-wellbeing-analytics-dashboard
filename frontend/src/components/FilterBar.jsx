import React from 'react';
import { Filter, RotateCcw, Users, Smartphone, Clock, Calendar } from 'lucide-react';

export default function FilterBar({ 
  filterOptions, 
  filters, 
  setFilters, 
  onReset 
}) {
  const ageMinBound = filterOptions?.age?.min ?? 13;
  const ageMaxBound = filterOptions?.age?.max ?? 19;
  const smMinBound = filterOptions?.social_media_hours?.min ?? 1.0;
  const smMaxBound = filterOptions?.social_media_hours?.max ?? 8.0;

  const genderOptions = filterOptions?.gender?.options || ['all', 'male', 'female'];
  const platformOptions = filterOptions?.platform?.options || ['all', 'Instagram', 'TikTok', 'Both'];

  const hasGender = filterOptions?.capabilities?.gender !== false && genderOptions.length > 1;
  const hasPlatform = filterOptions?.capabilities?.platform_usage !== false && platformOptions.length > 1;
  const hasAge = filterOptions?.capabilities?.age !== false;
  const hasSm = filterOptions?.capabilities?.daily_social_media_hours !== false;

  const handleGenderChange = (gender) => {
    setFilters(prev => ({ ...prev, gender }));
  };

  const handlePlatformChange = (platform) => {
    setFilters(prev => ({ ...prev, platform }));
  };

  const handleAgeMinChange = (e) => {
    const val = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      age_min: Math.min(val, prev.age_max || ageMaxBound)
    }));
  };

  const handleAgeMaxChange = (e) => {
    const val = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      age_max: Math.max(val, prev.age_min || ageMinBound)
    }));
  };

  const handleSmMaxChange = (e) => {
    const val = parseFloat(e.target.value);
    setFilters(prev => ({
      ...prev,
      social_media_max: val
    }));
  };

  const isFiltered = (
    (hasGender && filters.gender && filters.gender !== 'all') ||
    (hasPlatform && filters.platform && filters.platform !== 'all') ||
    (hasAge && filters.age_min && filters.age_min > ageMinBound) ||
    (hasAge && filters.age_max && filters.age_max < ageMaxBound) ||
    (hasSm && filters.social_media_max && filters.social_media_max < smMaxBound)
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Filter className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Interactive Population Filters
          </h3>
          <span className="text-xs text-slate-400">
            (Instant recalculation across all visualizations)
          </span>
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gender Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Gender
          </label>
          {hasGender ? (
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
              {genderOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderChange(g)}
                  className={`flex-1 min-w-[60px] py-1.5 text-xs font-medium rounded-lg capitalize transition-all text-center ${
                    (filters.gender || 'all') === g
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
              Not available in active dataset
            </div>
          )}
        </div>

        {/* Platform Filter */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
            Primary Platform
          </label>
          {hasPlatform ? (
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
              {platformOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePlatformChange(p)}
                  className={`flex-1 min-w-[50px] py-1.5 text-xs font-medium rounded-lg transition-all truncate px-1 text-center ${
                    (filters.platform || 'all') === p
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={p}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
              Not available in active dataset
            </div>
          )}
        </div>

        {/* Age Range Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              Age Span
            </label>
            <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {hasAge ? `${filters.age_min || ageMinBound} – ${filters.age_max || ageMaxBound} yrs` : 'N/A'}
            </span>
          </div>
          {hasAge ? (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={ageMinBound}
                max={ageMaxBound}
                step="1"
                value={filters.age_min || ageMinBound}
                onChange={handleAgeMinChange}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="range"
                min={ageMinBound}
                max={ageMaxBound}
                step="1"
                value={filters.age_max || ageMaxBound}
                onChange={handleAgeMaxChange}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
              Not available in active dataset
            </div>
          )}
        </div>

        {/* Social Media Usage Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Max Social Media
            </label>
            <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {hasSm ? `≤ ${filters.social_media_max !== undefined ? filters.social_media_max : smMaxBound} hrs/day` : 'N/A'}
            </span>
          </div>
          {hasSm ? (
            <>
              <input
                type="range"
                min={smMinBound}
                max={smMaxBound}
                step="0.5"
                value={filters.social_media_max !== undefined ? filters.social_media_max : smMaxBound}
                onChange={handleSmMaxChange}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{smMinBound}h</span>
                <span>{((smMinBound + smMaxBound) / 2).toFixed(1)}h (Mid)</span>
                <span>{smMaxBound}h</span>
              </div>
            </>
          ) : (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
              Not available in active dataset
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

