import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function TechnicalStatsCard({ title, value, unit, icon: Icon, trend = '', status = 'consistent', info }) {
  const statusConfig = {
    optimal: { iconColor: 'text-[var(--brand-primary)]', bgColor: 'bg-[var(--brand-primary-light)]' },
    normal: { iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    on_track: { iconColor: 'text-[var(--brand-primary)]', bgColor: 'bg-[var(--brand-primary-light)]' },
    consistent: { iconColor: 'text-gray-600', bgColor: 'bg-gray-100' },
    stable: { iconColor: 'text-gray-600', bgColor: 'bg-gray-100' }
  };

  const trendConfig = {
    positive: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-[var(--brand-primary)]' },
    negative: { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600' },
    neutral: { icon: <Minus className="w-4 h-4" />, color: 'text-gray-500' }
  };

  const currentStatus = statusConfig[status] || statusConfig.consistent;
  const currentTrend = trend && trend.includes('+') ? trendConfig.positive : trend && trend.includes('-') ? trendConfig.negative : trendConfig.neutral;

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl hover:shadow-2xl transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
            {info && (
              <Popover>
                <PopoverTrigger>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-xs p-2 bg-gray-800 text-white border-gray-700 text-sm">
                  <p>{info}</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold ${currentTrend.color}`}>
              {currentTrend.icon}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-4 mt-2">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStatus.bgColor}`}>
             <Icon className={`w-5 h-5 ${currentStatus.iconColor}`} />
           </div>
           <div>
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500 font-medium ml-1">{unit}</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}