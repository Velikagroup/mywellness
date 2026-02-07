import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, Users, CheckCircle, AlertCircle } from "lucide-react";

export default function QuizFunnelModal({ isOpen, onClose }) {
  const [funnelData, setFunnelData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFunnelData();
    }
  }, [isOpen]);

  const loadFunnelData = async () => {
    setIsLoading(true);
    try {
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);

      // Count users at each step
      const quizStarted = allUsers.filter(u => u.quiz_step_1_completed || u.quiz_completed).length;
      const step1 = allUsers.filter(u => u.quiz_step_1_completed).length;
      const step2 = allUsers.filter(u => u.quiz_step_2_completed).length;
      const step3 = allUsers.filter(u => u.quiz_step_3_completed).length;
      const step4 = allUsers.filter(u => u.quiz_step_4_completed).length;
      const quizCompleted = allUsers.filter(u => u.quiz_completed).length;
      const emailInserted = allUsers.filter(u => u.email && u.quiz_completed).length;
      const trialStarted = allUsers.filter(u => u.subscription_status === 'trial' || u.subscription_status === 'active').length;

      const funnel = [
        { step: 'Quiz Started', count: quizStarted, prev: quizStarted },
        { step: 'Step 1', count: step1, prev: quizStarted },
        { step: 'Step 2', count: step2, prev: step1 },
        { step: 'Step 3', count: step3, prev: step2 },
        { step: 'Step 4', count: step4, prev: step3 },
        { step: 'Quiz Completed', count: quizCompleted, prev: step4 },
        { step: 'Email Inserted', count: emailInserted, prev: quizCompleted },
        { step: 'Trial Started', count: trialStarted, prev: emailInserted }
      ];

      // Calculate percentages and drop rates
      const funnelWithMetrics = funnel.map((item, idx) => {
        const percentage = item.prev > 0 ? ((item.count / item.prev) * 100).toFixed(1) : 0;
        const dropRate = item.prev > 0 ? (((item.prev - item.count) / item.prev) * 100).toFixed(1) : 0;
        return { ...item, percentage, dropRate };
      });

      // Find biggest drop-off
      const biggestDrop = funnelWithMetrics.reduce((max, item) => 
        parseFloat(item.dropRate) > parseFloat(max.dropRate) ? item : max
      , funnelWithMetrics[0]);

      // Calculate conversion metrics
      const quizCompletionRate = quizStarted > 0 ? ((quizCompleted / quizStarted) * 100).toFixed(1) : 0;
      const emailConversionRate = quizCompleted > 0 ? ((emailInserted / quizCompleted) * 100).toFixed(1) : 0;
      const trialConversionRate = emailInserted > 0 ? ((trialStarted / emailInserted) * 100).toFixed(1) : 0;

      setFunnelData({
        funnel: funnelWithMetrics,
        biggestDrop,
        metrics: {
          quizCompletionRate,
          emailConversionRate,
          trialConversionRate
        }
      });

      // Timeline: last 30 days of quiz completions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = allUsers.filter(u => 
        u.quiz_completed && 
        new Date(u.created_date) >= thirtyDaysAgo
      );

      const timelineMap = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        timelineMap[dateStr] = 0;
      }

      last30Days.forEach(u => {
        const dateStr = new Date(u.created_date).toISOString().split('T')[0];
        if (timelineMap[dateStr] !== undefined) {
          timelineMap[dateStr]++;
        }
      });

      const timeline = Object.keys(timelineMap).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completions: timelineMap[date]
      }));

      setTimelineData(timeline);

    } catch (error) {
      console.error('Error loading funnel data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Funnel Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!funnelData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Quiz Funnel Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1: Quiz Funnel */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Step Drop-Off Analysis
            </h3>
            <div className="space-y-2">
              {funnelData.funnel.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-900">{idx + 1}</span>
                      <span className="font-semibold text-gray-900">{item.step}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      {idx > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600">{item.percentage}%</span>
                          <span className="text-sm font-medium text-red-600">-{item.dropRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${item.percentage || 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Biggest Drop-Off */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-900">Biggest Drop-Off</p>
                <p className="text-sm text-red-700">
                  {funnelData.biggestDrop.step} (-{funnelData.biggestDrop.dropRate}%)
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Conversion Metrics */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Conversion Metrics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700 mb-1">Quiz Completion</p>
                <p className="text-3xl font-black text-blue-900">{funnelData.metrics.quizCompletionRate}%</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-700 mb-1">Quiz → Email</p>
                <p className="text-3xl font-black text-purple-900">{funnelData.metrics.emailConversionRate}%</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 mb-1">Email → Trial</p>
                <p className="text-3xl font-black text-green-900">{funnelData.metrics.trialConversionRate}%</p>
              </div>
            </div>
          </div>

          {/* Section 4: Timeline */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Quiz Completions (Last 30 Days)
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completions" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}