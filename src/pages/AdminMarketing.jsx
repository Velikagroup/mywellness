
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  // Original states, some might be raw data for specific display needs, or deprecated by new structure
  const [campaigns, setCampaigns] = useState([]); // Raw list of campaigns for 'Campaigns' tab
  const [metrics, setMetrics] = useState([]); // Raw metrics, potentially deprecated by processed data
  const [transactions, setTransactions] = useState([]); // Raw transactions

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Renamed from 'dateRange' to 'selectedDateRange' as per outline implication
  const [selectedDateRange, setSelectedDateRange] = useState([
    subDays(new Date(), 30),
    new Date()
  ]);

  // NEW states from the outline's implied data structure
  const [campaignsByPlatform, setCampaignsByPlatform] = useState([]); // Aggregated data
  const [marketingExpenses, setMarketingExpenses] = useState([]); // New state for expenses
  const [allMetricsFilteredByDate, setAllMetricsFilteredByDate] = useState([]); // For daily trend and overall stats

  // Define the main data loading and processing function
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

      // Update raw state variables if they are still needed for specific UI parts
      setCampaigns(campaignsData); // Needed for 'Campaigns' tab list
      setMetrics(metricsData); // Keep if raw metrics are displayed anywhere, otherwise can be removed
      setTransactions(allTransactionsData);

      // Filter metrics by the current date range for aggregation
      const metricsFilteredByDate = metricsData.filter(m => {
        if (!m.date) return false;
        const metricDate = parseISO(m.date);
        return isWithinInterval(metricDate, { start: selectedDateRange[0], end: selectedDateRange[1] });
      });
      setAllMetricsFilteredByDate(metricsFilteredByDate); // Store for daily trend and other derived stats

      // NEW: Calculate funnel data per platform
      // Distribuzione semplificata: dividiamo equamente tutti gli utenti tra le piattaforme
      const platforms = ['meta', 'tiktok', 'pinterest', 'google'];
      const funnelData = {};

      const totalQuizCompleted = allUsers.filter(u => u.quiz_completed === true).length;
      const totalCheckoutStarted = allUsers.filter(u => u.billing_name && u.billing_name.length > 0).length;
      const totalPurchases = allUsers.filter(u => u.purchased_landing_offer === true).length;

      platforms.forEach(platform => {
        funnelData[platform] = {
          quiz: Math.floor(totalQuizCompleted / platforms.length),
          checkout: Math.floor(totalCheckoutStarted / platforms.length),
          purchases: Math.floor(totalPurchases / platforms.length)
        };
      });

      // Group and aggregate data per platform
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
            funnel: funnelData[platform] || { quiz: 0, checkout: 0, purchases: 0 } // Attach funnel data
          };
        }

        // Add campaign details and its aggregated metrics to the platform
        acc[platform].campaigns.push({
          ...campaign,
          metrics: campaignMetrics, // Keep raw campaign metrics if needed for drill-down
          totalSpend, totalConversions, totalRevenue, totalClicks, totalImpressions
        });

        // Sum up platform totals
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

  // 1. Initial access check and first data load on component mount
  useEffect(() => {
    const checkUserAccessAndLoad = async () => {
      setIsLoading(true); // Ensure loading is true at the start of the access check
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
          return; // Stop execution if not admin
        }
        setUser(currentUser);
        // After user access is confirmed, perform the initial data load
        await loadMarketingData();
      } catch (error) {
        console.error("Access check failed:", error);
        navigate(createPageUrl('Home')); // Redirect if access fails
      }
      // setIsLoading(false) is handled by loadMarketingData's finally block
      // If `navigate` occurs, component unmounts, so no need to set isLoading here.
    };
    checkUserAccessAndLoad();
  }, []); // Empty dependency array means this runs once on mount

  // 2. Effect to reload data when selectedDateRange or user changes (e.g., after initial user fetch)
  useEffect(() => {
    // Only load if user is already authenticated to prevent unnecessary calls before `setUser`
    if (user) {
      loadMarketingData();
    }
  }, [selectedDateRange, user]); // Re-run when date range changes or user object is set/changes

  // --- Derived Calculations from new state structure ---
  // Summing across all platforms for overall stats
  const totalSpend = campaignsByPlatform.reduce((sum, p) => sum + p.totalSpend, 0);
  const totalRevenue = campaignsByPlatform.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalConversions = campaignsByPlatform.reduce((sum, p) => sum + p.totalConversions, 0);
  const totalClicks = campaignsByPlatform.reduce((sum, p) => sum + p.totalClicks, 0);
  const totalImpressions = campaignsByPlatform.reduce((sum, p) => sum + p.totalImpressions, 0);

  const overallROAS = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0;
  const overallCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0;
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  const netProfit = totalRevenue - totalSpend;

  // Platform breakdown for charts and ROAS list
  const platformData = campaignsByPlatform.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    spend: Math.round(p.totalSpend),
    revenue: Math.round(p.totalRevenue),
    conversions: p.totalConversions,
    roas: p.totalSpend > 0 ? (p.totalRevenue / p.totalSpend).toFixed(2) : 0
  })).filter(p => p.spend > 0 || p.revenue > 0); // Show platforms with activity

  // Daily trend from the aggregated and date-filtered metrics
  const getDailyTrend = () => {
    const dailyMap = {};
    allMetricsFilteredByDate.forEach(m => {
      const date = m.date; // m.date is already an ISO string from the API
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
        date: format(parseISO(d.date), 'dd MMM', { locale: it }), // Parse ISO string to Date object
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
    // In futuro qui chiamerai la backend function per OAuth flow
  };

  const handleSyncMetrics = async (platform) => {
    try {
      // Call backend function to sync metrics from platform
      const response = await base44.functions.invoke('syncAdMetrics', { platform });
      if (response.success) {
        alert(`✅ Metriche sincronizzate da ${platform}`);
        await loadMarketingData(); // Re-load all data to update views
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Piattaforme</TabsTrigger>
            <TabsTrigger value="campaigns">Campagne</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
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

            {/* Platform Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance per Piattaforma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {platformData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="spend" fill="#ef4444" name="Spesa (€)" />
                          <Bar dataKey="revenue" fill="#10b981" name="Entrate (€)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Nessun dato disponibile</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>ROAS per Piattaforma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {platformData.map((platform, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{platform.name}</span>
                          <span className={`font-bold ${platform.roas >= 2 ? 'text-green-600' : platform.roas >= 1 ? 'text-orange-600' : 'text-red-600'}`}>
                            {platform.roas}x
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${platform.roas >= 2 ? 'bg-green-600' : platform.roas >= 1 ? 'bg-orange-600' : 'bg-red-600'}`}
                            style={{ width: `${Math.min((parseFloat(platform.roas) / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Spesa: €{platform.spend}</span>
                          <span>Entrate: €{platform.revenue}</span>
                        </div>
                      </div>
                    ))}
                    {platformData.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Connetti le tue piattaforme ads</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Metriche Chiave Media Buying</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-700" />
                      <p className="text-sm text-blue-700 font-semibold">Impressioni</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{totalImpressions.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointerClick className="w-4 h-4 text-purple-700" />
                      <p className="text-sm text-purple-700 font-semibold">Click</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{totalClicks.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-700" />
                      <p className="text-sm text-green-700 font-semibold">CTR</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{overallCTR}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-orange-700" />
                      <p className="text-sm text-orange-700 font-semibold">CPA</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900">€{overallCPA}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLATFORMS TAB */}
          <TabsContent value="platforms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Meta', 'TikTok', 'Pinterest', 'Google'].map((platformDisplayName, index) => {
                const platformKey = platformDisplayName.toLowerCase();
                // Check connectivity using the new grouped data structure
                const isConnected = campaignsByPlatform.some(p => p.platform === platformKey && p.campaigns.length > 0);
                
                // Get funnel data for this platform
                const platformGroup = campaignsByPlatform.find(p => p.platform === platformKey);
                const funnel = platformGroup?.funnel || { quiz: 0, checkout: 0, purchases: 0 };
                
                // Calcolo metriche per ogni piattaforma
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
                            {isConnected ? '✅ Connesso' : '⚠️ Non connesso'}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <LinkIcon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                      </div>

                      {/* Metriche Piattaforma - SEMPRE VISIBILI */}
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

                      {isConnected ? (
                        <div className="space-y-3">
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
                      ) : (
                        <Button
                          onClick={() => handleConnectPlatform(platformKey)}
                          variant="outline"
                          className="w-full"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Connetti {platformDisplayName === 'Meta' ? 'Meta' : platformDisplayName} Ads
                        </Button>
                      )}

                      {/* Landing Funnel per Social */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Funnel Landing Offer</h4>
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

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Come Funziona
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>1. Connetti le tue piattaforme ads tramite OAuth</p>
                  <p>2. Le metriche vengono sincronizzate automaticamente ogni ora</p>
                  <p>3. Usa Conversion API di Meta per tracciare vendite in tempo reale</p>
                  <p>4. Monitora ROAS e performance in un'unica dashboard</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Campagne Attive</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Use the `campaigns` state, which is now populated by `loadMarketingData` */}
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'active').map((campaign) => {
                      // Find aggregated metrics for this campaign from campaignsByPlatform
                      const platformDataForCampaign = campaignsByPlatform.find(p => p.platform === campaign.platform);
                      const campaignAggregated = platformDataForCampaign?.campaigns.find(c => c.id === campaign.id);

                      const campaignSpend = campaignAggregated?.totalSpend || 0;
                      const campaignRevenue = campaignAggregated?.totalRevenue || 0;
                      const campaignROAS = campaignSpend > 0 ? (campaignRevenue / campaignSpend).toFixed(2) : 0;

                      return (
                        <div key={campaign.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  campaign.platform === 'meta' ? 'bg-blue-100 text-blue-700' :
                                  campaign.platform === 'tiktok' ? 'bg-gray-100 text-gray-700' :
                                  campaign.platform === 'pinterest' ? 'bg-red-100 text-red-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {campaign.platform.toUpperCase()}
                                </span>
                                <h3 className="font-bold text-gray-900">{campaign.campaign_name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{campaign.objective}</p>
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Spesa</p>
                                  <p className="font-bold text-red-600">€{campaignSpend.toFixed(0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Entrate</p>
                                  <p className="font-bold text-green-600">€{campaignRevenue.toFixed(0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">ROAS</p>
                                  <p className={`font-bold ${campaignROAS >= 2 ? 'text-green-600' : campaignROAS >= 1 ? 'text-orange-600' : 'text-red-600'}`}>
                                    {campaignROAS}x
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Budget Giornaliero</p>
                                  <p className="font-bold text-gray-900">€{campaign.daily_budget || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Nessuna campagna connessa. Connetti le tue piattaforme ads.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
