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
      const [cancellations, aiFeedbacks] = await Promise.all([
        base44.entities.CancellationFeedback.list(['-created_date']),
        base44.entities.AIFeedback.list(['-created_date'])
      ]);
      
      setCancellationFeedbacks(cancellations);
      setEmailFeedbacks(aiFeedbacks);
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

  // Calcola statistiche cancellazioni
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

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Feedback Clienti</h1>
          <p className="text-sm sm:text-base text-gray-600">Analisi cancellazioni e feedback utenti</p>
        </div>

        <Tabs defaultValue="cancellations" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-2 gap-2 bg-gray-100/80 p-1 rounded-lg">
              <TabsTrigger value="cancellations" className="text-xs sm:text-sm whitespace-nowrap">
                <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Cancellazioni ({cancellationFeedbacks.length})
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs sm:text-sm whitespace-nowrap">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Feedback Generali ({emailFeedbacks.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="cancellations" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Totale Cancellazioni</p>
                      <p className="text-2xl font-bold text-gray-900">{cancellationFeedbacks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Consiglierebbero</p>
                      <p className="text-2xl font-bold text-gray-900">{recommendPercentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Giorni Medi Uso</p>
                      <p className="text-2xl font-bold text-gray-900">{avgDaysUsed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <ThumbsDown className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Motivo Top</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {barData[0]?.reason?.split(' ')[0] || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuzione Motivi</CardTitle>
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
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Classifica Motivi</CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="reason" type="category" width={150} tick={{ fontSize: 11 }} />
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

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Feedback Dettagliati</CardTitle>
              </CardHeader>
              <CardContent>
                {cancellationFeedbacks.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">Nessun feedback disponibile</p>
                ) : (
                  <div className="space-y-3">
                    {cancellationFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
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
                              <p className="text-sm text-gray-600 italic">"{feedback.additional_details}"</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">{feedback.days_used || 0} giorni</p>
                            <p className="text-xs text-gray-400">
                              {new Date(feedback.created_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
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
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Feedback Email Ricevuti</CardTitle>
              </CardHeader>
              <CardContent>
                {emailFeedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nessun feedback via email ancora</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{feedback.user_id}</Badge>
                              <Badge className="text-xs">{feedback.feedback_type}</Badge>
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