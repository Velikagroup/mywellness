import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Target,
  Link as LinkIcon,
  BarChart3,
  ShoppingCart,
  Copy,
  Check,
  Share2,
  Users
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
  const [allUsers, setAllUsers] = useState([]);
  const [copiedLink, setCopiedLink] = useState(null);

  const [selectedDateRange, setSelectedDateRange] = useState([
    subDays(new Date(), 30),
    new Date()
  ]);

  const loadMarketingData = async () => {
    setIsLoading(true);
    try {
      const [campaignsData, metricsData, allTransactionsData, usersData] = await Promise.all([
        base44.entities.AdCampaign.list(),
        base44.entities.AdMetric.list(),
        base44.entities.Transaction.list(),
        base44.entities.User.list()
      ]);

      setCampaigns(campaignsData);
      setMetrics(metricsData);
      setTransactions(allTransactionsData);
      setAllUsers(usersData);

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

  // Organic/Landing Funnel Data
  const organicSources = [
    { key: 'instagram_organic', name: 'Instagram', color: '#E4405F', icon: '📸' },
    { key: 'facebook_organic', name: 'Facebook', color: '#1877F2', icon: '📘' },
    { key: 'tiktok_organic', name: 'TikTok', color: '#000000', icon: '🎵' },
    { key: 'youtube_organic', name: 'YouTube', color: '#FF0000', icon: '▶️' },
    { key: 'pinterest_organic', name: 'Pinterest', color: '#E60023', icon: '📌' },
    { key: 'direct', name: 'Diretto', color: '#6B7280', icon: '🔗' }
  ];

  const getOrganicStats = () => {
    return organicSources.map(source => {
      const sourceUsers = allUsers.filter(u => u.traffic_source === source.key);
      const quizCompleted = sourceUsers.filter(u => u.quiz_completed).length;
      const checkoutStarted = sourceUsers.filter(u => u.billing_name && u.billing_name.length > 0).length;
      const purchases = sourceUsers.filter(u => u.purchased_landing_offer).length;
      
      const revenue = transactions
        .filter(t => {
          const user = allUsers.find(u => u.id === t.user_id);
          return user && user.traffic_source === source.key && t.status === 'succeeded';
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        ...source,
        users: sourceUsers.length,
        quizCompleted,
        checkoutStarted,
        purchases,
        revenue: revenue,
        conversionRate: quizCompleted > 0 ? ((purchases / quizCompleted) * 100).toFixed(1) : 0
      };
    }).filter(s => s.users > 0);
  };

  const organicStats = getOrganicStats();
  const totalOrganicRevenue = organicStats.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrganicPurchases = organicStats.reduce((sum, s) => sum + s.purchases, 0);
  const totalOrganicUsers = organicStats.reduce((sum, s) => sum + s.users, 0);

  // Ads Performance Data
  const metricsFilteredByDate = metrics.filter(m => {
    if (!m.date) return false;
    const metricDate = parseISO(m.date);
    return isWithinInterval(metricDate, { start: selectedDateRange[0], end: selectedDateRange[1] });
  });

  const platformsAds = ['meta', 'tiktok', 'pinterest', 'google'];
  const campaignsByPlatform = campaigns.reduce((acc, campaign) => {
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
        totalImpressions: 0
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

  const campaignsByPlatformArray = Object.values(campaignsByPlatform);
  
  const totalSpendAds = campaignsByPlatformArray.reduce((sum, p) => sum + p.totalSpend, 0);
  const totalRevenueAds = campaignsByPlatformArray.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalConversionsAds = campaignsByPlatformArray.reduce((sum, p) => sum + p.totalConversions, 0);
  const overallROAS = totalSpendAds > 0 ? (totalRevenueAds / totalSpendAds).toFixed(2) : 0;

  const handleCopyLink = (sourceKey) => {
    const baseUrl = window.location.origin;
    const landingUrl = `${baseUrl}${createPageUrl('Landing')}?source=${sourceKey}`;
    navigator.clipboard.writeText(landingUrl);
    setCopiedLink(sourceKey);
    setTimeout(() => setCopiedLink(null), 2000);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Analytics</h1>
          <p className="text-gray-600">Performance campagne pubblicitarie e traffico organico</p>
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ads">Campagne Ads</TabsTrigger>
            <TabsTrigger value="organic">Landing & Organico</TabsTrigger>
          </TabsList>

          {/* ADS PERFORMANCE TAB */}
          <TabsContent value="ads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Spesa Ads</p>
                      <p className="text-3xl font-bold text-red-600">€{totalSpendAds.toLocaleString('it-IT')}</p>
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
                      <p className="text-3xl font-bold text-green-600">€{totalRevenueAds.toLocaleString('it-IT')}</p>
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
                      <p className="text-sm text-gray-500 mb-1">ROAS Ads</p>
                      <p className={`text-3xl font-bold ${overallROAS >= 2 ? 'text-green-600' : overallROAS >= 1 ? 'text-orange-600' : 'text-red-600'}`}>
                        {overallROAS}x
                      </p>
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
                      <p className="text-sm text-gray-500 mb-1">Conversioni Ads</p>
                      <p className="text-3xl font-bold text-purple-600">{totalConversionsAds}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Meta', 'TikTok', 'Pinterest', 'Google'].map((platformDisplayName, index) => {
                const platformKey = platformDisplayName.toLowerCase();
                const isConnected = campaignsByPlatformArray.some(p => p.platform === platformKey && p.campaigns.length > 0);
                
                const platformGroup = campaignsByPlatformArray.find(p => p.platform === platformKey);
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ORGANIC/LANDING FUNNEL TAB */}
          <TabsContent value="organic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Utenti Organici</p>
                      <p className="text-3xl font-bold text-blue-600">{totalOrganicUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Entrate Organiche</p>
                      <p className="text-3xl font-bold text-green-600">€{totalOrganicRevenue.toLocaleString('it-IT')}</p>
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
                      <p className="text-sm text-gray-500 mb-1">Acquisti Organici</p>
                      <p className="text-3xl font-bold text-purple-600">{totalOrganicPurchases}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Valore Medio</p>
                      <p className="text-3xl font-bold text-teal-600">
                        €{totalOrganicPurchases > 0 ? (totalOrganicRevenue / totalOrganicPurchases).toFixed(0) : 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Link di Tracking */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  Link di Tracking per Social Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 mb-4">
                  Usa questi link univoci per tracciare le conversioni da ogni social network. Copia e condividi nella bio o nei post.
                </p>
                {organicSources.map(source => {
                  const landingUrl = `${window.location.origin}${createPageUrl('Landing')}?source=${source.key}`;
                  return (
                    <div key={source.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl">{source.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{source.name}</p>
                        <p className="text-xs text-gray-500 truncate">{landingUrl}</p>
                      </div>
                      <Button
                        onClick={() => handleCopyLink(source.key)}
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        {copiedLink === source.key ? (
                          <><Check className="w-4 h-4 mr-1" /> Copiato</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-1" /> Copia</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Performance per Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organicStats.map((source, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-2xl">{source.icon}</span>
                          {source.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Traffico Organico</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Utenti</p>
                        <p className="text-lg font-bold text-blue-700">{source.users}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-600 font-semibold mb-1">Entrate</p>
                        <p className="text-lg font-bold text-green-700">€{source.revenue.toFixed(0)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-600 font-semibold mb-1">Conv.</p>
                        <p className="text-lg font-bold text-purple-700">{source.conversionRate}%</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Funnel Landing</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm">
                          <span className="text-gray-700">Quiz Completati</span>
                          <span className="font-bold text-indigo-600">{source.quizCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-cyan-50 rounded-lg text-sm">
                          <span className="text-gray-700">Checkout Iniziati</span>
                          <span className="font-bold text-cyan-600">{source.checkoutStarted}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg text-sm">
                          <span className="text-gray-700">Acquisti</span>
                          <span className="font-bold text-emerald-600">{source.purchases}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}