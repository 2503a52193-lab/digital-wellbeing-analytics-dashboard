import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  color = 'indigo',
  subtitle,
  description,
  badge
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50/80',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      badge: 'bg-indigo-100/70 text-indigo-700'
    },
    emerald: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100/70 text-emerald-700'
    },
    amber: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badge: 'bg-amber-100/70 text-amber-700'
    },
    violet: {
      bg: 'bg-violet-50/80',
      text: 'text-violet-600',
      border: 'border-violet-100',
      badge: 'bg-violet-100/70 text-violet-700'
    },
    sky: {
      bg: 'bg-sky-50/80',
      text: 'text-sky-600',
      border: 'border-sky-100',
      badge: 'bg-sky-100/70 text-sky-700'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  const isAvailable = value !== null && value !== undefined && value !== 'Not available' && value !== 'NaN' && !Number.isNaN(value);
  const displayValue = isAvailable ? value : 'Not available';

  return (
    <div className={`bg-white rounded-2xl p-6 border ${scheme.border} shadow-sm hover:shadow-md transition-shadow relative group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>{title}</span>
            {description && (
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-56 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-30 pointer-events-none leading-relaxed">
                  {description}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={isAvailable 
              ? "text-3xl font-extrabold text-slate-900 font-mono tracking-tight" 
              : "text-lg font-semibold text-slate-400 font-sans tracking-normal"
            }>
              {displayValue}
            </span>
            {isAvailable && unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${scheme.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

