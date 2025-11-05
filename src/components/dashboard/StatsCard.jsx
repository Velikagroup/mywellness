import React from 'react';

export default function StatsCard({ title, value, unit, icon: Icon, gradient }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-2xl font-bold">{value}</span>
            <span className="text-white/60 text-sm">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}