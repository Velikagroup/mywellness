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
import { format, subMonths, subDays, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const DATE_PRESETS = [
    { label: 'Tutto', value: 'all' },
    { label: 'Oggi', value: '1d' },
    { label: 'Ieri', value: 'yesterday' },
    { label: '7 giorni', value: '7d' },
    { label: '30 giorni', value: '30d' },
    { label: '3 mesi', value: '3m' },
    { label: '6 mesi', value: '6m' },
  ];

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

  const [stripeStats, setStripeStats] = useState({ monthly: { count: 0 }, yearly: { count: 0 }, trialing: { count: 0 } });
  const [quizActivities, setQuizActivities] = useState([]);
  const [siteVisitActivities, setSiteVisitActivities] = useState([]);

  const loadData = async () => {
    try {
      const [usersData] = await Promise.all([
        base44.entities.User.list()
      ]);
      setUsers(usersData);

      // Carica transazioni e stats Stripe in parallelo
      await Promise.all([
        (async () => {
          try {
            const txResponse = await base44.functions.invoke('adminListTransactions');
            const txData = txResponse.data || txResponse;
            if (txData.success && txData.transactions) setTransactions(txData.transactions);
          } catch (e) { console.error('Error loading transactions:', e); }
        })(),
        (async () => {
          try {
            const stripeResponse = await base44.functions.invoke('getSubscriptionStatsFromStripe');
            const stripeData = stripeResponse.data || stripeResponse;
            if (stripeData.success) setStripeStats(stripeData);
          } catch (e) { console.error('Error loading Stripe stats:', e); }
        })(),
        (async () => {
          try {
            const activities = await base44.entities.UserActivity.filter({ event_type: 'quiz_started' }, '-created_date', 5000);
            setQuizActivities(activities);
          } catch (e) { console.error('Error loading quiz activities:', e); }
        })(),
        (async () => {
          try {
            // Carica TUTTI gli UserActivity - ogni record = qualcuno ha interagito col sito
            const allVisits = await base44.entities.UserActivity.list('-created_date', 10000);
            setSiteVisitActivities(allVisits);
          } catch (e) { console.error('Error loading site visits:', e); }
        })()
      ]);
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
      const [usersData] = await Promise.all([
        base44.entities.User.list()
      ]);
      setUsers(usersData);
      console.log(`✅ ${usersData.length} utenti caricati`);

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
  // DATE RANGE FILTER
  // ============================================

  const getDateRange = () => {
    const now = new Date();
    if (activePreset === '1d') return { from: startOfDay(now), to: endOfDay(now) };
    if (activePreset === 'yesterday') { const y = subDays(now, 1); return { from: startOfDay(y), to: endOfDay(y) }; }
    if (activePreset === '7d') return { from: subDays(now, 7), to: now };
    if (activePreset === '30d') return { from: subDays(now, 30), to: now };
    if (activePreset === '3m') return { from: subMonths(now, 3), to: now };
    if (activePreset === '6m') return { from: subMonths(now, 6), to: now };
    if (activePreset === 'custom' && dateFrom && dateTo) return { from: new Date(dateFrom), to: endOfDay(new Date(dateTo)) };
    return null; // all time
  };

  const dateRange = getDateRange();

  const filterByDate = (items, dateField = 'created_date') => {
    if (!dateRange) return items;
    return items.filter(item => {
      const d = item[dateField] ? new Date(item[dateField]) : null;
      if (!d) return false;
      return d >= dateRange.from && d <= dateRange.to;
    });
  };

  const extractLanguageFromPath = (url) => {
    if (!url) return 'unknown';
    // Estrae lingua dal path: /it, /en, /es, /pt, /de, /fr
    const match = url.match(/^\/([a-z]{2})(?:\/|$)/);
    return match ? match[1] : 'unknown';
  };

  const filterByLanguage = (items) => {
    if (selectedLanguage === 'all') return items;
    return items.filter(item => {
      const url = item.utm_params?.ref || item.event_data?.page || '';
      const lang = extractLanguageFromPath(url);
      return lang === selectedLanguage;
    });
  };

  const filterByDateAndLanguage = (items, dateField = 'created_date') => {
    return filterByLanguage(filterByDate(items, dateField));
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const deduplicateTx = (txList) => {
    // Un pagamento Stripe genera SEMPRE 2 record: uno con payment_intent_id e uno con invoice_id.
    // Strategia: per ogni user_id + giorno (UTC), tieni solo il record con stripe_invoice_id.
    // Se non c'è invoice, tieni il payment_intent. Importo non usato come chiave perché potrebbe differire di 1 centesimo.
    const groups = new Map();
    for (const t of txList) {
      // Usa solo i primi 10 caratteri della data (YYYY-MM-DD) come giorno
      const day = t.payment_date ? t.payment_date.substring(0, 10) : 'nodate';
      // NON includere l'importo nella chiave — stesso user stesso giorno = stesso pagamento
      const key = `${t.user_id}__${day}`;
      if (!groups.has(key)) {
        groups.set(key, t);
      } else {
        const existing = groups.get(key);
        // Preferisci il record con stripe_invoice_id (più affidabile)
        if (t.stripe_invoice_id && !existing.stripe_invoice_id) {
          groups.set(key, t);
        }
      }
    }
    const result = Array.from(groups.values());
    console.log(`🧹 Deduplicazione: ${txList.length} tx → ${result.length} tx uniche`);
    return result;
  };

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

  // Dati abbonamenti: se c'è filtro data → usa transazioni filtrate, altrimenti usa Stripe (snapshot live)
  // Prezzi dei piani
  const PRICE_MAP = {
    monthly: 9.99,
    yearly: 49.99
  };

  let activeMonthlyUsers, activeYearlyUsers, totalActiveUsers, trialUsersCount;
  let monthlyRevenue = 0, yearlyRevenue = 0, totalSubscriptionRevenue = 0;

  if (dateRange) {
    // Filtra le transazioni per data e calcola i nuovi abbonamenti nel periodo
    // DEDUPLICATION: conta utenti unici, non transazioni (evita doppi per payment_intent + invoice)
    const filteredTx = filterByDate(transactions, 'payment_date');
    const succeededTx = deduplicateTx(filteredTx.filter(t => t.status === 'succeeded' && t.amount > 0));
    
    const monthlyTx = succeededTx.filter(t => t.billing_period === 'monthly');
    const yearlyTx = succeededTx.filter(t => t.billing_period === 'yearly');
    
    const uniqueMonthlyUsers = new Set(monthlyTx.map(t => t.user_id));
    const uniqueYearlyUsers = new Set(yearlyTx.map(t => t.user_id));
    activeMonthlyUsers = uniqueMonthlyUsers.size;
    activeYearlyUsers = uniqueYearlyUsers.size;
    totalActiveUsers = activeMonthlyUsers + activeYearlyUsers;
    
    // Calcola ricavi per piano (su transazioni deduplicate)
    monthlyRevenue = monthlyTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    yearlyRevenue = yearlyTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    totalSubscriptionRevenue = monthlyRevenue + yearlyRevenue;
    
    // Trial nel periodo: utenti unici con transazione trial_setup
    const uniqueTrialUsers = new Set(filteredTx.filter(t => t.type === 'trial_setup').map(t => t.user_id));
    trialUsersCount = uniqueTrialUsers.size;
  } else {
    // Totale da Stripe (source of truth per snapshot attuale)
    activeMonthlyUsers = stripeStats.monthly.count;
    activeYearlyUsers = stripeStats.yearly.count;
    totalActiveUsers = activeMonthlyUsers + activeYearlyUsers;
    trialUsersCount = stripeStats.trialing.count;
    
    // Ricavi calcolati da abbonamenti attivi × prezzo
    monthlyRevenue = activeMonthlyUsers * PRICE_MAP.monthly;
    yearlyRevenue = activeYearlyUsers * PRICE_MAP.yearly;
    totalSubscriptionRevenue = monthlyRevenue + yearlyRevenue;
  }

  // Visite pagina quiz per lingua (da event_data.language)
  const LANG_LABELS = { it: '🇮🇹 IT', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR' };
  const LANG_LABELS_SITE = { it: '🇮🇹 IT', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR', unknown: '❓' };

  const filteredSiteVisits = filterByDate(siteVisitActivities);
  const filteredQuizActivities = filterByDate(quizActivities);
  const filteredUsers = filterByDate(users);

  const totalSiteVisits = filteredSiteVisits.length;
  const anonymousCount = filteredSiteVisits.filter(v => v.user_id === 'anonymous').length;
  const loggedInUserIds = new Set(filteredSiteVisits.filter(v => v.user_id !== 'anonymous').map(v => v.user_id));
  const uniqueSiteVisitors = anonymousCount + loggedInUserIds.size;

  const siteVisitsByLang = filterByDate(siteVisitActivities).reduce((acc, v) => {
    const url = v.utm_params?.ref || v.event_data?.page || '';
    const lang = extractLanguageFromPath(url);
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const quizVisitsByLang = filterByDate(quizActivities).reduce((acc, a) => {
    const url = a.utm_params?.ref || a.event_data?.page || '';
    const lang = extractLanguageFromPath(url);
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});
  const totalQuizVisits = filteredQuizActivities.length;
  const quizAnonCount = filteredQuizActivities.filter(a => a.user_id === 'anonymous').length;
  const quizLoggedIds = new Set(filteredQuizActivities.filter(a => a.user_id !== 'anonymous').map(a => a.user_id));
  const uniqueQuizVisitors = quizAnonCount + quizLoggedIds.size;

  // Section 2: Funnel
  const totalRegistrations = dateRange ? filteredUsers.length : users.length;
  const quizCompleted = (dateRange ? filteredUsers : users).filter(u => u.quiz_completed === true).length;
  // trialsStarted = chi è ATTUALMENTE nel trial (non ancora convertito) — da Stripe
  const trialsStarted = trialUsersCount;
  // trialsConverted = chi ha completato il trial ed è ora active annuale
  const trialsConverted = activeYearlyUsers;
  const subscriptionsActive = totalActiveUsers;

  // Conversion rates → paganti
  const pct = (num, denom) => denom > 0 ? ((num / denom) * 100).toFixed(1) + '%' : '—';
  const convSite = pct(subscriptionsActive, uniqueSiteVisitors);
  const convQuiz = pct(subscriptionsActive, uniqueQuizVisitors);
  const convQuizCompleted = pct(subscriptionsActive, quizCompleted);
  const convRegistrations = pct(subscriptionsActive, totalRegistrations);

  // Il totale di chi ha mai avuto un trial (in corso + convertiti) per calcolare il rate
  const totalEverTrialed = trialUsersCount + trialsConverted;
  const trialConversionRate = totalEverTrialed > 0 
    ? ((trialsConverted / totalEverTrialed) * 100).toFixed(1) 
    : 0;

  // Section 3: Revenue
  const filteredTxForRevenue = dateRange ? filterByDate(transactions, 'payment_date') : transactions;
  const succeededTxAll = deduplicateTx(filteredTxForRevenue.filter(t => t.status === 'succeeded'));
  const periodRevenue = succeededTxAll.reduce((sum, t) => sum + (t.amount || 0), 0);

  const mrr = dateRange ? succeededTxAll.filter(t => t.billing_period === 'monthly').reduce((s, t) => s + (t.amount || 0), 0)
    : activeMonthlyUsers * PRICE_MAP.monthly;
  const arr = dateRange ? succeededTxAll.filter(t => t.billing_period === 'yearly').reduce((s, t) => s + (t.amount || 0), 0)
    : activeYearlyUsers * PRICE_MAP.yearly;
  const totalActiveRevenue = dateRange ? periodRevenue : (activeMonthlyUsers * PRICE_MAP.monthly + activeYearlyUsers * PRICE_MAP.yearly);

  // Revenue trend — adattato al range selezionato
  const getRevenueTrend = () => {
    const txSource = deduplicateTx(transactions.filter(t => t.payment_date && t.status === 'succeeded'));

    // Se filtro ≤ 2 giorni → raggruppa per ora
    if (dateRange && (activePreset === '1d' || activePreset === 'yesterday')) {
      const trends = [];
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(dateRange.from);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(dateRange.from);
        hourEnd.setHours(h, 59, 59, 999);
        const rev = txSource
          .filter(t => { const d = new Date(t.payment_date); return d >= hourStart && d <= hourEnd; })
          .reduce((s, t) => s + t.amount, 0);
        trends.push({ month: `${h}:00`, revenue: parseFloat(rev.toFixed(2)) });
      }
      return trends;
    }

    // Se filtro ≤ 31 giorni → raggruppa per giorno
    if (dateRange && (activePreset === '7d' || activePreset === '30d')) {
      const days = activePreset === '7d' ? 7 : 30;
      const trends = [];
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const rev = txSource
          .filter(t => { const d = new Date(t.payment_date); return d >= dayStart && d <= dayEnd; })
          .reduce((s, t) => s + t.amount, 0);
        trends.push({ month: format(day, 'd MMM', { locale: it }), revenue: parseFloat(rev.toFixed(2)) });
      }
      return trends;
    }

    // Caso custom: calcola la durata in giorni e scegli granularità
    if (dateRange && activePreset === 'custom') {
      const diffMs = dateRange.to - dateRange.from;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) {
        // Per-ora
        const trends = [];
        for (let h = 0; h < 24; h++) {
          const hourStart = new Date(dateRange.from);
          hourStart.setHours(h, 0, 0, 0);
          const hourEnd = new Date(dateRange.from);
          hourEnd.setHours(h, 59, 59, 999);
          const rev = txSource
            .filter(t => { const d = new Date(t.payment_date); return d >= hourStart && d <= hourEnd; })
            .reduce((s, t) => s + t.amount, 0);
          trends.push({ month: `${h}:00`, revenue: parseFloat(rev.toFixed(2)) });
        }
        return trends;
      } else if (diffDays <= 90) {
        // Per-giorno
        const trends = [];
        for (let i = 0; i < diffDays; i++) {
          const day = new Date(dateRange.from);
          day.setDate(day.getDate() + i);
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const rev = txSource
            .filter(t => { const d = new Date(t.payment_date); return d >= dayStart && d <= dayEnd; })
            .reduce((s, t) => s + t.amount, 0);
          trends.push({ month: format(day, 'd MMM', { locale: it }), revenue: parseFloat(rev.toFixed(2)) });
        }
        return trends;
      } else {
        // Per-mese
        const totalMonths = Math.ceil(diffDays / 30);
        const trends = [];
        for (let i = 0; i < totalMonths; i++) {
          const monthDate = new Date(dateRange.from);
          monthDate.setMonth(monthDate.getMonth() + i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const rev = txSource
            .filter(t => { const d = new Date(t.payment_date); return d >= monthStart && d <= monthEnd && d >= dateRange.from && d <= dateRange.to; })
            .reduce((s, t) => s + t.amount, 0);
          trends.push({ month: format(monthDate, 'MMM yy', { locale: it }), revenue: parseFloat(rev.toFixed(2)) });
        }
        return trends;
      }
    }

    // Default: raggruppa per mese (ultimi N mesi)
    const months = activePreset === '3m' ? 3 : activePreset === '6m' ? 6 : 6;
    const trends = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const rev = txSource
        .filter(t => { const d = parseISO(t.payment_date); return isWithinInterval(d, { start: monthStart, end: monthEnd }); })
        .reduce((s, t) => s + t.amount, 0);
      trends.push({ month: format(monthDate, 'MMM yy', { locale: it }), revenue: parseFloat(rev.toFixed(2)) });
    }
    return trends;
  };

  const revenueTrend = getRevenueTrend();
  const revenueTrendLabel = activePreset === '1d' ? 'Oggi (per ora)'
    : activePreset === 'yesterday' ? 'Ieri (per ora)'
    : activePreset === '7d' ? 'Ultimi 7 giorni'
    : activePreset === '30d' ? 'Ultimi 30 giorni'
    : activePreset === '3m' ? 'Ultimi 3 mesi'
    : activePreset === '6m' ? 'Ultimi 6 mesi'
    : activePreset === 'custom' ? 'Periodo personalizzato'
    : 'Ultimi 6 mesi';

  // Section 4: Distribution
  const distributionData = [
    { name: 'Mensile', value: activeMonthlyUsers, color: COLORS.monthly },
    { name: 'Annuale', value: activeYearlyUsers, color: COLORS.yearly }
  ];

  // Section 5: Retention & Churn
  const usersForChurn = dateRange ? filteredUsers : users;
  const cancelledUsers = usersForChurn.filter(u => u.subscription_status === 'cancelled').length;
  const expiredUsers = usersForChurn.filter(u => u.subscription_status === 'expired').length;
  const totalChurned = cancelledUsers + expiredUsers;
  const churnRate = totalActiveUsers > 0 
    ? ((totalChurned / (totalActiveUsers + totalChurned)) * 100).toFixed(1) 
    : 0;
  const retentionRate = (100 - parseFloat(churnRate)).toFixed(1);

  // Section 6: User Behaviour
  const behaviourUsers = dateRange ? filteredUsers : users;
  const registeredNoQuiz = behaviourUsers.filter(u => !u.quiz_completed).length;
  const quizCompletedUsers = quizCompleted;
  const usersWithTrial = trialUsersCount;
  const payingUsers = totalActiveUsers;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Dashboard strategica per decisioni business</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date presets */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              {DATE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => { setActivePreset(preset.value); setShowDatePicker(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activePreset === preset.value
                      ? 'bg-[#26847F] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              {/* Custom range toggle */}
              <button
                onClick={() => { setShowDatePicker(v => !v); setActivePreset('custom'); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all ${
                  activePreset === 'custom'
                    ? 'bg-[#26847F] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Personalizzato
              </button>
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
        </div>

        {/* Custom date range picker */}
        {showDatePicker && activePreset === 'custom' && (
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">Dal</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26847F]"
            />
            <span className="text-sm font-semibold text-gray-700">Al</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26847F]"
            />
            {dateFrom && dateTo && (
              <span className="text-xs text-gray-500">
                {format(new Date(dateFrom), 'd MMM yyyy', { locale: it })} → {format(new Date(dateTo), 'd MMM yyyy', { locale: it })}
              </span>
            )}
          </div>
        )}

        {/* Active filter badge */}
        {(activePreset !== 'all' || selectedLanguage !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            {activePreset !== 'all' && (
              <span className="text-xs font-semibold text-[#26847F] bg-[#26847F]/10 px-3 py-1 rounded-full">
                📅 Filtro attivo: {activePreset === 'custom' ? `${dateFrom || '?'} → ${dateTo || '?'}` : DATE_PRESETS.find(p => p.value === activePreset)?.label}
              </span>
            )}
            {selectedLanguage !== 'all' && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                🌐 Lingua: {{ it: 'Italiano', en: 'English', es: 'Español', pt: 'Português', de: 'Deutsch', fr: 'Français' }[selectedLanguage]}
              </span>
            )}
            <button onClick={() => { setActivePreset('all'); setDateFrom(''); setDateTo(''); setSelectedLanguage('all'); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Rimuovi filtri</button>
          </div>
        )}

        {/* Language Filter */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
          <span className="text-xs font-semibold text-gray-600 px-3">🌐 Lingua:</span>
          {['all', 'it', 'en', 'es', 'pt', 'de', 'fr'].map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedLanguage === lang
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {lang === 'all' ? 'Tutte' : { it: '🇮🇹 IT', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR' }[lang]}
            </button>
          ))}
        </div>

        {/* SECTION 2: Funnel */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Funnel Conversione (CORE BUSINESS)</h2>
          <Card className="water-glass-effect border-gray-200/30">
            <CardContent className="p-8">
              <div className="space-y-4">

                {/* STEP -1: Visite Sito Totali */}
                <div className="bg-slate-50 rounded-xl border-2 border-slate-300 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 text-lg">Visite Sito Totali</span>
                    <div className="flex gap-6 items-end">
                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-900">{totalSiteVisits}</div>
                        <div className="text-xs text-slate-500">visite totali</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-700">{uniqueSiteVisitors}</div>
                        <div className="text-xs text-slate-500">visitatori unici</div>
                      </div>
                      <div className="text-right border-l border-slate-300 pl-6">
                        <div className="text-3xl font-black text-green-700">{convSite}</div>
                        <div className="text-xs text-green-600">conv. → paganti</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(siteVisitsByLang).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                      <span key={lang} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                        {LANG_LABELS_SITE[lang] || lang}: {count}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 italic mt-2">📊 Tutti gli eventi tracciati (quiz avviati, pricing, checkout, ecc.) dal Nov 2025. Gli utenti anonimi sono contati per evento (no cookie tracking).</p>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center">
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>

                {/* STEP 0: Visite Quiz */}
                <div className="bg-orange-50 rounded-xl border-2 border-orange-300 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-orange-900 text-lg">Visite Pagina Quiz</span>
                    <div className="flex gap-6 items-end">
                      <div className="text-right">
                        <div className="text-3xl font-black text-orange-900">{totalQuizVisits}</div>
                        <div className="text-xs text-orange-600">visite totali</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-orange-700">{uniqueQuizVisitors}</div>
                        <div className="text-xs text-orange-600">utenti unici</div>
                      </div>
                      <div className="text-right border-l border-orange-300 pl-6">
                        <div className="text-3xl font-black text-green-700">{convQuiz}</div>
                        <div className="text-xs text-green-600">conv. → paganti</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(quizVisitsByLang).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                      <span key={lang} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                        {LANG_LABELS[lang] || lang}: {count}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 italic">⚠️ Il tracking per lingua è attivo dal 23/02/2026 — i dati precedenti non hanno lingua e appaiono tutti come 🇮🇹 IT</p>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center">
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>

                {/* STEP 1: Quiz Completati */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-indigo-50 rounded-xl p-5 flex items-center justify-between border-2 border-indigo-300">
                    <span className="font-bold text-indigo-900 text-lg">Quiz Completati</span>
                    <div className="flex gap-6 items-end">
                      <div className="text-right">
                        <div className="text-3xl font-black text-indigo-900">{quizCompleted}</div>
                        <div className="text-xs text-indigo-600">utenti registrati</div>
                      </div>
                      <div className="text-right border-l border-indigo-300 pl-6">
                        <div className="text-3xl font-black text-green-700">{convQuizCompleted}</div>
                        <div className="text-xs text-green-600">conv. → paganti</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center">
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>

                {/* STEP 2: Registrazione */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-100 rounded-xl p-5 flex items-center justify-between border-2 border-gray-300">
                    <span className="font-bold text-gray-900 text-lg">Registrazioni Totali</span>
                    <div className="flex gap-6 items-end">
                      <div className="text-right">
                        <div className="text-3xl font-black text-gray-900">{totalRegistrations}</div>
                        <div className="text-xs text-gray-500">utenti registrati</div>
                      </div>
                      <div className="text-right border-l border-gray-300 pl-6">
                        <div className="text-3xl font-black text-green-700">{convRegistrations}</div>
                        <div className="text-xs text-green-600">conv. → paganti</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center">
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>

                {/* STEP 3: Scelta piano — mensile e annuale sulla stessa riga */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl h-24 flex flex-col items-center justify-center border-2 border-blue-300">
                    <span className="font-bold text-blue-900 text-sm mb-1">Piano Mensile</span>
                    <span className="text-xs text-blue-600 mb-2">€9.99/mese — pagamento diretto</span>
                    <span className="font-black text-blue-900 text-3xl">{activeMonthlyUsers}</span>
                  </div>
                  <div className="bg-purple-50 rounded-xl h-24 flex flex-col items-center justify-center border-2 border-purple-300">
                    <span className="font-bold text-purple-900 text-sm mb-1">Piano Annuale (Trial 3gg)</span>
                    <span className="text-xs text-purple-600 mb-2">€49.99/anno — dopo trial gratuito</span>
                    <span className="font-black text-purple-900 text-3xl">{trialsStarted}</span>
                  </div>
                </div>

                {/* Arrow down — solo lato annuale */}
                <div className="flex justify-end pr-[calc(25%-0.5rem)]">
                  <div className="w-1 h-8 bg-purple-300"></div>
                </div>

                {/* STEP 4 (solo piano annuale): Trial Convertiti */}
                <div className="flex justify-end">
                  <div className="w-1/2 bg-teal-50 rounded-xl h-20 flex items-center justify-between px-8 border-2 border-teal-300">
                    <span className="font-bold text-teal-900 text-base">Trial Convertiti (Annuale)</span>
                    <span className="font-black text-teal-900 text-3xl">{trialsConverted}</span>
                  </div>
                </div>

                {/* Arrow down — full width */}
                <div className="flex justify-center">
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>

                {/* STEP FINALE: Totale Abbonamenti Attivi */}
                <div className="bg-green-50 rounded-xl border-2 border-green-400 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-green-900 text-lg">✅ Totale Abbonamenti Attivi</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-8 items-end">
                      <div className="text-right flex-1">
                        <div className="text-sm font-semibold text-blue-700 mb-2">Mensili</div>
                        <div className="text-4xl font-black text-blue-900">{activeMonthlyUsers}</div>
                        <div className="text-sm font-semibold text-blue-600 mt-3">€{monthlyRevenue.toFixed(2)}</div>
                      </div>
                      <div className="text-right flex-1">
                        <div className="text-sm font-semibold text-teal-700 mb-2">Annuali</div>
                        <div className="text-4xl font-black text-teal-900">{activeYearlyUsers}</div>
                        <div className="text-sm font-semibold text-teal-600 mt-3">€{yearlyRevenue.toFixed(2)}</div>
                      </div>
                      <div className="text-right flex-1 border-l-2 border-green-300 pl-8">
                        <div className="text-sm font-semibold text-green-700 mb-2">Totale</div>
                        <div className="text-4xl font-black text-green-900">{totalActiveUsers}</div>
                        <div className="text-sm font-semibold text-green-600 mt-3">€{totalSubscriptionRevenue.toFixed(2)}</div>
                      </div>
                    </div>
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
                              outerRadius={90}
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
                  </div>
                </div>



              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Revenue Dashboard */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Dashboard</h2>
          
          <Card className="water-glass-effect border-gray-200/30">
            <CardHeader>
              <CardTitle>Crescita Revenue — {revenueTrendLabel}</CardTitle>
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

        {/* SECTION 5.5: Transazioni Recenti */}




      </div>
    </div>
  );
}