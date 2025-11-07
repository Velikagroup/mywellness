
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Zap,
  CheckCircle // Added CheckCircle import
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

// Define countries array (placeholder/minimal for selectedCountry initialization)
const countries = [
  { code: 'IT', name: 'Italy' },
  // Add other countries as needed for future features
];

export default function AdminMarketing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Added to state for detailed funnel calculation

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

  // New state variables from outline
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'IT'));
  const [copiedLink, setCopiedLink] = useState(null);

  const APP_URL = window.location.origin;

  // New function from outline
  const copyTrackingLink = (platform, funnel) => {
    const baseUrl = funnel === 'trial' ? `${APP_URL}${createPageUrl('TrialSetup')}` : `${APP_URL}${createPageUrl('LandingCheckout')}`;
    const trackingUrl = `${baseUrl}?utm_source=organic_${platform}`;
    
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(`${platform}_${funnel}`);
    
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const copyPlatformLink = (platform) => {
    const baseUrl = selectedFunnel === 'trial' ? `${APP_URL}${createPageUrl('TrialSetup')}` : `${APP_URL}${createPageUrl('LandingCheckout')}`;
    const trackingUrl = `${baseUrl}?utm_source=organic_${platform}`;
    
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(`${platform}_${selectedFunnel}`);
    
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const copyAllOrganicLinks = () => {
    const socialPlatforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'twitter'];
    const baseUrl = selectedFunnel === 'trial' ? `${APP_URL}${createPageUrl('TrialSetup')}` : `${APP_URL}${createPageUrl('LandingCheckout')}`;
    
    const allLinks = socialPlatforms.map(platform => 
      `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${baseUrl}?utm_source=organic_${platform}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(allLinks);
    setCopiedLink('all_organic');
    
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // New function from outline
  const getSocialIcon = (platform) => {
    const icons = {
      instagram: '📸',
      facebook: '👥',
      tiktok: '🎵',
      youtube: '📺',
      linkedin: '💼',
      pinterest: '📌',
      twitter: '🐦'
    };
    return icons[platform] || '🔗';
  };

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
      const allUsersData = await base44.entities.User.list(); // Fetch all users

      setCampaigns(campaignsData);
      setMetrics(metricsData);
      setTransactions(allTransactionsData);
      setAllUsers(allUsersData); // Set all users in state

      const metricsFilteredByDate = metricsData.filter(m => {
        if (!m.date) return false;
        const metricDate = parseISO(m.date);
        return isWithinInterval(metricDate, { start: selectedDateRange[0], end: selectedDateRange[1] });
      });
      setAllMetricsFilteredByDate(metricsFilteredByDate);

      const platforms = ['meta', 'tiktok', 'pinterest', 'google'];
      const funnelData = {};

      // These overall counts are for the *paid* campaign funnel data,
      // currently a simplified distribution.
      // These calculations need to be refined to be specific to 'trial' or 'landing'
      // based on the selectedFunnel state, but for now they are broadly distributed.
      const totalQuizCompleted = allUsersData.filter(u => u.quiz_completed === true).length;
      const totalCheckoutStarted = allUsersData.filter(u => u.billing_name && u.billing_name.length > 0).length;
      const totalPurchases = allUsersData.filter(u => 
        selectedFunnel === 'trial' ? u.purchased_plan_type === 'subscription' : u.purchased_landing_offer === true
      ).length;


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
            // Use the simplified distributed funnel data for paid campaigns
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
  }, [selectedDateRange, user, selectedFunnel]); // Re-run loadMarketingData when selectedFunnel changes

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

  // Calcola funnel per piattaforme organiche in modo più accurato
  const organicSocialData = Object.values(organicSalesByPlatform).map(platformData => {
    // Get unique user IDs involved in successful transactions from this specific organic source within the selected date range.
    const userIdsForThisOrganicPlatform = [...new Set(
      platformData.transactions.filter(t => t.status === 'succeeded').map(t => t.user_id)
    )];
    
    // Filter the *entire* user list (`allUsers`) for those user IDs to get their full profiles
    const associatedUsers = allUsers.filter(user => userIdsForThisOrganicPlatform.includes(user.id));
    
    // Now count funnel steps based on these associated users' profiles
    const quizCompleted = associatedUsers.filter(u => u.quiz_completed === true).length;
    const checkoutStarted = associatedUsers.filter(u => u.billing_name && u.billing_name.length > 0).length;
    // Purchases are already correctly represented by platformData.sales (total successful transactions for this platform and date range)
    const purchases = platformData.sales;
    
    return {
      ...platformData,
      funnel: {
        quiz: quizCompleted,
        checkout: checkoutStarted,
        purchases: purchases
      }
    };
  });

  const totalOrganicSales = organicSocialSales.length;
  const totalOrganicRevenue = organicSocialSales.reduce((sum, s) => sum + s.amount, 0);

  // Calcola il funnel totale per le vendite organiche
  const totalOrganicFunnel = organicSocialData.reduce((acc, platform) => {
    return {
      quiz: acc.quiz + platform.funnel.quiz,
      checkout: acc.checkout + platform.funnel.checkout,
      purchases: acc.purchases + platform.funnel.purchases
    };
  }, { quiz: 0, checkout: 0, purchases: 0 });

  const totalOrganicConversionRate = totalOrganicFunnel.quiz > 0 
    ? ((totalOrganicFunnel.purchases / totalOrganicFunnel.quiz) * 100).toFixed(1) 
    : '0.0';

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

        {/* Connessione Piattaforme - Box Esterno con Accordion */}
        <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg">
          <AccordionItem value="item-1" className="border-none">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LinkIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                  Connetti Piattaforme Advertising
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1 mb-4">Collega i tuoi account pubblicitari per sincronizzare automaticamente le metriche</p>
                <AccordionTrigger className="hover:no-underline py-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Mostra piattaforme disponibili
                  </span>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-4">
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
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        {/* Funnel Tabs */}
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

        {/* Sezione Unificata: Vendite Organiche + Piattaforme Ads */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Performance per Piattaforma
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedFunnel === 'trial' ? 'Funnel Trial Setup' : 'Funnel Landing Checkout'}
              </p>
            </div>
          </div>

          {/* Box Vendite Organiche Social */}
          <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg">
            <AccordionItem value="item-1" className="border-none">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Vendite Organiche Social
                      </CardTitle>
                      <button
                        onClick={copyAllOrganicLinks}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-purple-100 transition-all border-2 border-purple-200"
                        title="Copia tutti i link di tracciamento organico"
                      >
                        {copiedLink === 'all_organic' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-purple-600" />
                        )}
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Totale Vendite</p>
                      <p className="text-3xl font-bold text-purple-600">{totalOrganicSales}</p>
                      <p className="text-sm text-gray-500">€{totalOrganicRevenue.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Vendite da attività organica</p>
                  
                  {/* Funnel Totale Organico */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Quiz Completati</p>
                      <p className="text-2xl font-bold text-indigo-600">{totalOrganicFunnel.quiz}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Checkout Iniziati</p>
                      <p className="text-2xl font-bold text-cyan-600">{totalOrganicFunnel.checkout}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Acquisti</p>
                      <p className="text-2xl font-bold text-emerald-600">{totalOrganicFunnel.purchases}</p>
                    </div>
                    <div className="text-center bg-white/50 rounded-lg py-2">
                      <p className="text-xs text-gray-600 mb-1">Conversione</p>
                      <p className="text-2xl font-black text-indigo-600">{totalOrganicConversionRate}%</p>
                    </div>
                  </div>
                  <AccordionTrigger className="hover:no-underline py-2 border-t border-gray-200 mt-4">
                    <span className="text-sm font-semibold text-gray-700">
                      Mostra dettagli per piattaforma
                    </span>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-4">
                    {organicSocialData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {organicSocialData.map((platform) => {
                          const platformName = platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1);
                          const conversionRate = platform.funnel.quiz > 0 
                            ? ((platform.funnel.purchases / platform.funnel.quiz) * 100).toFixed(1) 
                            : '0.0';
                          
                          return (
                            <div key={platform.platform} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900">{platformName}</h4>
                                <button
                                  onClick={() => copyPlatformLink(platform.platform)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-purple-100 transition-all border border-purple-200"
                                  title="Copia link di tracciamento"
                                >
                                  {copiedLink === `${platform.platform}_${selectedFunnel}` ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <LinkIcon className="w-5 h-5 text-purple-600" />
                                  )}
                                </button>
                              </div>

                              {/* Box Entrate Organiche */}
                              <div className="mb-4">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                  <p className="text-xs text-green-600 font-semibold mb-1">Entrate Organiche</p>
                                  <p className="text-2xl font-bold text-green-700">€{platform.revenue.toFixed(0)}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {platform.sales} vendite • AOV: €{platform.sales > 0 ? (platform.revenue / platform.sales).toFixed(0) : 0}
                                  </p>
                                </div>
                              </div>

                              {/* Funnel a Step */}
                              <div className="mb-4">
                                <h5 className="text-xs font-bold text-gray-900 mb-3">Funnel Conversione</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg text-sm">
                                    <span className="text-gray-700">Quiz</span>
                                    <span className="font-bold text-indigo-600">{platform.funnel.quiz}</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg text-sm">
                                    <span className="text-gray-700">Checkout</span>
                                    <span className="font-bold text-cyan-600">{platform.funnel.checkout}</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg text-sm">
                                    <span className="text-gray-700">Acquisti</span>
                                    <span className="font-bold text-emerald-600">{platform.funnel.purchases}</span>
                                  </div>
                                  <div className="mt-2 p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg border border-indigo-200">
                                    <p className="text-xs text-gray-600 mb-1">Conversione Quiz → Acquisto</p>
                                    <p className="text-xl font-black text-indigo-600">{conversionRate}%</p>
                                  </div>
                                </div>
                              </div>

                              {/* Transazioni Recenti */}
                              <div className="pt-3 border-t border-purple-200">
                                <p className="text-xs text-gray-500 mb-2">Transazioni Recenti</p>
                                <div className="space-y-1">
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
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Grid Piattaforme Ads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Meta', 'TikTok', 'Pinterest', 'Google'].map((platformDisplayName, index) => {
              const platformKey = platformDisplayName.toLowerCase();
              const isConnected = campaignsByPlatform.some(p => p.platform === platformKey && p.campaigns.length > 0);

              const platformGroup = campaignsByPlatform.find(p => p.platform === platformKey);
              const funnel = platformGroup?.funnel || { quiz: 0, checkout: 0, purchases: 0 };

              const platformSpend = platformGroup?.totalSpend || 0;
              const platformRevenue = platformGroup?.totalRevenue || 0;
              const platformROAS = platformSpend > 0 ? (platformRevenue / platformSpend).toFixed(2) : 0;

              // Mappa piattaforme ads a social organici
              const organicPlatforms = {
                meta: ['facebook', 'instagram'],
                tiktok: ['tiktok'],
                pinterest: ['pinterest'],
                google: ['youtube']
              };

              const handleCopyPlatformLinks = () => {
                const platforms = organicPlatforms[platformKey];
                if (platforms && platforms.length > 0) {
                  // Se ci sono più piattaforme (Meta), copia la prima
                  copyPlatformLink(platforms[0]);
                }
              };

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
                      <button
                        onClick={handleCopyPlatformLinks}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                          isConnected 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        title="Copia link di tracciamento organico"
                      >
                        {copiedLink?.startsWith(`${organicPlatforms[platformKey]?.[0]}_`) ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <LinkIcon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                        )}
                      </button>
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

                    {/* Funnel */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Funnel Conversione</h4>
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
