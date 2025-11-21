import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ThumbsDown, MessageCircle, TrendingDown, Users, Mail, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cancellationFeedbacks, setCancellationFeedbacks] = useState([]);
  const [emailFeedbacks, setEmailFeedbacks] = useState([]);
  const [discoveryStats, setDiscoveryStats] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadData = async () => {
    try {
      const [cancellations, aiFeedbacks, onboardingData] = await Promise.all([
        base44.entities.CancellationFeedback.list(['-created_date']),
        base44.entities.AIFeedback.list(['-created_date']),
        base44.entities.UserOnboarding.list()
      ]);
      
      setCancellationFeedbacks(cancellations);
      setEmailFeedbacks(aiFeedbacks);
      
      // Process discovery stats
      const sourceCounts = {};
      onboardingData.forEach(record => {
        if (record.discovery_source) {
          sourceCounts[record.discovery_source] = (sourceCounts[record.discovery_source] || 0) + 1;
        }
      });
      
      const stats = Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
        percentage: ((count / onboardingData.length) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
      
      setDiscoveryStats(stats);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const reasonLabels = {
    troppo_costoso: '💰 Troppo Costoso',
    non_uso_abbastanza: '⏰ Non Uso Abbastanza',
    risultati_non_soddisfacenti: '📉 Risultati Non Soddisfacenti',
    troppo_complesso: '🤯 Troppo Complesso',
    problemi_tecnici: '⚠️ Problemi Tecnici',
    mancano_funzionalita: '🔧 Mancano Funzionalità',
    preferisco_altra_app: '🔄 Preferisco Altra App',
    obiettivo_raggiunto: '🎯 Obiettivo Raggiunto',
    altro: '📝 Altro'
  };

  const reasonCounts = {};
  cancellationFeedbacks.forEach(f => {
    reasonCounts[f.cancellation_reason] = (reasonCounts[f.cancellation_reason] || 0) + 1;
  });

  const pieData = Object.entries(reasonCounts).map(([reason, count]) => ({
    name: reasonLabels[reason] || reason,
    value: count,
    percentage: ((count / cancellationFeedbacks.length) * 100).toFixed(1)
  }));

  const barData = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason: reasonLabels[reason] || reason,
      count: count
    }));

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4', '#6366f1'];

  const recommendPercentage = cancellationFeedbacks.length > 0
    ? ((cancellationFeedbacks.filter(f => f.would_recommend).length / cancellationFeedbacks.length) * 100).toFixed(1)
    : 0;

  const avgDaysUsed = cancellationFeedbacks.length > 0
    ? Math.round(cancellationFeedbacks.reduce((sum, f) => sum + (f.days_used || 0), 0) / cancellationFeedbacks.length)
    : 0;

  const discoveryLabels = {
    instagram: '📸 Instagram',
    tiktok: '🎵 TikTok',
    facebook: '👥 Facebook',
    youtube: '▶️ YouTube',
    google_search: '🔍 Google',
    friend_recommendation: '🤝 Amico',
    influencer: '⭐ Influencer',
    blog_article: '📰 Blog',
    podcast: '🎙️ Podcast',
    other: '💡 Altro'
  };

  const DISCOVERY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#6366f1', '#ef4444', '#06b6d4', '#a855f7'];

  const discoveryPieData = discoveryStats.map((stat, index) => ({
    name: discoveryLabels[stat.source] || stat.source,
    value: stat.count,
    percentage: stat.percentage
  }));

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Feedback Clienti</h1>
          <p className="text-sm sm:text-base text-gray-600">Analisi cancellazioni e feedback utenti</p>
        </div>

        <Tabs defaultValue="discovery" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-3 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="discovery" className="text-xs sm:text-sm whitespace-nowrap">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Come Ci Hanno Trovati ({discoveryStats.reduce((sum, s) => sum + s.count, 0)})
              </TabsTrigger>
              <TabsTrigger value="cancellations" className="text-xs sm:text-sm whitespace-nowrap">
                <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Cancellazioni ({cancellationFeedbacks.length})
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs sm:text-sm whitespace-nowrap">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Feedback AI ({emailFeedbacks.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="discovery" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="water-glass-effect border-gray-200/30">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Distribuzione Canali</CardTitle>
                </CardHeader>
                <CardContent>
                  {discoveryPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={discoveryPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {discoveryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DISCOVERY_COLORS[index % DISCOVERY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '13px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>

              <Card className="water-glass-effect border-gray-200/30">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Classifica Canali di Acquisizione</CardTitle>
                </CardHeader>
                <CardContent>
                  {discoveryStats.length > 0 ? (
                    <div className="space-y-3">
                      {discoveryStats.map((stat, index) => (
                        <div key={stat.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: DISCOVERY_COLORS[index % DISCOVERY_COLORS.length] }}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{discoveryLabels[stat.source] || stat.source}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{stat.count}</p>
                            <p className="text-xs text-gray-500">{stat.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">📊 Insights Marketing</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Canale Top:</strong> {discoveryStats[0] ? (discoveryLabels[discoveryStats[0].source] || discoveryStats[0].source) : 'N/A'} ({discoveryStats[0]?.percentage}%)</li>
                      <li>• <strong>Totale Utenti Tracciati:</strong> {discoveryStats.reduce((sum, s) => sum + s.count, 0)}</li>
                      <li>• <strong>Canali Attivi:</strong> {discoveryStats.length}/{Object.keys(discoveryLabels).length}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancellations" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="water-glass-effect border-gray-200/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">Totale</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{cancellationFeedbacks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="water-glass-effect border-gray-200/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">Consiglia</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{recommendPercentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="water-glass-effect border-gray-200/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">Giorni Medi Uso</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgDaysUsed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="water-glass-effect border-gray-200/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">Motivo Principale</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {barData[0]?.reason?.split(' ')[0] || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="water-glass-effect border-gray-200/30">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Distribuzione Motivi</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>

              <Card className="water-glass-effect border-gray-200/30">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Classifica Motivi</CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#26847F" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Feedback Dettagliati</CardTitle>
              </CardHeader>
              <CardContent>
                {cancellationFeedbacks.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">Nessun feedback disponibile</p>
                ) : (
                  <div className="space-y-3">
                    {cancellationFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{feedback.user_email}</Badge>
                              <Badge className="bg-purple-100 text-purple-700 text-xs">{feedback.user_plan}</Badge>
                              {feedback.would_recommend && (
                                <Badge className="bg-green-100 text-green-700 text-xs">👍 Consiglierebbe</Badge>
                              )}
                              {!feedback.would_recommend && (
                                <Badge className="bg-red-100 text-red-700 text-xs">👎 Non consiglierebbe</Badge>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm mb-2">
                              {reasonLabels[feedback.cancellation_reason]}
                            </p>
                            {feedback.additional_details && (
                              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                <p className="text-xs text-gray-500 mb-1">Dettagli:</p>
                                <p className="text-sm text-gray-700 italic">"{feedback.additional_details}"</p>
                              </div>
                            )}
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">{feedback.days_used || 0} giorni uso</p>
                            <p className="text-xs text-gray-400">
                              {new Date(feedback.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Feedback Email Ricevuti</CardTitle>
              </CardHeader>
              <CardContent>
                {emailFeedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nessun feedback via email ancora</p>
                    <p className="text-xs text-gray-400 mt-2">I feedback arrivano automaticamente a 7, 30 e 60 giorni</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{feedback.user_id}</Badge>
                              <Badge className="text-xs capitalize">{feedback.feedback_type.replace('_', ' ')}</Badge>
                              <Badge className={`text-xs ${
                                feedback.status === 'implemented' ? 'bg-green-100 text-green-700' :
                                feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {feedback.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">"{feedback.message}"</p>
                            {feedback.context && (
                              <p className="text-xs text-gray-500">
                                Contesto: {feedback.context.meal_type || ''} {feedback.context.day_of_week || ''}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(feedback.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}