
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Target,
  Activity,
  Link as LinkIcon,
  Plus,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  MousePointerClick,
  Eye,
  ShoppingCart,
  Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminMarketing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedFunnel, setSelectedFunnel] = useState('trial'); // 'trial' or 'landing'

  const [selectedDateRange, setSelectedDateRange] = useState([
    subDays(new Date(), 30),
    new Date()
  ]);

  const [campaignsByPlatform, setCampaignsByPlatform] = useState([]);
  const [marketingExpenses, setMarketingExpenses] = useState([]);
  const [allMetricsFilteredByDate, setAllMetricsFilteredByDate] = useState([]);

  const loadMarketingData = async () => {
    setIsLoading(true);
    try {
      const campaignsData = await base44.entities.AdCampaign.list();
      const metricsData = await base44.entities.AdMetric.list();
      const expensesData = await base44.entities.Expense.filter({
        category: 'marketing',
        date: { $gte: selectedDateRange[0].toISOString(), $lte: selectedDateRange[1].toISOString() }
      });
      const allTransactionsData = await base44.entities.Transaction.list();
      const allUsers = await base44.entities.User.list();

      setCampaigns(campaignsData);
      setMetrics(metricsData);
      setTransactions(allTransactionsData);

      const metricsFilteredByDate = metricsData.filter(m => {
        if (!m.date) return false;
        const metricDate = parseISO(m.date);
        return isWithinInterval(metricDate, { start: selectedDateRange[0], end: selectedDateRange[1] });
      });
      setAllMetricsFilteredByDate(metricsFilteredByDate);

      const platforms = ['meta', 'tiktok', 'pinterest', 'google'];
      const funnelData = {};

      const totalQuizCompleted = allUsers.filter(u => u.quiz_completed === true).length;
      const totalCheckoutStarted = allUsers.filter(u => u.billing_name && u.billing_name.length > 0).length;
      const totalPurchases = allUsers.filter(u => u.purchased_landing_offer === true).length;

      platforms.forEach(platform => {
        funnelData[platform] = {
          quiz: Math.floor(totalQuizCompleted / platforms.length), // This is a simplified distribution, might need refinement
          checkout: Math.floor(totalCheckoutStarted / platforms.length),
          purchases: Math.floor(totalPurchases / platforms.length)
        };
      });

      const groupedData = campaignsData.reduce((acc, campaign) => {
        const platform = campaign.platform;
        const campaignMetrics = metricsFilteredByDate.filter(m => m.campaign_id === campaign.campaign_id);

        const totalSpend = campaignMetrics.reduce((sum, m) => sum + (m.spend || 0), 0);
        const totalRevenue = campaignMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
        const totalConversions = campaignMetrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
        const totalClicks = campaignMetrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
        const totalImpressions = campaignMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);

        if (!acc[platform]) {
          acc[platform] = {
            platform,
            campaigns: [],
            totalSpend: 0,
            totalRevenue: 0,
            totalConversions: 0,
            totalClicks: 0,
            totalImpressions: 0,
            funnel: funnelData[platform] || { quiz: 0, checkout: 0, purchases: 0 }
          };
        }

        acc[platform].campaigns.push({
          ...campaign,
          metrics: campaignMetrics,
          totalSpend, totalConversions, totalRevenue, totalClicks, totalImpressions
        });

        acc[platform].totalSpend += totalSpend;
        acc[platform].totalRevenue += totalRevenue;
        acc[platform].totalConversions += totalConversions;
        acc[platform].totalClicks += totalClicks;
        acc[platform].totalImpressions += totalImpressions;

        return acc;
      }, {});

      setCampaignsByPlatform(Object.values(groupedData));
      setMarketingExpenses(expensesData);

    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkUserAccessAndLoad = async () => {
      setIsLoading(true);
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
        await loadMarketingData();
      } catch (error) {
        console.error("Access check failed:", error);
        navigate(createPageUrl('Home'));
      }
    };
    checkUserAccessAndLoad();
  }, []);

  useEffect(() => {
    if (user) {
      loadMarketingData();
    }
  }, [selectedDateRange, user]);

  const totalSpend = campaignsByPlatform.reduce((sum, p) => sum + p.totalSpend, 0);
  const totalRevenue = campaignsByPlatform.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalConversions = campaignsByPlatform.reduce((sum, p) => sum + p.totalConversions, 0);
  const totalClicks = campaignsByPlatform.reduce((sum, p) => sum + p.totalClicks, 0);
  const totalImpressions = campaignsByPlatform.reduce((sum, p) => sum + p.totalImpressions, 0);

  const overallROAS = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0;
  const overallCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0;
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  const netProfit = totalRevenue - totalSpend;

  // Calculate organic social sales
  const filteredTransactions = transactions.filter(t => {
    if (!t.payment_date) return false;
    const txDate = parseISO(t.payment_date);
    return isWithinInterval(txDate, { start: selectedDateRange[0], end: selectedDateRange[1] });
  });

  // Filter by funnel type
  const funnelFilteredTransactions = filteredTransactions.filter(t => {
    if (selectedFunnel === 'trial') {
      return t.type === 'subscription_payment' || t.type === 'trial_setup';
    } else { // selectedFunnel === 'landing'
      return t.plan === 'landing_offer' || t.type === 'one_time_payment';
    }
  });

  const organicSocialSales = funnelFilteredTransactions.filter(t =>
    t.traffic_source && t.traffic_source.startsWith('organic_') && t.status === 'succeeded'
  );

  const organicSalesByPlatform = organicSocialSales.reduce((acc, sale) => {
    const platform = sale.traffic_source.replace('organic_', '');
    if (!acc[platform]) {
      acc[platform] = {
        platform,
        sales: 0,
        revenue: 0,
        transactions: []
      };
    }
    acc[platform].sales += 1;
    acc[platform].revenue += sale.amount;
    acc[platform].transactions.push(sale);
    return acc;
  }, {});

  const organicSocialData = Object.values(organicSalesByPlatform);
  const totalOrganicSales = organicSocialSales.length;
  const totalOrganicRevenue = organicSocialSales.reduce((sum, s) => sum + s.amount, 0);

  const platformData = campaignsByPlatform.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    spend: Math.round(p.totalSpend),
    revenue: Math.round(p.totalRevenue),
    conversions: p.totalConversions,
    roas: p.totalSpend > 0 ? (p.totalRevenue / p.totalSpend).toFixed(2) : 0
  })).filter(p => p.spend > 0 || p.revenue > 0);

  const getDailyTrend = () => {
    const dailyMap = {};
    allMetricsFilteredByDate.forEach(m => {
      const date = m.date;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, spend: 0, revenue: 0, conversions: 0 };
      }
      dailyMap[date].spend += m.spend || 0;
      dailyMap[date].revenue += m.revenue || 0;
      dailyMap[date].conversions += m.conversions || 0;
    });

    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        date: format(parseISO(d.date), 'dd MMM', { locale: it }),
        spend: Math.round(d.spend),
        revenue: Math.round(d.revenue),
        roas: d.spend > 0 ? (d.revenue / d.spend).toFixed(2) : 0
      }));
  };

  const dailyTrend = getDailyTrend();

  const PLATFORM_COLORS = {
    Meta: '#0084FF',
    Tiktok: '#000000',
    Pinterest: '#E60023',
    Google: '#4285F4'
  };

  const handleConnectPlatform = async (platform) => {
    setSelectedPlatform(platform);
    setShowConnectDialog(true);
  };

  const handleSyncMetrics = async (platform) => {
    try {
      const response = await base44.functions.invoke('syncAdMetrics', { platform });
      if (response.success) {
        alert(`✅ Metriche sincronizzate da ${platform}`);
        await loadMarketingData();
      } else {
        alert(`Errore durante la sincronizzazione da ${platform}: ${response.error || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      alert('Errore durante la sincronizzazione: ' + error.message);
      console.error('Error syncing metrics:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Analytics</h1>
          <p className="text-gray-600">Performance campagne pubblicitarie e ROAS</p>
        </div>

        {/* Connessione Piattaforme - Box Esterno */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[var(--brand-primary)]" />
              Connetti Piattaforme Advertising
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Collega i tuoi account pubblicitari per sincronizzare automaticamente le metriche</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Meta', 'TikTok', 'Pinterest', 'Google'].map((platformDisplayName) => {
                const platformKey = platformDisplayName.toLowerCase();
                const isConnected = campaignsByPlatform.some(p => p.platform === platformKey && p.campaigns.length > 0);

                return (
                  <div key={platformDisplayName} className={`p-5 rounded-xl border-2 transition-all ${
                    isConnected
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {platformDisplayName === 'Meta' ? 'Meta Ads' : platformDisplayName + ' Ads'}
                      </h4>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isConnected ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <LinkIcon className={`w-4 h-4 ${isConnected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                    </div>

                    <p className={`text-xs mb-3 font-medium ${isConnected ? 'text-green-700' : 'text-gray-600'}`}>
                      {isConnected ? '✅ Connesso e Sincronizzato' : '⚠️ Non Connesso'}
                    </p>

                    {isConnected ? (
                      <Button
                        onClick={() => handleSyncMetrics(platformKey)}
                        size="sm"
                        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Sincronizza
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnectPlatform(platformKey)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Connetti
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={selectedFunnel} onValueChange={setSelectedFunnel} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="trial" className="text-sm">
                  Trial Setup
                </TabsTrigger>
                <TabsTrigger value="landing" className="text-sm">
                  Landing Checkout
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Spesa Totale</p>
                  <p className="text-3xl font-bold text-red-600">€{totalSpend.toLocaleString('it-IT')}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Entrate da Ads</p>
                  <p className="text-3xl font-bold text-green-600">€{totalRevenue.toLocaleString('it-IT')}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">ROAS</p>
                  <p className={`text-3xl font-bold ${overallROAS >= 2 ? 'text-green-600' : overallROAS >= 1 ? 'text-orange-600' : 'text-red-600'}`}>
                    {overallROAS}x
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Profitto: €{netProfit.toFixed(0)}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallROAS >= 2 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <Target className={`w-6 h-6 ${overallROAS >= 2 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Conversioni</p>
                  <p className="text-3xl font-bold text-purple-600">{totalConversions}</p>
                  <p className="text-xs text-gray-500 mt-1">CPA: €{overallCPA}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROAS Trend */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Andamento ROAS e Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                    name="Spesa (€)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Entrate (€)"
                  />
                  <Line
                    type="monotone"
                    dataKey="roas"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name="ROAS"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sezione Vendite Organiche Social */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Vendite Organiche Social
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Vendite da attività organica ({selectedFunnel === 'trial' ? 'Trial Setup' : 'Landing Checkout'})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Totale Vendite</p>
                <p className="text-3xl font-bold text-purple-600">{totalOrganicSales}</p>
                <p className="text-sm text-gray-500">€{totalOrganicRevenue.toFixed(0)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {organicSocialData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organicSocialData.map((platform) => {
                  const platformName = platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1);
                  const avgOrderValue = platform.sales > 0 ? (platform.revenue / platform.sales).toFixed(2) : 0;

                  return (
                    <div key={platform.platform} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">{platformName}</h4>
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Vendite:</span>
                          <span className="font-bold text-purple-600">{platform.sales}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Revenue:</span>
                          <span className="font-bold text-green-600">€{platform.revenue.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">AOV:</span>
                          <span className="font-bold text-gray-700">€{avgOrderValue}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-purple-200">
                        <p className="text-xs text-gray-500">Transazioni Recenti</p>
                        <div className="mt-2 space-y-1">
                          {platform.transactions.slice(0, 3).map((tx, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-600">{format(parseISO(tx.payment_date), 'dd/MM')}</span>
                              <span className="font-semibold text-green-600">€{tx.amount.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessuna vendita organica tracciata nel periodo selezionato</p>
                <p className="text-sm text-gray-400 mt-2">Le vendite organiche vengono tracciate automaticamente quando viene specificata la sorgente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Piattaforme Ads - Box Dettagliati */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Meta', 'TikTok', 'Pinterest', 'Google'].map((platformDisplayName, index) => {
            const platformKey = platformDisplayName.toLowerCase();
            const isConnected = campaignsByPlatform.some(p => p.platform === platformKey && p.campaigns.length > 0);

            const platformGroup = campaignsByPlatform.find(p => p.platform === platformKey);
            const funnel = platformGroup?.funnel || { quiz: 0, checkout: 0, purchases: 0 };

            const platformSpend = platformGroup?.totalSpend || 0;
            const platformRevenue = platformGroup?.totalRevenue || 0;
            const platformROAS = platformSpend > 0 ? (platformRevenue / platformSpend).toFixed(2) : 0;

            return (
              <Card key={index} className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {platformDisplayName === 'Meta' ? 'Meta (Facebook/Instagram)' : platformDisplayName + ' Ads'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isConnected ? '✅ Connesso' : '⚠️ Non connesso'} • {selectedFunnel === 'trial' ? 'Trial Setup' : 'Landing Checkout'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <LinkIcon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  {/* Metriche Piattaforma */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-xs text-red-600 font-semibold mb-1">Spesa</p>
                      <p className="text-lg font-bold text-red-700">€{platformSpend.toFixed(0)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-600 font-semibold mb-1">Entrate</p>
                      <p className="text-lg font-bold text-green-700">€{platformRevenue.toFixed(0)}</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${
                      platformROAS >= 2 ? 'bg-green-50 border-green-100' :
                      platformROAS >= 1 ? 'bg-orange-50 border-orange-100' :
                      'bg-red-50 border-red-100'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${
                        platformROAS >= 2 ? 'text-green-600' :
                        platformROAS >= 1 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>ROAS</p>
                      <p className={`text-lg font-bold ${
                        platformROAS >= 2 ? 'text-green-700' :
                        platformROAS >= 1 ? 'text-orange-700' :
                        'text-red-700'
                      }`}>{platformROAS}x</p>
                    </div>
                  </div>

                  {isConnected && (
                    <div className="space-y-3 mb-6">
                      <Button
                        onClick={() => handleSyncMetrics(platformKey)}
                        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Sincronizza Metriche
                      </Button>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          Ultima sincronizzazione: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Landing Funnel */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">
                      {selectedFunnel === 'trial' ? 'Funnel Trial Setup' : 'Funnel Landing Offer'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg text-sm">
                        <span className="text-gray-700">Quiz Completati</span>
                        <span className="font-bold text-indigo-600">{funnel.quiz}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg text-sm">
                        <span className="text-gray-700">Checkout Iniziati</span>
                        <span className="font-bold text-cyan-600">{funnel.checkout}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg text-sm">
                        <span className="text-gray-700">Acquisti</span>
                        <span className="font-bold text-emerald-600">{funnel.purchases}</span>
                      </div>
                      <div className="mt-2 p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg border border-indigo-200">
                        <p className="text-xs text-gray-600 mb-1">Conversione Quiz → Acquisto</p>
                        <p className="text-xl font-black text-indigo-600">
                          {funnel.quiz > 0
                            ? ((funnel.purchases / funnel.quiz) * 100).toFixed(1)
                            : '0.0'}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connect Platform Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connetti Piattaforma Ads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Per connettere questa piattaforma, avrai bisogno di autorizzare MyWellness ad accedere ai dati delle tue campagne pubblicitarie.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">Cosa verrà sincronizzato:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Metriche campagne (impressioni, click, spesa)</li>
                <li>Conversioni e revenue</li>
                <li>ROAS e performance</li>
              </ul>
            </div>
            <Button
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
              onClick={() => {
                alert('Feature in sviluppo: OAuth flow per ' + selectedPlatform);
                setShowConnectDialog(false);
              }}
            >
              Autorizza Accesso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
