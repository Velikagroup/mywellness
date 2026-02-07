import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

const COLORS = {
  monthly: '#3b82f6',
  yearly: '#26847F',
  trial: '#a855f7',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b'
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [quizEvents, setQuizEvents] = useState([]);
  const [quizPeriod, setQuizPeriod] = useState('7d'); // 7d, 30d, all

  // Date range: last 3 months
  const [dateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date()
  });

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
      setUser(currentUser);
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    try {
      const [usersData, quizEventsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.QuizEvent.list('-created_date', 5000)
      ]);
      setUsers(usersData);
      setQuizEvents(quizEventsData);

      try {
        const txResponse = await base44.functions.invoke('adminListTransactions');
        const txData = txResponse.data || txResponse;
        if (txData.success && txData.transactions) {
          setTransactions(txData.transactions);
        }
      } catch (txError) {
        console.error('Error loading transactions:', txError);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Inizio sincronizzazione...');
      
      // Sync Stripe transactions
      const syncResponse = await base44.functions.invoke('syncStripeTransactions');
      const syncData = syncResponse.data || syncResponse;
      
      if (syncData.success) {
        console.log(`✅ Stripe sync: ${syncData.totalCreated} transazioni create, ${syncData.totalSkipped} già esistenti`);
        console.log(`📊 Utenti processati: ${syncData.usersProcessed}`);
      }

      // Reload all data from database
      console.log('🔄 Ricarico dati dal database...');
      const [usersData, quizEventsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.QuizEvent.list('-created_date', 5000)
      ]);
      setUsers(usersData);
      setQuizEvents(quizEventsData);
      console.log(`✅ ${usersData.length} utenti caricati`);
      console.log(`✅ ${quizEventsData.length} quiz events caricati`);

      // Reload transactions
      try {
        const txResponse = await base44.functions.invoke('adminListTransactions');
        const txData = txResponse.data || txResponse;
        if (txData.success && txData.transactions) {
          setTransactions(txData.transactions);
          console.log(`✅ ${txData.transactions.length} transazioni caricate`);
        }
      } catch (txError) {
        console.error('⚠️ Errore nel caricare transazioni:', txError);
      }
      
      alert(`✅ Sincronizzazione completata!\n\n${syncData.totalCreated || 0} nuove transazioni\n${usersData.length} utenti totali`);
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      alert('❌ Errore nell\'aggiornamento dati: ' + error.message);
    }
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  // Section 1: Overview KPI
  // DEBUG: Log per capire i dati
  console.log('📊 Total users:', users.length);
  console.log('📊 Sample user data:', users.slice(0, 3).map(u => ({
    id: u.id,
    status: u.subscription_status,
    billing: u.billing_period,
    plan: u.subscription_plan
  })));

  const activeMonthlyUsers = users.filter(u => {
    const isActive = u.subscription_status === 'active';
    const isMonthly = u.billing_period === 'monthly' || 
                      u.subscription_plan === 'monthly' ||
                      u.billing_period === 'month' ||
                      u.subscription_plan === 'month';
    return isActive && isMonthly;
  }).length;

  const activeYearlyUsers = users.filter(u => {
    const isActive = u.subscription_status === 'active';
    const isYearly = u.billing_period === 'yearly' || 
                     u.subscription_plan === 'yearly' ||
                     u.billing_period === 'annual' ||
                     u.subscription_plan === 'annual' ||
                     u.billing_period === 'year' ||
                     u.subscription_plan === 'year';
    return isActive && isYearly;
  }).length;

  console.log('📊 Active monthly:', activeMonthlyUsers);
  console.log('📊 Active yearly:', activeYearlyUsers);

  const totalActiveUsers = activeMonthlyUsers + activeYearlyUsers;

  const trialUsers = users.filter(u => 
    u.subscription_status === 'trial' || 
    u.subscription_status === 'pending_trial' ||
    u.subscription_status === 'trialing'
  ).length;

  // Section 2: Funnel
  const totalRegistrations = users.length;
  const quizCompleted = users.filter(u => u.quiz_completed === true).length;
  const trialsStarted = users.filter(u => 
    u.subscription_status === 'trial' || 
    u.subscription_status === 'active' && (u.billing_period === 'yearly' || u.subscription_plan === 'yearly')
  ).length;
  const trialsConverted = activeYearlyUsers;
  const subscriptionsActive = totalActiveUsers;

  const trialConversionRate = trialsStarted > 0 
    ? ((trialsConverted / trialsStarted) * 100).toFixed(1) 
    : 0;

  // Section 3: Revenue
  const PRICE_MAP = {
    monthly: 9.99,
    yearly: 49.99
  };

  const mrr = activeMonthlyUsers * PRICE_MAP.monthly;
  const arr = activeYearlyUsers * PRICE_MAP.yearly;
  const totalActiveRevenue = mrr + (activeYearlyUsers * PRICE_MAP.yearly);

  // Revenue trend (last 6 months)
  const getRevenueTrend = () => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthRevenue = transactions
        .filter(t => {
          if (!t.payment_date || t.status !== 'succeeded') return false;
          const tDate = parseISO(t.payment_date);
          return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, t) => sum + t.amount, 0);

      trends.push({
        month: format(monthDate, 'MMM', { locale: it }),
        revenue: parseFloat(monthRevenue.toFixed(2))
      });
    }
    return trends;
  };

  const revenueTrend = getRevenueTrend();

  // Section 4: Distribution
  const distributionData = [
    { name: 'Mensile', value: activeMonthlyUsers, color: COLORS.monthly },
    { name: 'Annuale', value: activeYearlyUsers, color: COLORS.yearly }
  ];

  // Section 5: Retention & Churn
  const cancelledUsers = users.filter(u => u.subscription_status === 'cancelled').length;
  const expiredUsers = users.filter(u => u.subscription_status === 'expired').length;
  const totalChurned = cancelledUsers + expiredUsers;
  const churnRate = totalActiveUsers > 0 
    ? ((totalChurned / (totalActiveUsers + totalChurned)) * 100).toFixed(1) 
    : 0;
  const retentionRate = (100 - parseFloat(churnRate)).toFixed(1);

  // Section 6: User Behaviour
  const registeredNoQuiz = users.filter(u => !u.quiz_completed).length;
  const quizCompletedUsers = quizCompleted;
  const usersWithTrial = trialUsers;
  const payingUsers = totalActiveUsers;

  // ============================================
  // QUIZ FUNNEL CALCULATIONS
  // ============================================

  // Filter events by period
  const getFilteredQuizEvents = () => {
    if (quizPeriod === 'all') return quizEvents;
    
    const now = new Date();
    const cutoffDate = quizPeriod === '7d' 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return quizEvents.filter(e => new Date(e.created_date) >= cutoffDate);
  };

  const filteredQuizEvents = getFilteredQuizEvents();

  // Count unique users for each event
  const getUniqueUsersForEvent = (eventName) => {
    return new Set(filteredQuizEvents.filter(e => e.event_name === eventName).map(e => e.user_id)).size;
  };

  const quizStartedCount = getUniqueUsersForEvent('quiz_started');
  const step1Count = getUniqueUsersForEvent('step_1_completed');
  const step2Count = getUniqueUsersForEvent('step_2_completed');
  const step3Count = getUniqueUsersForEvent('step_3_completed');
  const step4Count = getUniqueUsersForEvent('step_4_completed');
  const step5Count = getUniqueUsersForEvent('step_5_completed');
  const step6Count = getUniqueUsersForEvent('step_6_completed');
  const step7Count = getUniqueUsersForEvent('step_7_completed');
  const step8Count = getUniqueUsersForEvent('step_8_completed');
  const quizCompletedCount = getUniqueUsersForEvent('quiz_completed');
  const emailSavedCount = getUniqueUsersForEvent('email_saved');
  const trialStartedCount = getUniqueUsersForEvent('trial_started');

  // Build funnel steps
  const quizFunnelSteps = [
    { name: 'Quiz Started', count: quizStartedCount },
    { name: 'Step 1 Completed', count: step1Count },
    { name: 'Step 2 Completed', count: step2Count },
    { name: 'Step 3 Completed', count: step3Count },
    { name: 'Step 4 Completed', count: step4Count },
    { name: 'Step 5 Completed', count: step5Count },
    { name: 'Step 6 Completed', count: step6Count },
    { name: 'Step 7 Completed', count: step7Count },
    { name: 'Step 8 Completed', count: step8Count },
    { name: 'Quiz Completed', count: quizCompletedCount },
    { name: 'Email Saved', count: emailSavedCount },
    { name: 'Trial Started', count: trialStartedCount }
  ].filter(s => s.count > 0); // Only show steps with data

  // Calculate drop-off
  const funnelWithDropoff = quizFunnelSteps.map((step, index) => {
    const prevCount = index > 0 ? quizFunnelSteps[index - 1].count : step.count;
    const conversionRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : 100;
    const dropoff = prevCount > 0 ? (100 - parseFloat(conversionRate)).toFixed(1) : 0;
    
    return {
      ...step,
      conversionRate: parseFloat(conversionRate),
      dropoff: parseFloat(dropoff)
    };
  });

  // Find biggest drop-off
  const biggestDropoff = funnelWithDropoff.reduce((max, step) => 
    step.dropoff > max.dropoff ? step : max
  , { dropoff: 0, name: '-' });

  // Quiz KPIs
  const quizCompletionRate = quizStartedCount > 0 
    ? ((quizCompletedCount / quizStartedCount) * 100).toFixed(1) 
    : 0;
  const quizToEmailRate = quizCompletedCount > 0 
    ? ((emailSavedCount / quizCompletedCount) * 100).toFixed(1) 
    : 0;
  const quizToTrialRate = quizCompletedCount > 0 
    ? ((trialStartedCount / quizCompletedCount) * 100).toFixed(1) 
    : 0;

  // Timeline data (completions by day)
  const getQuizTimeline = () => {
    const completedEvents = filteredQuizEvents.filter(e => e.event_name === 'quiz_completed');
    const dailyData = {};
    
    completedEvents.forEach(event => {
      const date = new Date(event.created_date).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });
    
    const sortedDates = Object.keys(dailyData).sort();
    return sortedDates.map(date => ({
      date: format(new Date(date), 'dd MMM', { locale: it }),
      completions: dailyData[date]
    }));
  };

  const quizTimeline = getQuizTimeline();

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Dashboard strategica per decisioni business</p>
          </div>
          <Button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Aggiornamento...' : 'Aggiorna Dati'}
          </Button>
        </div>

        {/* SECTION 1: Overview KPI */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overview KPI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-gray-700" />
                  <div className={`text-3xl font-black ${totalActiveUsers > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {totalActiveUsers}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700">Total Active Users</p>
                <p className="text-xs text-gray-500 mt-1">Abbonamenti attivi</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div className="text-3xl font-black text-blue-600">{activeMonthlyUsers}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">Active Monthly</p>
                <p className="text-xs text-gray-500 mt-1">Piano €9.99/mese</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#26847F]" />
                  <div className="text-3xl font-black text-[#26847F]">{activeYearlyUsers}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">Active Annual</p>
                <p className="text-xs text-gray-500 mt-1">Piano €49.99/anno</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <div className="text-3xl font-black text-purple-600">{trialUsers}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">Trial Active</p>
                <p className="text-xs text-gray-500 mt-1">3 giorni trial annuale</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: Funnel */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Funnel Conversione (CORE BUSINESS)</h2>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-100 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-gray-300">
                    <span className="font-bold text-gray-900 text-lg">Registrazioni Totali</span>
                    <span className="font-black text-gray-900 text-3xl">{totalRegistrations}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-8">
                  <div className="w-1 h-12 bg-gray-300"></div>
                  <div className="flex-1 bg-indigo-50 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-indigo-300">
                    <span className="font-bold text-indigo-900 text-lg">Quiz Completati</span>
                    <span className="font-black text-indigo-900 text-3xl">{quizCompleted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-16">
                  <div className="w-1 h-12 bg-gray-300"></div>
                  <div className="flex-1 bg-purple-50 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-purple-300">
                    <span className="font-bold text-purple-900 text-lg">Trial Iniziati (Annuale)</span>
                    <span className="font-black text-purple-900 text-3xl">{trialsStarted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-24">
                  <div className="w-1 h-12 bg-gray-300"></div>
                  <div className="flex-1 bg-teal-50 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-teal-300">
                    <span className="font-bold text-teal-900 text-lg">Trial Convertiti</span>
                    <span className="font-black text-teal-900 text-3xl">{trialsConverted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-32">
                  <div className="w-1 h-12 bg-gray-300"></div>
                  <div className="flex-1 bg-green-50 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-green-300">
                    <span className="font-bold text-green-900 text-lg">Subscription Attive</span>
                    <span className="font-black text-green-900 text-3xl">{subscriptionsActive}</span>
                  </div>
                </div>

                {/* KPI Principale */}
                <div className="mt-8 p-8 bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl border-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-8 h-8 text-green-700" />
                        <p className="text-lg font-bold text-green-900">KPI PRINCIPALE</p>
                      </div>
                      <p className="text-sm text-green-700">Trial Conversion Rate</p>
                      <p className="text-xs text-gray-600">Trial Iniziati → Pagamenti Convertiti</p>
                    </div>
                    <div className="text-7xl font-black text-green-900">{trialConversionRate}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Revenue Dashboard */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">MRR</p>
                <p className="text-4xl font-black text-blue-900">€{mrr.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ARR</p>
                <p className="text-4xl font-black text-green-900">€{arr.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Annual Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Revenue Totale</p>
                <p className="text-4xl font-black text-purple-900">€{totalActiveRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Mensile + Annuale</p>
              </CardContent>
            </Card>
          </div>

          <Card className="water-glass-effect border-gray-200/30">
            <CardHeader>
              <CardTitle>Crescita Revenue (ultimi 6 mesi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`€${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 4: Distribuzione Piani */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Distribuzione Piani</h2>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                  {totalActiveUsers > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Nessun dato disponibile
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Piano Mensile</p>
                        <p className="text-xs text-blue-700">€9.99/mese</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-blue-900">{activeMonthlyUsers}</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {totalActiveUsers > 0 ? ((activeMonthlyUsers / totalActiveUsers) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-teal-900 mb-1">Piano Annuale</p>
                        <p className="text-xs text-teal-700">€49.99/anno (€4.17/mese)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-teal-900">{activeYearlyUsers}</p>
                        <p className="text-xs text-teal-700 mt-1">
                          {totalActiveUsers > 0 ? ((activeYearlyUsers / totalActiveUsers) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 5: Retention & Churn */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Retention & Churn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Cancellazioni</p>
                <p className="text-4xl font-black text-red-600">{totalChurned}</p>
                <p className="text-xs text-gray-500 mt-2">Utenti cancellati/scaduti</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingDown className="w-7 h-7 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Churn Rate</p>
                <p className="text-4xl font-black text-orange-600">{churnRate}%</p>
                <p className="text-xs text-gray-500 mt-2">Tasso di abbandono</p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Retention Rate</p>
                <p className="text-4xl font-black text-green-600">{retentionRate}%</p>
                <p className="text-xs text-gray-500 mt-2">Tasso di mantenimento</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 6: User Behaviour */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Behaviour (Quiz)</h2>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Registrati senza Quiz</p>
                  <p className="text-5xl font-black text-gray-900">{registeredNoQuiz}</p>
                  <p className="text-xs text-gray-500 mt-2">Drop-off punto 1</p>
                </div>

                <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                  <p className="text-sm font-semibold text-indigo-900 mb-3">Quiz Completato</p>
                  <p className="text-5xl font-black text-indigo-900">{quizCompletedUsers}</p>
                  <p className="text-xs text-indigo-600 mt-2">Passati al quiz</p>
                </div>

                <div className="p-6 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <p className="text-sm font-semibold text-purple-900 mb-3">Con Trial</p>
                  <p className="text-5xl font-black text-purple-900">{usersWithTrial}</p>
                  <p className="text-xs text-purple-600 mt-2">Attivato trial</p>
                </div>

                <div className="p-6 bg-green-50 rounded-xl border border-green-200 text-center">
                  <p className="text-sm font-semibold text-green-900 mb-3">Paganti</p>
                  <p className="text-5xl font-black text-green-900">{payingUsers}</p>
                  <p className="text-xs text-green-600 mt-2">Conversione finale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 7: Quiz Funnel Analytics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quiz Funnel Analytics</h2>
              <p className="text-sm text-gray-600">Dove si fermano gli utenti nel quiz</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={quizPeriod}
                onChange={(e) => setQuizPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
              <Button
                onClick={loadData}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Quiz Data
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quiz Completion Rate</p>
                <p className="text-4xl font-black text-indigo-900">{quizCompletionRate}%</p>
                <p className="text-xs text-gray-500 mt-2">
                  {quizCompletedCount} / {quizStartedCount} completati
                </p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quiz → Email Rate</p>
                <p className="text-4xl font-black text-purple-900">{quizToEmailRate}%</p>
                <p className="text-xs text-gray-500 mt-2">
                  {emailSavedCount} email salvate
                </p>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quiz → Trial Rate</p>
                <p className="text-4xl font-black text-green-900">{quizToTrialRate}%</p>
                <p className="text-xs text-gray-500 mt-2">
                  {trialStartedCount} trial attivati
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Biggest Drop-off Alert */}
          {biggestDropoff.dropoff > 0 && (
            <Card className="bg-red-50 border-red-200 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-900">
                      ⚠️ Biggest drop-off: {biggestDropoff.name} (-{biggestDropoff.dropoff}%)
                    </p>
                    <p className="text-sm text-red-700">
                      Focus optimization efforts here for maximum impact
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funnel Visualization */}
          <Card className="water-glass-effect border-gray-200/30 mb-6">
            <CardHeader>
              <CardTitle>Step-by-Step Funnel</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {funnelWithDropoff.map((step, index) => {
                  const prevCount = index > 0 ? funnelWithDropoff[index - 1].count : step.count;
                  const barWidth = prevCount > 0 ? (step.count / prevCount) * 100 : 100;
                  const isHighDropoff = step.dropoff > 30;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-900">{step.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">{step.count} users</span>
                          <span className="text-green-600 font-bold">{step.conversionRate}%</span>
                          {step.dropoff > 0 && (
                            <span className={`font-bold ${isHighDropoff ? 'text-red-600' : 'text-orange-500'}`}>
                              -{step.dropoff}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${
                            isHighDropoff ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          } transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <div className="h-full flex items-center justify-center text-white font-bold">
                            {step.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          {quizTimeline.length > 0 && (
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle>Quiz Completions Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quizTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}